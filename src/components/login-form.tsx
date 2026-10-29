"use client";

import { useState } from "react";
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
import { useRouter } from "next/navigation";

export function LogInForm({ linkError }: { linkError: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(
    linkError
      ? "Ce lien de connexion est invalide ou a expiré. Demandez-en un nouveau."
      : "",
  );

  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsSubmitting(false);

    if (error) {
      console.error(error);
      setError(
        "Identifiants invalides. Vérifiez votre email et votre mot de passe.",
      );
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connexion</CardTitle>
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
              <Button type="submit">Connexion</Button>
              <FieldDescription className="text-center">
                Pas de compte ? <a href="/auth/signup">Inscription</a>
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
