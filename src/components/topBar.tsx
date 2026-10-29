import { connection } from "next/server";
import Link from "next/link";
import { Breadcrumb } from "@/components/breadcrumb";
import LogOutButton from "@/components/logout-button";
import { createClientServer } from "@/lib/supabase/server";

export default async function TopBar() {
  await connection();

  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const isAdminUser = user.app_metadata?.role === "admin";

  return (
    <header className="border-b">
      <div className=" flex items-center justify-between p-2 text-sm">
        <Breadcrumb />
        <div className="flex items-center gap-4">
          {isAdminUser && (
            <Link
              href="/admin"
              className="text-muted-foreground hover:text-foreground"
            >
              Administration
            </Link>
          )}
          <span className="text-gray-600">{user.email}</span>
          <LogOutButton />
        </div>
      </div>
    </header>
  );
}
