import { and, eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orderReadStatus } from "@/db/schema";
import { requireApiSession } from "@/lib/api-auth";

// GET /api/order-highlights?orderIds=cm-100,cm-200
// Returns which orderIds are "highlighted" (unread) for the current user
export async function GET(request: NextRequest) {
  const { session, response } = await requireApiSession();
  if (response || !session) return response!;

  const userId = Number(session.user.id);
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("orderIds") || "";
  const orderIds = idsParam
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (orderIds.length === 0) return NextResponse.json({ highlighted: [], readMap: {} });

  try {
    // Get all rows where user has read these orders
    const readRows = await db
      .select({ orderId: orderReadStatus.orderId, lastReadAt: orderReadStatus.lastReadAt })
      .from(orderReadStatus)
      .where(and(eq(orderReadStatus.userId, userId), inArray(orderReadStatus.orderId, orderIds)));

    const readMap: Record<string, string> = {};
    readRows.forEach((r) => {
      readMap[r.orderId] = r.lastReadAt?.toISOString() || new Date(0).toISOString();
    });

    // Orders NOT in readMap are "new" — but we can't know event time from this alone.
    // The client tracks highlight state via WebSocket events and this read map.
    return NextResponse.json({ readMap });
  } catch (error) {
    console.error("Failed to fetch read status:", error);
    return NextResponse.json({ readMap: {} });
  }
}

// POST /api/order-highlights — mark order as read (user opened details)
export async function POST(request: NextRequest) {
  const { session, response } = await requireApiSession();
  if (response || !session) return response!;

  const userId = Number(session.user.id);
  const body = (await request.json()) as { orderId?: string };
  const orderId = body.orderId?.trim().toLowerCase();
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  try {
    // Upsert: check existing row
    const [existing] = await db
      .select({ id: orderReadStatus.id })
      .from(orderReadStatus)
      .where(and(eq(orderReadStatus.userId, userId), eq(orderReadStatus.orderId, orderId)))
      .limit(1);

    if (existing) {
      await db
        .update(orderReadStatus)
        .set({ lastReadAt: new Date() })
        .where(eq(orderReadStatus.id, existing.id));
    } else {
      await db.insert(orderReadStatus).values({ userId, orderId, lastReadAt: new Date() });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update read status:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
