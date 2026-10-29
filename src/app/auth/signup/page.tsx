import { SignUpForm } from "@/components/signup-form";

export const instant = false;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignUpForm linkError={erreur === "lien-invalide"} />
      </div>
    </div>
  );
}
