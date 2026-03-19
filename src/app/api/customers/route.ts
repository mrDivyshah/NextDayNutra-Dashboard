import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { users } from "@/db/schema";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

const createCustomerSchema = z.object({
  name: z.string().trim().min(2).max(191),
  email: z.string().trim().email().max(191),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  companyName: z.string().trim().min(2).max(191),
  jiraId: z.string().trim().max(100).optional().or(z.literal("")),
  password: z
    .string()
    .min(8)
    .max(128)
    .refine((value) => /[A-Z]/.test(value) && /[a-z]/.test(value), "Password must include uppercase and lowercase letters.")
    .refine((value) => /[\d!@#$%^&*(),.?":{}|<>]/.test(value), "Password must include a number or symbol."),
  confirmPassword: z.string().min(8).max(128),
  addressLine1: z.string().trim().max(255).optional().or(z.literal("")),
  addressLine2: z.string().trim().max(255).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  state: z.string().trim().max(100).optional().or(z.literal("")),
  zip: z.string().trim().max(20).optional().or(z.literal("")),
  country: z.string().trim().max(100).optional().or(z.literal("")),
  redirectUrl: z.string().trim().max(500).optional().or(z.literal("")),
  additionalAccess: z.string().trim().max(5000).optional().or(z.literal("")),
  botField: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["confirmPassword"],
      message: "Passwords do not match.",
    });
  }
});

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return true;

  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireApiRole(["super_admin", "admin", "manager"]);
  if (response || !session?.user) return response!;

  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createCustomerSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Invalid customer payload.";
    return NextResponse.json({ error: firstIssue }, { status: 400 });
  }

  if (parsed.data.botField?.trim()) {
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const [existingByEmail] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existingByEmail) {
    return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
  }

  if (parsed.data.jiraId) {
    const [existingByJira] = await db.select({ id: users.id }).from(users).where(eq(users.jiraId, parsed.data.jiraId)).limit(1);
    if (existingByJira) {
      return NextResponse.json({ error: "That Jira or external ID is already assigned to another user." }, { status: 409 });
    }
  }

  const passwordHash = await hash(parsed.data.password, 12);
  await db.insert(users).values({
    name: parsed.data.name,
    email,
    phone: parsed.data.phone || null,
    companyName: parsed.data.companyName,
    jiraId: parsed.data.jiraId || null,
    passwordHash,
    role: "customer",
    isActive: true,
    addressLine1: parsed.data.addressLine1 || null,
    addressLine2: parsed.data.addressLine2 || null,
    city: parsed.data.city || null,
    state: parsed.data.state || null,
    zip: parsed.data.zip || null,
    country: parsed.data.country || null,
    accountManagerId: Number(session.user.id) || null,
    redirectUrl: parsed.data.redirectUrl || null,
    additionalAccess: parsed.data.additionalAccess || null,
  });

  return NextResponse.json({ success: true });
}
