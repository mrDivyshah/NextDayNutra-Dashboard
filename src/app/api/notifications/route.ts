import { and, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifications, users } from "@/db/schema";
import { requireApiSession } from "@/lib/api-auth";

// GET /api/notifications — fetch notifications for the current user
export async function GET(request: NextRequest) {
  const { session, response } = await requireApiSession();
  if (response || !session) return response!;

  const userId = Number(session.user.id);
  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unread") === "true";
  const limit = Math.min(Number(searchParams.get("limit") || 50), 100);

  const conditions = [eq(notifications.userId, userId)];
  if (unreadOnly) conditions.push(eq(notifications.isRead, false));

  try {
    const rows = await db
      .select({
        id: notifications.id,
        type: notifications.type,
        title: notifications.title,
        message: notifications.message,
        orderId: notifications.orderId,
        assetId: notifications.assetId,
        fromUserId: notifications.fromUserId,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
        fromName: users.name,
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.fromUserId, users.id))
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    return NextResponse.json(
      rows.map((r) => ({
        ...r,
        createdAt: r.createdAt?.toISOString() || new Date().toISOString(),
        fromName: r.fromName || "System",
      }))
    );
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    // Return empty array instead of 500 to keep UI functional
    return NextResponse.json([]);
  }
}

// POST /api/notifications — create a notification (internal, also called by other API routes)
export async function POST(request: NextRequest) {
  const { session, response } = await requireApiSession();
  if (response || !session) return response!;

  const body = (await request.json()) as {
    userId?: number;
    type?: string;
    title?: string;
    message?: string;
    orderId?: string;
    assetId?: number;
    fromUserId?: number;
  };

  if (!body.userId || !body.title || !body.message) {
    return NextResponse.json({ error: "userId, title, message are required" }, { status: 400 });
  }

  try {
    const result = await db.insert(notifications).values({
      userId: body.userId,
      type: body.type || "notification",
      title: body.title,
      message: body.message,
      orderId: body.orderId,
      assetId: body.assetId,
      fromUserId: body.fromUserId || Number(session.user.id),
      isRead: false,
    }).$returningId();

    return NextResponse.json({ success: true, id: Number(result[0]?.id || 0) });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create notification";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PATCH /api/notifications — mark all as read (or specific ones)
export async function PATCH(request: NextRequest) {
  const { session, response } = await requireApiSession();
  if (response || !session) return response!;

  const userId = Number(session.user.id);

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

  return NextResponse.json({ success: true });
}
