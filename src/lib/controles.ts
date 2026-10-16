import "server-only";
import { redis } from "./cache";
import { createAdminClient } from "./supabase/admin";
import type { Control } from "@/lib/app-status";


export const controleBase: Control = {
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

const controleAuth: Control = {
  service: "Supabase Auth",
  description: "Connexion des utilisateurs",
  verify: async () => {
    const supabase = createAdminClient();
    const { error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });

    if (error) {
      throw new Error(error.message);
    }

    return "Service d'authentification joignable";
  },
};

export const CONTROLES: Control[] = [
  controleBase,
  controleAuth,
];