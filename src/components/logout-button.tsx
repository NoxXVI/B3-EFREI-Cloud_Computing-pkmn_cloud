"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "./ui/button";

export default function LogOutButton() {
  const router = useRouter();

  async function logout() {
    await createClient().auth.signOut();
    router.push("/auth");
    router.refresh();
  }

  return (
    <Button variant="link" onClick={logout}>
      Se déconnecter
    </Button>
  );
}