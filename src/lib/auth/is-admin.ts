import "server-only";

import { createClientServer } from "@/lib/supabase/server";

export async function isAdmin() {
  const supabase = await createClientServer();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return false;
  }

  return user.app_metadata?.role === "admin";
}