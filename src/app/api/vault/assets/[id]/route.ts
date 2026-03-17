import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { vaultAssets, vaultComments } from "@/db/schema";
import { requireApiSession } from "@/lib/api-auth";
import { deleteVaultFile } from "@/lib/file-storage";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireApiSession();
  if (response || !session) return response!;

  if (!["admin", "manager", "super_admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const assetId = Number(id);
  if (!assetId) {
    return NextResponse.json({ error: "Invalid asset id" }, { status: 400 });
  }

  try {
    const [asset] = await db.select().from(vaultAssets).where(eq(vaultAssets.id, assetId)).limit(1);
    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    await db.delete(vaultComments).where(eq(vaultComments.assetId, assetId));
    await db.delete(vaultAssets).where(eq(vaultAssets.id, assetId));
    
    if (asset.filePath) {
      await deleteVaultFile(asset.filePath);
    }

    return NextResponse.json({ success: true, deleted: true, id: assetId });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Delete failed";
    console.error("Asset Delete Error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
