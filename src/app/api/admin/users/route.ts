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

export async function GET(request: NextRequest) {
  const { response } = await requireApiRole(["super_admin"]);
  if (response) return response;

  const url = new URL(request.url);
  const userPage = Math.max(1, parseInt(url.searchParams.get("userPage") || "1"));
  const userLimit = Math.max(1, parseInt(url.searchParams.get("userLimit") || "10"));
  const rolePage = Math.max(1, parseInt(url.searchParams.get("rolePage") || "1"));
  const roleLimit = Math.max(1, parseInt(url.searchParams.get("roleLimit") || "10"));

  const [allUsers, totalUsersResult, allRoles, totalRolesResult] = await Promise.all([
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
      .orderBy(desc(users.createdAt), desc(users.id))
      .limit(userLimit)
      .offset((userPage - 1) * userLimit),
    db.select({ count: db.$count(users) }).from(users),
    db
      .select()
      .from(roles)
      .orderBy(roles.name)
      .limit(roleLimit)
      .offset((rolePage - 1) * roleLimit),
    db.select({ count: db.$count(roles) }).from(roles),
  ]);

  // We also need ALL roles for the user role dropdowns, but maybe those should be a separate "options" endpoint?
  // For now, to fulfill "don't load fully", I'll just return these totals.
  // Actually, I'll return 'options' which are all simplified role records for dropdowns.
  const allRolesOptions = await db.select({ id: roles.id, key: roles.key, name: roles.name }).from(roles).orderBy(roles.name);

  const totalUsers = totalUsersResult[0]?.count ?? 0;
  const totalRoles = totalRolesResult[0]?.count ?? 0;

  return NextResponse.json({ 
    users: allUsers, 
    totalUsers, 
    roles: allRoles, 
    totalRoles,
    roleOptions: allRolesOptions 
  });
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
