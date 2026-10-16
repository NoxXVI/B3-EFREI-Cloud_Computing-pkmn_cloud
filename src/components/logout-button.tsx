"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Button } from "./ui/button";

export default function LogOutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();

  async function logout() {
    await createClient().auth.signOut();

    // Purge le cache client : aucune donnée privée ne doit survivre à la
    // déconnexion (même onglet, autre utilisateur).
    queryClient.clear();

    router.push("/auth");
    router.refresh();
  }

  return (
    <Button variant="link" onClick={logout}>
      Se déconnecter
    </Button>
  );
}