"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import type { WSEvent, WSEventType } from "@/lib/ws-server";

export type { WSEvent, WSEventType };

export type WSNotification = {
  id: number;
  type: string;
  title: string;
  message: string;
  orderId?: string | null;
  assetId?: number | null;
  fromUserId?: number | null;
  fromName?: string;
  isRead: boolean;
  createdAt: string;
};

export type ActiveUser = {
  userId: number;
  name: string;
  role: string;
  connectedAt: string;
  lastPing: string;
};

type UseNDNWebSocketOptions = {
  userId: number;
  name: string;
  role: string;
  onEvent?: (event: WSEvent) => void;
  enabled?: boolean;
};

/** Hook: Manages a WebSocket connection to /api/ws and exposes real-time events */
export function useNDNWebSocket({ userId, name, role, onEvent, enabled = true }: UseNDNWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [connected, setConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    if (!userId || !enabled || typeof window === "undefined") return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const url = `${protocol}://${window.location.host}/api/ws?userId=${userId}&name=${encodeURIComponent(name)}&role=${encodeURIComponent(role)}`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        // Heartbeat ping every 25 seconds
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping", payload: {}, timestamp: new Date().toISOString() }));
          }
        }, 25_000);
      };

      ws.onmessage = (ev) => {
        try {
          const event = JSON.parse(ev.data) as WSEvent;
          if (event.type === "active_users") {
            setActiveUsers((event.payload.users as ActiveUser[]) || []);
          }
          onEventRef.current?.(event);
        } catch { /* ignore malformed */ }
      };

      ws.onclose = () => {
        setConnected(false);
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        // Auto-reconnect after 4 seconds
        reconnectTimeoutRef.current = setTimeout(connect, 4_000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch { /* WS not available */ }
  }, [userId, name, role, enabled]);

  useEffect(() => {
    if (enabled && userId) connect();
    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [connect, enabled, userId]);

  return { connected, activeUsers };
}

/** Hook: Manages notifications fetching + real-time updates via WS */
export function useNotifications(userId: number) {
  const [notifications, setNotifications] = useState<WSNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const r = await fetch("/api/notifications?limit=30");
      if (!r.ok) return;
      const data = (await r.json()) as WSNotification[];
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.isRead).length);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [userId]);

  // Add a new real-time notification at the top
  const addRealtimeNotification = useCallback((event: WSEvent) => {
    if (event.type === "file_uploaded" || event.type === "comment_posted") {
      const newNotif: WSNotification = {
        id: Date.now(),
        type: event.type === "file_uploaded" ? "file_upload" : "comment",
        title: event.type === "file_uploaded"
          ? "New file uploaded"
          : "New comment",
        message: event.type === "file_uploaded"
          ? `File "${(event.payload.fileName as string) || ""}" on order ${((event.payload.orderId as string) || "").toUpperCase()}`
          : `Comment on order ${((event.payload.orderId as string) || "").toUpperCase()}: "${(event.payload.commentText as string) || ""}"`,
        orderId: event.payload.orderId as string | undefined,
        assetId: event.payload.assetId as number | undefined,
        fromName: (event.payload.commenterName || event.payload.uploaderName) as string | undefined,
        isRead: false,
        createdAt: event.timestamp,
      };
      setNotifications((prev) => [newNotif, ...prev].slice(0, 50));
      setUnreadCount((c) => c + 1);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    await fetch("/api/notifications", { method: "PATCH" }).catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return { notifications, unreadCount, loading, fetchNotifications, addRealtimeNotification, markAllRead };
}

/** Hook: Track highlighted (unread) order IDs for the current user */
export function useOrderHighlights(orderIds: string[]) {
  // Map of orderId → timestamp of last event (used to "highlight" the row)
  const [highlightedOrders, setHighlightedOrders] = useState<Record<string, string>>({});

  /** Call this when a WS event arrives for an order */
  const markHighlighted = useCallback((orderId: string) => {
    const id = orderId.toLowerCase();
    setHighlightedOrders((prev) => ({ ...prev, [id]: new Date().toISOString() }));
  }, []);

  /** Call this when user expands an order row (marks it read) */
  const markRead = useCallback(async (orderId: string) => {
    const id = orderId.toLowerCase();
    setHighlightedOrders((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    // Persist to DB
    await fetch("/api/order-highlights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: id }),
    }).catch(() => {});
  }, []);

  const isHighlighted = useCallback((orderId: string) => {
    return orderId.toLowerCase() in highlightedOrders;
  }, [highlightedOrders]);

  return { highlightedOrders, markHighlighted, markRead, isHighlighted };
}
