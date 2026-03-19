import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { roles } from "@/db/schema";
import { requireApiRole } from "@/lib/api-auth";

const updateRoleSchema = z.object({
  name: z.string().trim().min(2).max(191).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  isSystem: z.boolean().optional(),
  redirectUrl: z.string().trim().max(500).optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireApiRole(["super_admin"]);
  if (response) return response;

  const { id } = await params;
  const roleId = parseInt(id);
  if (isNaN(roleId)) {
    return NextResponse.json({ error: "Invalid role ID." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateRoleSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid role payload.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(roles)
    .where(eq(roles.id, roleId))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Role not found." }, { status: 404 });
  }

  await db
    .update(roles)
    .set({
      name: parsed.data.name ?? existing.name,
      description: parsed.data.description === null ? null : (parsed.data.description ?? existing.description),
      isSystem: parsed.data.isSystem ?? existing.isSystem,
      redirectUrl: parsed.data.redirectUrl === null ? null : (parsed.data.redirectUrl ?? existing.redirectUrl),
    })
    .where(eq(roles.id, roleId));

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireApiRole(["super_admin"]);
  if (response) return response;

  const { id } = await params;
  const roleId = parseInt(id);
  if (isNaN(roleId)) {
    return NextResponse.json({ error: "Invalid role ID." }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(roles)
    .where(eq(roles.id, roleId))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Role not found." }, { status: 404 });
  }

  if (existing.isSystem) {
    return NextResponse.json(
      { error: "System roles cannot be deleted." },
      { status: 403 }
    );
  }

  // Optional: Check if users are assigned to this role before deleting?
  // For now, let's just delete it.

  await db.delete(roles).where(eq(roles.id, roleId));

  return NextResponse.json({ success: true });
}
