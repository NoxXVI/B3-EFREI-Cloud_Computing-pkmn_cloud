#!/usr/bin/env node
/**
 * Synchronise le prix du modèle IA utilisé par l'application vers Langfuse.
 *
 * Les prix sont lus depuis le catalogue public models.dev (celui utilisé par
 * l'inférence OpenCode) puis convertis de « USD par million de tokens » vers
 * « USD par token », l'unité attendue par Langfuse.
 *
 * Usage :
 *   pnpm langfuse:sync-model
 */

const BASE_URL = (
  process.env.LANGFUSE_BASE_URL ?? "https://cloud.langfuse.com"
).replace(/\/+$/, "");

const PUBLIC_KEY = process.env.LANGFUSE_PUBLIC_KEY;
const SECRET_KEY = process.env.LANGFUSE_SECRET_KEY;
const MODEL_ID =
  process.env.AI_MODEL ??
  process.env.AI_MODEL_NAME ??
  "deepseek-v4.1-flash";
const PROVIDER_ID = process.env.LANGFUSE_MODEL_PROVIDER ?? "opencode";
const CATALOG_URL = "https://models.dev/api.json";

if (!PUBLIC_KEY || !SECRET_KEY) {
  console.error(
    "LANGFUSE_PUBLIC_KEY et LANGFUSE_SECRET_KEY doivent être définies (voir .env.local).",
  );
  process.exit(1);
}

const auth = `Basic ${Buffer.from(`${PUBLIC_KEY}:${SECRET_KEY}`).toString("base64")}`;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const perToken = (pricePerMillion) => pricePerMillion / 1_000_000;

async function main() {
  console.log(`Catalogue : ${CATALOG_URL}`);
  const catalogResponse = await fetch(CATALOG_URL);

  if (!catalogResponse.ok) {
    throw new Error(
      `Impossible de lire le catalogue models.dev (HTTP ${catalogResponse.status}).`,
    );
  }

  const catalog = await catalogResponse.json();
  const model = catalog[PROVIDER_ID]?.models?.[MODEL_ID];

  if (!model) {
    throw new Error(
      `Modèle « ${MODEL_ID} » introuvable pour le provider « ${PROVIDER_ID} ».`,
    );
  }

  const rawCost = Array.isArray(model.cost) ? model.cost[0] : model.cost;

  if (
    !rawCost ||
    typeof rawCost.input !== "number" ||
    typeof rawCost.output !== "number"
  ) {
    throw new Error(
      `Prix indisponibles pour « ${PROVIDER_ID}/${MODEL_ID} » dans le catalogue.`,
    );
  }

  const prices = {
    input: perToken(rawCost.input),
    output: perToken(rawCost.output),
  };

  if (typeof rawCost.cache_read === "number") {
    // Clé produite par le callback LangChain (@langfuse/langchain) pour
    // usage_metadata.input_token_details.cache_read.
    prices.input_cache_read = perToken(rawCost.cache_read);
  }

  // Les tokens de raisonnement sont extraits de `output` par le callback et
  // exposés séparément : ils restent facturés au prix de sortie.
  prices.output_reasoning = perToken(rawCost.output);

  const payload = {
    modelName: MODEL_ID,
    matchPattern: `(?i)^${escapeRegex(MODEL_ID)}$`,
    unit: "TOKENS",
    pricingTiers: [
      {
        name: "Standard",
        isDefault: true,
        priority: 0,
        conditions: [],
        prices,
      },
    ],
  };

  const modelDefinitionId = `pkmn-cloud-${MODEL_ID.replace(
    /[^a-zA-Z0-9._-]+/g,
    "-",
  )}`;

  const response = await fetch(
    `${BASE_URL}/api/public/models/${modelDefinitionId}`,
    {
      method: "PUT",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Échec de la synchronisation Langfuse (HTTP ${response.status}) : ${body}`,
    );
  }

  const saved = await response.json();

  console.log(
    [
      `Modèle synchronisé : ${saved.modelName} (id: ${saved.id})`,
      `  entrée      : ${rawCost.input} USD / M tokens`,
      `  sortie      : ${rawCost.output} USD / M tokens`,
      typeof rawCost.cache_read === "number"
        ? `  cache read  : ${rawCost.cache_read} USD / M tokens`
        : null,
      `  raisonnement: ${rawCost.output} USD / M tokens (aligné sur la sortie)`,
      "Langfuse calcule désormais le coût des générations avec ces prix.",
    ]
      .filter(Boolean)
      .join("\n"),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
