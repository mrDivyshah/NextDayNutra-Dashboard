import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifications, users, vaultAssets, vaultComments } from "@/db/schema";
import { requireApiSession } from "@/lib/api-auth";
import { broadcastToAll, broadcastToUser } from "@/lib/ws-broadcast";

export async function POST(request: NextRequest) {
  const { session, response } = await requireApiSession();
  if (response || !session) return response!;

  const body = (await request.json()) as {
    asset_id?: number;
    comment?: string;
    reply_to_id?: number;
  };

  if (!body.asset_id || !body.comment?.trim()) {
    return NextResponse.json({ error: "asset_id and comment are required" }, { status: 400 });
  }

  const userId = Number(session.user.id);
  const commenterRole = (session.user as { role?: string }).role || "user";

  try {
    const result = await db.insert(vaultComments).values({
      assetId: body.asset_id,
      userId,
      comment: body.comment.trim(),
      replyToId: body.reply_to_id ? Number(body.reply_to_id) : null,
    }).$returningId();

    const commentId = Number(result[0]?.id || 0);

    // ── Fetch asset to know orderId + customerId ───────────────────────────
    const [asset] = await db
      .select()
      .from(vaultAssets)
      .where(eq(vaultAssets.id, body.asset_id))
      .limit(1);

    // ── Fetch commenter name ───────────────────────────────────────────────
    const [commenterRow] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const commenterName = commenterRow?.name || "User";

    const orderId = asset?.orderId || "";
    const customerId = asset?.customerId || 0;

    const wsPayload = {
      commentId,
      assetId: body.asset_id,
      orderId,
      customerId,
      commentText: body.comment.trim().slice(0, 120),
      commenterName,
      commenterRole,
    };

    if (commenterRole === "customer") {
      // Customer commented → notify all admins + broadcast to all
      broadcastToAll("comment_posted", wsPayload);

      // Create DB notifications for admin users
      const adminUsers = await db
        .select({ id: users.id, role: users.role })
        .from(users)
        .where(eq(users.isActive, true))
        .limit(50);

      for (const admin of adminUsers) {
        if (admin.role !== "customer") {
          await db.insert(notifications).values({
            userId: admin.id,
            type: "comment",
            title: "Customer left a comment",
            message: `${commenterName} commented on order ${orderId.toUpperCase()}: "${body.comment.trim().slice(0, 80)}"`,
            orderId,
            assetId: body.asset_id,
            fromUserId: userId,
            isRead: false,
          }).catch(() => {/* non-fatal */});
        }
      }
    } else {
      // Admin/manager commented → notify the customer
      if (customerId > 0) {
        broadcastToUser(customerId, "comment_posted", wsPayload);

        await db.insert(notifications).values({
          userId: customerId,
          type: "comment",
          title: "New comment on your order",
          message: `${commenterName} replied on order ${orderId.toUpperCase()}: "${body.comment.trim().slice(0, 80)}"`,
          orderId,
          assetId: body.asset_id,
          fromUserId: userId,
          isRead: false,
        }).catch(() => {/* non-fatal */});
      }
      // Also echo to all admins so their views refresh
      broadcastToAll("comment_posted", wsPayload);
    }

    return NextResponse.json({
      success: true,
      id: commentId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Comment failed";
    console.error("Comment Insert Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
