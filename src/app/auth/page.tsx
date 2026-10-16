import { redirect } from "next/navigation";
import { LogInForm } from "@/components/login-form";
import { createClientServer } from "@/lib/supabase/server";

export const instant = false

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  const { erreur } = await searchParams;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LogInForm linkError={erreur === "lien-invalide"} />
      </div>
    </div>
  );
}
