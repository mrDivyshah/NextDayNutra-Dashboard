import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/api-auth";
import { getActiveUsers } from "@/lib/ws-broadcast";

// GET /api/admin/active-users — super admin only
export async function GET() {
  const { response } = await requireApiRole(["super_admin", "admin"]);
  if (response) return response;

  const users = getActiveUsers();
  return NextResponse.json({ users, count: users.length });
}
