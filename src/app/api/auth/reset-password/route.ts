import { hash } from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { passwordResetTokens, users } from "@/db/schema";
import { hashPasswordResetToken } from "@/lib/password-reset";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!token || password.length < 8) {
    return NextResponse.json({ error: "A valid token and password are required." }, { status: 400 });
  }

  const tokenHash = hashPasswordResetToken(token);
  const [resetToken] = await db
    .select()
    .from(passwordResetTokens)
    .where(and(eq(passwordResetTokens.tokenHash, tokenHash), gt(passwordResetTokens.expiresAt, new Date())))
    .limit(1);

  if (!resetToken) {
    return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
  }

  const passwordHash = await hash(password, 12);

  await db.update(users).set({ passwordHash }).where(eq(users.id, resetToken.userId));
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, resetToken.userId));

  return NextResponse.json({
    success: true,
    message: "Password updated successfully. You can sign in now.",
  });
}
