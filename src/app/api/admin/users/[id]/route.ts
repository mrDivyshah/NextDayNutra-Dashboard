import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { roles, users } from "@/db/schema";
import { requireApiRole } from "@/lib/api-auth";

const updateUserSchema = z.object({
  name: z.string().trim().min(2).optional(),
  email: z.string().trim().email().optional(),
  password: z.string().min(8).optional().or(z.literal("")),
  role: z.string().trim().min(1).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireApiRole(["super_admin"]);
  if (response) return response;

  const { id } = await params;
  const userId = Number(id);
  if (!userId) {
    return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid user payload." }, { status: 400 });
  }

  if (session?.user.id === userId && parsed.data.isActive === false) {
    return NextResponse.json({ error: "You cannot deactivate your own super admin account." }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};

  if (parsed.data.name) updateData.name = parsed.data.name;
  if (parsed.data.email) updateData.email = parsed.data.email.toLowerCase();
  if (parsed.data.role) {
    const [roleRecord] = await db.select().from(roles).where(eq(roles.key, parsed.data.role)).limit(1);
    if (!roleRecord) {
      return NextResponse.json({ error: "Selected role does not exist." }, { status: 400 });
    }
    updateData.role = roleRecord.key;
  }
  if (typeof parsed.data.isActive === "boolean") updateData.isActive = parsed.data.isActive;
  if (parsed.data.password) updateData.passwordHash = await hash(parsed.data.password, 12);

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No changes submitted." }, { status: 400 });
  }

  await db.update(users).set(updateData).where(eq(users.id, userId));
  return NextResponse.json({ success: true });
}
