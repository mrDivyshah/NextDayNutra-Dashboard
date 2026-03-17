import { asc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, vaultComments } from "@/db/schema";
import { requireApiSession } from "@/lib/api-auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireApiSession();
  if (response) return response;

  const { id } = await params;
  const assetId = Number(id);
  if (!assetId) {
    return NextResponse.json({ error: "Invalid asset id" }, { status: 400 });
  }

  try {
    const rows = await db
      .select({
        id: vaultComments.id,
        asset_id: vaultComments.assetId,
        user_id: vaultComments.userId,
        comment: vaultComments.comment,
        reply_to_id: vaultComments.replyToId,
        timestamp: vaultComments.createdAt,
        display_name: users.name,
      })
      .from(vaultComments)
      .innerJoin(users, eq(vaultComments.userId, users.id))
      .where(eq(vaultComments.assetId, assetId))
      .orderBy(asc(vaultComments.createdAt), asc(vaultComments.id));

    return NextResponse.json(
      rows.map((row) => ({
        ...row,
        timestamp: row.timestamp?.toISOString() || new Date().toISOString(),
        display_name: row.display_name || "Unknown",
        reply_to_id: row.reply_to_id ?? null,
      }))
    );
  } catch (error) {
    console.error("Failed to fetch asset comments:", error);
    return NextResponse.json([]);
  }
}
