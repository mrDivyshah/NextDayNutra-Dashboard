import { hash } from "bcryptjs";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { roles, users } from "@/db/schema";
import { requireApiRole } from "@/lib/api-auth";

const createUserSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(8),
  role: z.string().trim().min(1),
  isActive: z.boolean().optional(),
  redirectUrl: z.string().trim().optional(),
  additionalAccess: z.string().trim().optional(),
});

export async function GET() {
  const { response } = await requireApiRole(["super_admin"]);
  if (response) return response;

  const [allUsers, allRoles] = await Promise.all([
    db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      redirectUrl: users.redirectUrl,
      additionalAccess: users.additionalAccess,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt), desc(users.id)),
    db.select().from(roles).orderBy(roles.name),
  ]);

  return NextResponse.json({ users: allUsers, roles: allRoles });
}

export async function POST(request: NextRequest) {
  const { response } = await requireApiRole(["super_admin"]);
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid user payload." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
  }

  const [roleRecord] = await db.select().from(roles).where(eq(roles.key, parsed.data.role)).limit(1);
  if (!roleRecord) {
    return NextResponse.json({ error: "Selected role does not exist." }, { status: 400 });
  }

  const passwordHash = await hash(parsed.data.password, 12);
  await db.insert(users).values({
    name: parsed.data.name,
    email,
    passwordHash,
    role: roleRecord.key,
    isActive: parsed.data.isActive ?? true,
    redirectUrl: parsed.data.redirectUrl || null,
    additionalAccess: parsed.data.additionalAccess || null,
  });

  return NextResponse.json({ success: true });
}
