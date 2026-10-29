import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { createClientServer } from "@/lib/supabase/server";

const ALLOWED_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email",
  "email_change",
];

/**
 * Confirmation d'e-mail par token hash.
 *
 * Contrairement au flux PKCE de `/auth/callback`, ce lien ne dépend pas d'un
 * cookie déposé dans le navigateur qui a lancé l'inscription : il fonctionne
 * donc même si l'e-mail est ouvert sur un autre appareil.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next");
  const target =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (tokenHash && type && ALLOWED_TYPES.includes(type)) {
    const supabase = await createClientServer();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      return NextResponse.redirect(`${origin}${target}`);
    }

    console.error("Échec de la vérification du lien :", error.message);
  }

  return NextResponse.redirect(`${origin}/auth/signup?erreur=lien-invalide`);
}
