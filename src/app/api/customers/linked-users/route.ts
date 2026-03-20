import { NextRequest, NextResponse } from "next/server";
import { eq, or, and } from "drizzle-orm";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { requireApiSession } from "@/lib/api-auth";

const addLinkedUserSchema = z.object({
  name: z.string().trim().optional(),
  email: z.string().trim().email(),
  jiraId: z.string().trim(),
  companyName: z.string().trim(),
});

const editLinkedUserSchema = z.object({
  id: z.number(),
  name: z.string().trim().optional(),
  email: z.string().trim().email().optional(),
  role: z.string().trim().optional(),
});

export async function GET(request: NextRequest) {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const url = new URL(request.url);
  const companyName = url.searchParams.get("companyName");
  const jiraId = url.searchParams.get("jiraId");

  if (!companyName && !jiraId) {
    return NextResponse.json({ error: "No customer specified." }, { status: 400 });
  }

  const conditions = [];
  if (companyName) conditions.push(eq(users.companyName, companyName));
  if (jiraId) conditions.push(eq(users.jiraId, jiraId));

  const allLinked = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      companyName: users.companyName,
      jiraId: users.jiraId,
    })
    .from(users)
    .where(or(...conditions))
    .orderBy(users.name);

  return NextResponse.json({ users: allLinked });
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const role = session?.user?.role;
  if (!["super_admin", "admin", "manager", "account_manager"].includes(role || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const { action } = body;

  if (action === "edit" || action === "delete" || action === "reset_pass") {
     if (action === "delete") {
         await db.delete(users).where(eq(users.id, body.id));
         return NextResponse.json({ success: true });
     }
     
     if (action === "reset_pass") {
         const resetPasswordSchema = z.object({
            id: z.number(),
            password: z.string().min(8),
         });
         const parsed = resetPasswordSchema.safeParse(body);
         if (!parsed.success) return NextResponse.json({ error: "Invalid password." }, { status: 400 });
         const passwordHash = await hash(parsed.data.password, 12);
         await db.update(users).set({ passwordHash }).where(eq(users.id, parsed.data.id));
         return NextResponse.json({ success: true });
     }

     if (action === "edit") {
        const parsed = editLinkedUserSchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });
        const updateData: any = {};
        if (parsed.data.name) updateData.name = parsed.data.name;
        if (parsed.data.email) updateData.email = parsed.data.email.toLowerCase();
        if (parsed.data.role) updateData.role = parsed.data.role;
        
        await db.update(users).set(updateData).where(eq(users.id, parsed.data.id));
        return NextResponse.json({ success: true });
     }
  }

  const parsed = addLinkedUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const [existingUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);

  if (existingUser) {
    await db.update(users).set({
      companyName: parsed.data.companyName,
      jiraId: parsed.data.jiraId,
      role: "customer",
    }).where(eq(users.id, existingUser.id));
  } else {
    const passwordHash = await hash(Math.random().toString(36).slice(-8) + "Aa1!", 12);
    await db.insert(users).values({
      name: parsed.data.name || email.split("@")[0],
      email,
      passwordHash,
      role: "customer",
      companyName: parsed.data.companyName,
      jiraId: parsed.data.jiraId,
      isActive: true,
    });
  }

  return NextResponse.json({ success: true });
}
