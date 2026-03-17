import type { IncomingMessage } from "http";

// ─── Types ────────────────────────────────────────────────────────────────────
export type WSEventType =
  | "file_uploaded"      // admin uploaded file to an order
  | "comment_posted"     // customer commented on an order asset
  | "notification"       // generic notification
  | "ping"
  | "pong"
  | "connected"
  | "active_users";      // broadcast list of active users (for super admin)

export type WSEvent = {
  type: WSEventType;
  payload: Record<string, unknown>;
  userId?: number;
  orderId?: string;
  timestamp: string;
};

export type ActiveUser = {
  userId: number;
  name: string;
  role: string;
  connectedAt: string;
  lastPing: string;
};

// ─── Singleton state ──────────────────────────────────────────────────────────
declare global {
  // eslint-disable-next-line no-var
  var __ndnWss: import("ws").WebSocketServer | undefined;
  // eslint-disable-next-line no-var
  var __ndnWsClients: Map<import("ws").WebSocket, { userId: number; name: string; role: string; connectedAt: string; lastPing: string }> | undefined;
}

function getClientMap() {
  if (!global.__ndnWsClients) {
    global.__ndnWsClients = new Map();
  }
  return global.__ndnWsClients;
}

// ─── Broadcast helpers ────────────────────────────────────────────────────────
export function broadcastToUser(userId: number, event: WSEvent) {
  const clients = getClientMap();
  const msg = JSON.stringify(event);
  clients.forEach((info, ws) => {
    if (info.userId === userId && (ws as unknown as { readyState: number }).readyState === 1) {
      (ws as unknown as { send: (d: string) => void }).send(msg);
    }
  });
}

export function broadcastToAll(event: WSEvent) {
  const clients = getClientMap();
  const msg = JSON.stringify(event);
  clients.forEach((_info, ws) => {
    if ((ws as unknown as { readyState: number }).readyState === 1) {
      (ws as unknown as { send: (d: string) => void }).send(msg);
    }
  });
}

export function broadcastToRole(role: string, event: WSEvent) {
  const clients = getClientMap();
  const msg = JSON.stringify(event);
  clients.forEach((info, ws) => {
    if (info.role === role && (ws as unknown as { readyState: number }).readyState === 1) {
      (ws as unknown as { send: (d: string) => void }).send(msg);
    }
  });
}

export function getActiveUsers(): ActiveUser[] {
  const clients = getClientMap();
  const users: ActiveUser[] = [];
  clients.forEach((info) => {
    users.push({ ...info });
  });
  return users;
}

// ─── Server initialiser (called from custom server or API route upgrade) ──────
export function getOrCreateWss(httpServer?: import("http").Server) {
  if (global.__ndnWss) return global.__ndnWss;

  // Dynamically require ws so it only loads server-side
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { WebSocketServer } = require("ws") as typeof import("ws");
  const clients = getClientMap();

  const wss = httpServer
    ? new WebSocketServer({ server: httpServer, path: "/api/ws" })
    : new WebSocketServer({ noServer: true });

  wss.on("connection", (ws: import("ws").WebSocket, req: IncomingMessage) => {
    // Parse userId/name/role from query string (set by client after session fetch)
    const url = new URL(req.url || "/", "http://localhost");
    const userId = Number(url.searchParams.get("userId") || 0);
    const name = decodeURIComponent(url.searchParams.get("name") || "Unknown");
    const role = decodeURIComponent(url.searchParams.get("role") || "user");

    const now = new Date().toISOString();
    clients.set(ws, { userId, name, role, connectedAt: now, lastPing: now });

    // Send welcome
    ws.send(JSON.stringify({
      type: "connected",
      payload: { userId, message: "Connected to NDN realtime" },
      timestamp: new Date().toISOString(),
    } satisfies WSEvent));

    // Broadcast updated active users list to super admins
    broadcastActiveUsers();

    ws.on("message", (raw) => {
      try {
        const data = JSON.parse(String(raw)) as WSEvent;
        if (data.type === "ping") {
          const info = clients.get(ws);
          if (info) info.lastPing = new Date().toISOString();
          ws.send(JSON.stringify({ type: "pong", payload: {}, timestamp: new Date().toISOString() } satisfies WSEvent));
        }
      } catch { /* ignore bad messages */ }
    });

    ws.on("close", () => {
      clients.delete(ws);
      broadcastActiveUsers();
    });

    ws.on("error", () => {
      clients.delete(ws);
    });
  });

  global.__ndnWss = wss;
  return wss;
}

function broadcastActiveUsers() {
  const event: WSEvent = {
    type: "active_users",
    payload: { users: getActiveUsers() },
    timestamp: new Date().toISOString(),
  };
  // Only send to super_admin and admin roles
  const clients = getClientMap();
  const msg = JSON.stringify(event);
  clients.forEach((info, ws) => {
    if (
      (info.role === "super_admin" || info.role === "admin") &&
      (ws as unknown as { readyState: number }).readyState === 1
    ) {
      (ws as unknown as { send: (d: string) => void }).send(msg);
    }
  });
}
