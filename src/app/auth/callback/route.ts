import { NextResponse } from "next/server";
import { createClientServer } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClientServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}/`);
    }

    console.error("Échec de l'échange du code de connexion :", error.message);

    if (error.code === "pkce_code_verifier_not_found") {
      return NextResponse.redirect(
        `${origin}/auth/signup?erreur=lien-invalide`,
      );
    }
  }

  return NextResponse.redirect(`${origin}/auth/signup?erreur=lien-invalide`);
}
