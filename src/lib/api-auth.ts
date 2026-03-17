import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import type { AppRole } from "@/lib/roles";

export async function requireApiSession() {
  const session = await getAuthSession();
  if (!session?.user) {
    return {
      session: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { session, response: null };
}

export async function requireApiRole(roles: AppRole[]) {
  const { session, response } = await requireApiSession();
  if (response || !session?.user) {
    return { session: null, response: response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (!roles.includes(session.user.role)) {
    return {
      session: null,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session, response: null };
}
