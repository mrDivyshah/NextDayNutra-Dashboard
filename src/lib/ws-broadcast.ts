// lib/ws-broadcast.ts
// Called from API routes (server-side) to broadcast WebSocket events.
// We access the global wss set by server.mjs rather than importing ws-server.ts
// to avoid circular dependencies and ensure the singleton is used.

import type { WSEvent, WSEventType } from "@/lib/ws-server";

/** Broadcast an event to a specific user id */
export function broadcastToUser(userId: number, type: WSEventType, payload: Record<string, unknown>) {
  const clients = global.__ndnWsClients;
  if (!clients) return;
  const event: WSEvent = { type, payload, userId, timestamp: new Date().toISOString() };
  const msg = JSON.stringify(event);
  clients.forEach((info, ws) => {
    const w = ws as unknown as { readyState: number; send: (d: string) => void };
    if (info.userId === userId && w.readyState === 1) w.send(msg);
  });
}

/** Broadcast an event to everyone with a matching role */
export function broadcastToRole(role: string, type: WSEventType, payload: Record<string, unknown>) {
  const clients = global.__ndnWsClients;
  if (!clients) return;
  const event: WSEvent = { type, payload, timestamp: new Date().toISOString() };
  const msg = JSON.stringify(event);
  clients.forEach((info, ws) => {
    const w = ws as unknown as { readyState: number; send: (d: string) => void };
    if (info.role === role && w.readyState === 1) w.send(msg);
  });
}

/** Broadcast an event to every connected client */
export function broadcastToAll(type: WSEventType, payload: Record<string, unknown>) {
  const clients = global.__ndnWsClients;
  if (!clients) return;
  const event: WSEvent = { type, payload, timestamp: new Date().toISOString() };
  const msg = JSON.stringify(event);
  clients.forEach((_info, ws) => {
    const w = ws as unknown as { readyState: number; send: (d: string) => void };
    if (w.readyState === 1) w.send(msg);
  });
}

/** Get the list of active users (for super admin panel) */
export function getActiveUsers() {
  const clients = global.__ndnWsClients;
  if (!clients) return [];
  const users: Array<{ userId: number; name: string; role: string; connectedAt: string; lastPing: string }> = [];
  clients.forEach((info) => users.push({ ...info }));
  return users;
}
