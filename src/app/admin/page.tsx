import { redirect } from "next/navigation";

import StatusBoard from "@/components/status-board";
import { isAdmin } from "@/lib/auth/is-admin";

export const instant = false;

export default async function Admin() {
  if (!(await isAdmin())) {
    redirect("/");
  }

  return (
    <div>
      <StatusBoard />
    </div>
  );
}
