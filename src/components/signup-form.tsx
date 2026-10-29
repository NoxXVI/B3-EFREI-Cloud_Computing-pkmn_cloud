"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "./ui/field";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { createClient } from "@/lib/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { RiErrorWarningLine } from "@remixicon/react";

export function SignUpForm({ linkError }: { linkError: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const router = useRouter();
  const [error, setError] = useState(
    linkError
      ? "Ce lien est invalide, expiré, ou ouvert dans un autre navigateur. Demandez un nouveau lien et ouvrez-le dans le même navigateur que l'inscription."
      : "",
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    setIsSubmitting(false);

    if (error) {
      console.error(error);
      setError(
        "L'inscription a échoué. Vérifiez vos informations ou patientez quelques minutes avant de réessayer.",
      );
      return;
    }

    // Si la confirmation d'e-mail est désactivée dans Supabase, la session est
    // créée immédiatement : on entre directement dans l'application.
    if (data.session) {
      router.push("/");
      router.refresh();
      return;
    }

    setIsSent(true);
  }

  if (isSent) {
    return (
      <Alert className="max-w-md">
        <RiErrorWarningLine />
        <AlertTitle>Email de confirmation</AlertTitle>
        <AlertDescription>
          Un e-mail de confirmation vient d&apos;être envoyé à{" "}
          <strong>{email}</strong>. Ouvrez le lien qu&apos;il contient pour
          activer votre compte.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inscription</CardTitle>
        <CardDescription>
          Connectez-vous avec votre adresse e-mail pour accéder à votre compte.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tonmail@example.com"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
              <Input
                id="password"
                type="password"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>
            <Field>
              <Button type="submit" disabled={isSubmitting}>
                Inscription
              </Button>
              <FieldDescription className="text-center">
                Vous avez un compte ? <a href="/auth">Inscription</a>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
        {error && (
          <Alert variant="destructive" className="max-w-md">
            <RiErrorWarningLine />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
