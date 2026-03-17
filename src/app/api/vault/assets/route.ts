import { and, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifications, users, vaultAssets } from "@/db/schema";
import { requireApiSession } from "@/lib/api-auth";
import { saveVaultFile } from "@/lib/file-storage";
import { broadcastToAll, broadcastToUser } from "@/lib/ws-broadcast";

export async function GET(request: NextRequest) {
  const { response } = await requireApiSession();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("order_id");
  const customerId = searchParams.get("customer_id");
  const userId = searchParams.get("user_id");

  const conditions = [];
  if (orderId) conditions.push(eq(vaultAssets.orderId, orderId.toLowerCase().trim()));
  if (customerId) conditions.push(eq(vaultAssets.customerId, Number(customerId)));
  if (userId) conditions.push(eq(vaultAssets.uploaderId, Number(userId)));

  try {
    const rows = await db
      .select()
      .from(vaultAssets)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(vaultAssets.createdAt));

    const assets = rows.map((row) => ({
      id: row.id,
      order_id: row.orderId,
      customer_user_id: row.customerId,
      file_url: row.fileUrl,
      file_name: row.fileName,
      user_id: row.uploaderId,
      requires_approval: row.requiresApproval ? 1 : 0,
      approval_status: row.approvalStatus,
      timestamp: row.createdAt?.toISOString() || new Date().toISOString(),
    }));

    return NextResponse.json(assets);
  } catch (error) {
    console.error("Failed to fetch vault assets:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireApiSession();
  if (response || !session) return response!;

  try {
    const incoming = await request.formData();
    const file = incoming.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const orderId = String(incoming.get("order_id") || "").toLowerCase().trim();
    const customerId = Number(incoming.get("customer_id") || 0);
    const requiresApproval = String(incoming.get("requires_approval") || "false") === "true";
    const uploaderRole = (session.user as { role?: string }).role || "user";
    const uploaderId = Number(session.user.id);

    if (!orderId) {
      return NextResponse.json({ error: "order_id is required" }, { status: 400 });
    }

    const saved = await saveVaultFile(orderId, file);
    const approvalStatus = requiresApproval ? "pending" : "not_required";

    const result = await db.insert(vaultAssets).values({
      orderId,
      customerId,
      uploaderId,
      fileUrl: saved.publicUrl,
      filePath: saved.absolutePath,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      fileSize: saved.fileSize,
      requiresApproval,
      approvalStatus,
    }).$returningId();

    const assetId = Number(result[0]?.id || 0);

    // ── Uploader name ─────────────────────────────────────────────────────
    const [uploaderRow] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, uploaderId))
      .limit(1);
    const uploaderName = uploaderRow?.name || "Admin";

    // ── Build the WS payload ──────────────────────────────────────────────
    const wsPayload = {
      orderId,
      assetId,
      fileName: file.name,
      fileUrl: saved.publicUrl,
      customerId,
      uploaderName,
      uploaderRole,
    };

    // ── Notify based on who uploaded ──────────────────────────────────────
    if (uploaderRole === "admin" || uploaderRole === "super_admin" || uploaderRole === "manager") {
      // Admin uploaded → notify the customer (customerId maps to user.id)
      if (customerId > 0) {
        // Create DB notification for the customer
        await db.insert(notifications).values({
          userId: customerId,
          type: "file_upload",
          title: "New file uploaded to your order",
          message: `${uploaderName} uploaded "${file.name}" on order ${orderId.toUpperCase()}`,
          orderId,
          assetId,
          fromUserId: uploaderId,
          isRead: false,
        }).catch(() => {/* non-fatal */});

        // Push via WebSocket to the customer
        broadcastToUser(customerId, "file_uploaded", wsPayload);
      }
      // Also broadcast to all admins so their dashboards refresh
      broadcastToAll("file_uploaded", wsPayload);
    } else {
      // Customer uploaded → notify all admins
      broadcastToAll("file_uploaded", wsPayload);

      // Create DB notifications for every admin/super_admin user
      const adminUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.isActive, true)))
        .limit(50);

      for (const admin of adminUsers) {
        await db.insert(notifications).values({
          userId: admin.id,
          type: "file_upload",
          title: "Customer uploaded a file",
          message: `Customer uploaded "${file.name}" on order ${orderId.toUpperCase()}`,
          orderId,
          assetId,
          fromUserId: uploaderId,
          isRead: false,
        }).catch(() => {/* non-fatal */});
      }
    }

    return NextResponse.json({
      success: true,
      id: assetId,
      url: saved.publicUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
