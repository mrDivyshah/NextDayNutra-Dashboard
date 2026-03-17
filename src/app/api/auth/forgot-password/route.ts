import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { passwordResetTokens, users } from "@/db/schema";
import { createPasswordResetToken, getPasswordResetExpiry } from "@/lib/password-reset";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const identifier = typeof body?.email === "string" ? body.email.trim() : "";
  const normalizedEmail = identifier.toLowerCase();

  if (!identifier) {
    return NextResponse.json({ error: "Username or email address is required." }, { status: 400 });
  }

  let [user] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);

  if (!user) {
    [user] = await db.select().from(users).where(eq(users.name, identifier)).limit(1);
  }

  if (user?.isActive) {
    const { token, tokenHash } = createPasswordResetToken();
    const expiresAt = getPasswordResetExpiry(1);

    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const origin = request.nextUrl.origin;
    const resetUrl = `${origin}/reset-password?token=${token}`;

    return NextResponse.json({
      success: true,
      message: "If that account exists, a reset link has been created.",
      resetUrl,
    });
  }

  return NextResponse.json({
    success: true,
    message: "If that account exists, a reset link has been created.",
  });
}
