

import { connection } from "next/server";
import { Breadcrumb } from "@/components/breadcrumb";
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
      <div className=" flex items-center justify-between p-2 text-sm">
        <Breadcrumb />
        <div className="flex items-center gap-4">
          <span className="text-gray-600">{user.email}</span>
          <LogOutButton />
        </div>
      </div>
    </header>
  );
}
