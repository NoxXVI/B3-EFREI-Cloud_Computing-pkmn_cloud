

import Link from "next/link";
import { connection } from "next/server";
import LogOutButton from "@/components/logout-button";
import { createClientServer } from "@/lib/supabase/server";

export default async function EnTete() {
  await connection();

  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-4xl items-center justify-between p-4 text-sm">
        <Link href="/" className="font-semibold">
          Checklist
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">{user.email}</span>
          <LogOutButton />
        </div>
      </div>
    </header>
  );
}
