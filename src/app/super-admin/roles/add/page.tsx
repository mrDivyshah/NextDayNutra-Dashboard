import { redirect } from "next/navigation";
import SuperAdminDashboard from "@/components/super-admin/SuperAdminDashboard";
import { getAuthSession } from "@/lib/auth";

export default async function SuperAdminAddRolePage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login?callbackUrl=/super-admin/roles/add");
  }

  if (session.user.role !== "super_admin") {
    redirect("/");
  }

  return <SuperAdminDashboard view="roles-add" />;
}
