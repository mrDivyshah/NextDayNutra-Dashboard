import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads", "vault");

function sanitizeSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-_]/gi, "-").replace(/-+/g, "-");
}

export async function saveVaultFile(orderId: string, file: File) {
  const orderSegment = sanitizeSegment(orderId || "general");
  const directory = path.join(UPLOAD_ROOT, orderSegment);
  await fs.mkdir(directory, { recursive: true });

  const extension = path.extname(file.name) || "";
  const baseName = path.basename(file.name, extension).slice(0, 80);
  const fileName = `${sanitizeSegment(baseName || "file")}-${crypto.randomUUID()}${extension.toLowerCase()}`;
  const absolutePath = path.join(directory, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await fs.writeFile(absolutePath, buffer);

  return {
    fileName,
    absolutePath,
    publicUrl: `/uploads/vault/${orderSegment}/${fileName}`,
    fileSize: buffer.byteLength,
  };
}

export async function deleteVaultFile(filePath: string) {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch {
    // Ignore missing files to keep delete idempotent.
  }
}
