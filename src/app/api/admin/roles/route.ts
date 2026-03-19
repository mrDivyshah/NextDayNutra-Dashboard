import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { roles } from "@/db/schema";
import { requireApiRole } from "@/lib/api-auth";

const createRoleSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9_]+$/, "Key must be lowercase letters, numbers, or underscores only."),
  name: z.string().trim().min(2).max(191),
  description: z.string().trim().max(1000).optional(),
  isSystem: z.boolean().optional(),
  redirectUrl: z.string().trim().max(500).optional().nullable(),
});

export async function GET() {
  const { response } = await requireApiRole(["super_admin"]);
  if (response) return response;

  const allRoles = await db.select().from(roles).orderBy(roles.name);
  return NextResponse.json({ roles: allRoles });
}

export async function POST(request: NextRequest) {
  const { response } = await requireApiRole(["super_admin"]);
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = createRoleSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid role payload.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const key = parsed.data.key.toLowerCase();

  const [existing] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.key, key))
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: `A role with key "${key}" already exists.` },
      { status: 409 }
    );
  }

  await db.insert(roles).values({
    key,
    name: parsed.data.name,
    description: parsed.data.description || null,
    isSystem: parsed.data.isSystem ?? false,
    redirectUrl: parsed.data.redirectUrl || null,
  });

  return NextResponse.json({ success: true });
}
