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

const uptimeRobotControl: Control = {
  service: "UptimeRobot",
  description: "Surveillance externe de /api/health",
  verify: async () => {
    const apiKey = process.env.UPTIMEROBOT_API_KEY;

    if (!apiKey) {
      throw new Error("UPTIMEROBOT_API_KEY est absente.");
    }

    const response = await fetch(
      "https://api.uptimerobot.com/v2/getMonitors",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          api_key: apiKey,
          format: "json",
          logs: "0",
          response_times: "0",
        }),
        signal: AbortSignal.timeout(4500),
      },
    );

    if (!response.ok) {
      throw new Error(`UptimeRobot répond ${response.status}.`);
    }

    const data = (await response.json()) as {
      stat?: string;
      error?: { message?: string };
      monitors?: { friendly_name: string; status: number }[];
    };

    if (data.stat !== "ok") {
      throw new Error(
        data.error?.message ?? "Réponse UptimeRobot invalide.",
      );
    }

    const monitors = data.monitors ?? [];

    if (monitors.length === 0) {
      throw new Error("Aucun monitor configuré.");
    }

    // 8 = seems down, 9 = down.
    const down = monitors.filter(
      (monitor) => monitor.status === 8 || monitor.status === 9,
    );

    if (down.length > 0) {
      throw new Error(
        `${down.length} monitor(s) en panne : ${down
          .map((monitor) => monitor.friendly_name)
          .join(", ")}`,
      );
    }

    return `${monitors.length} monitor(s) actif(s)`;
  },
};

const pokeApiControl: Control = {
  service: "PokeAPI",
  description: "Données Pokémon des fiches et des Pokédex",
  verify: async () => {
    const response = await fetch("https://pokeapi.co/api/v2/pokemon/1", {
      signal: AbortSignal.timeout(4500),
    });

    if (!response.ok) {
      throw new Error(`PokeAPI répond ${response.status}.`);
    }

    return "Données Pokémon joignables";
  },
};

export const CONTROLS: Control[] = [
  databaseControl,
  authControl,
  cacheControl,
  aiControl,
  langfuseControl,
  uptimeRobotControl,
  pokeApiControl,
];
