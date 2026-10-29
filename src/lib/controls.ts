import "server-only";
import { redis } from "./cache";
import { createAdminClient } from "./supabase/admin";
import type { Control } from "@/lib/app-status";

export const databaseControl: Control = {
  service: "Supabase Database",
  description: "Base de données des fiches",
  verify: async () => {
    const supabase = createAdminClient();
    const { count, error } = await supabase
      .from("checklists")
      .select("id", { count: "exact", head: true });

    if (error) {
      throw new Error(error.message);
    }

    return `${count ?? 0} checklist(s) enregistrée(s)`;
  },
};

const authControl: Control = {
  service: "Supabase Auth",
  description: "Connexion des utilisateurs",
  verify: async () => {
    const supabase = createAdminClient();
    const { error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    if (error) {
      throw new Error(error.message);
    }

    return "Service d'authentification joignable";
  },
};

const cacheControl: Control = {
  service: "Upstash Redis",
  description: "Cache des Pokédex et quotas de l'assistant",
  verify: async () => {
    const response = await redis.ping();

    if (response !== "PONG") {
      throw new Error("Réponse inattendue du cache.");
    }

    return "Cache joignable";
  },
};

const aiControl: Control = {
  service: "Fournisseur IA",
  description: "Modèle utilisé par l'assistant",
  verify: async () => {
    const baseUrl = (
      process.env.AI_BASE_URL ??
      process.env.AI_PROVIDER_URL ??
      "https://opencode.ai/inference/go/openai/v1"
    ).replace(/\/+$/, "");
    const apiKey = process.env.AI_API_KEY;
    const model =
      process.env.AI_MODEL ?? process.env.AI_MODEL_NAME ?? "non configuré";

    if (!apiKey) {
      throw new Error("AI_API_KEY est absente.");
    }

    // Appel minimal (1 token) : vérifie la clé et le modèle sans consommer
    // de génération utile. L'en-tête de session est exigé par l'inférence
    // OpenCode et ignoré par les fournisseurs OpenAI-compatibles classiques.
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "x-opencode-session": "pkmn-cloud-admin-health",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 1,
      }),
      signal: AbortSignal.timeout(4500),
    });

    if (!response.ok) {
      throw new Error(`Le fournisseur IA répond ${response.status}.`);
    }

    return `Modèle ${model} joignable`;
  },
};

const langfuseControl: Control = {
  service: "Langfuse",
  description: "Traces, tokens et coûts de l'assistant",
  verify: async () => {
    const baseUrl = process.env.LANGFUSE_BASE_URL?.replace(/\/+$/, "");
    const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
    const secretKey = process.env.LANGFUSE_SECRET_KEY;

    if (!baseUrl || !publicKey || !secretKey) {
      throw new Error("Configuration Langfuse incomplète.");
    }

    const credentials = Buffer.from(`${publicKey}:${secretKey}`).toString(
      "base64",
    );

    const response = await fetch(`${baseUrl}/api/public/projects`, {
      headers: { Authorization: `Basic ${credentials}` },
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) {
      throw new Error(`Langfuse répond ${response.status}.`);
    }

    return "Traces et coûts disponibles";
  },
};

export const CONTROLS: Control[] = [
  databaseControl,
  authControl,
  cacheControl,
  aiControl,
  langfuseControl,
];
