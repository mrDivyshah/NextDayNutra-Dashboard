import { redirect } from "next/navigation";
import SuperAdminDashboard from "@/components/super-admin/SuperAdminDashboard";
import { getAuthSession } from "@/lib/auth";

export default async function SuperAdminUsersPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login?callbackUrl=/super-admin/users");
  }

  if (session.user.role !== "super_admin") {
    redirect("/");
  }

  return <SuperAdminDashboard view="users" />;
}
