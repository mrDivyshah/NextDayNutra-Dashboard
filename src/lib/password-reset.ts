import { createHash, randomBytes } from "crypto";

export function createPasswordResetToken() {
  const token = randomBytes(32).toString("hex");
  return {
    token,
    tokenHash: hashPasswordResetToken(token),
  };
}

export function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getPasswordResetExpiry(hours = 1) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}
