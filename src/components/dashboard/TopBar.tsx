"use client";

import React from "react";
import {
  Search,
  Bell,
  Wifi,
  WifiOff,
  MessageSquare,
  Upload,
  Check,
  X,
} from "lucide-react";
import type { WSNotification } from "@/hooks/useNDNWebSocket";
import { formatRelTime } from "@/types/dashboard";

interface TopBarProps {
  activeLabel: string;
  sectionGroupLabel: string;
  search: string;
  setSearch: (v: string) => void;
  connected: boolean;
  notifOpen: boolean;
  setNotifOpen: (v: (p: boolean) => boolean) => void;
  unreadCount: number;
  dbNotifications: WSNotification[];
  markAllRead: () => void;
  markRead: (orderId: string) => void;
}

export function TopBar({
  activeLabel,
  sectionGroupLabel,
  search,
  setSearch,
  connected,
  notifOpen,
  setNotifOpen,
  unreadCount,
  dbNotifications,
  markAllRead,
  markRead,
}: TopBarProps) {
  return (
    <header
      style={{
        padding: "18px 28px",
        borderBottom: "1px solid #f1f5f9",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}
    >
      {/* Title */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 2,
          }}
        >
          {sectionGroupLabel}
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 800,
            color: "#0f172a",
            letterSpacing: "-0.02em",
          }}
        >
          {activeLabel}
        </h1>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative" }}>
          <Search
            size={14}
            color="#94a3b8"
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Quick search…"
            style={{
              paddingLeft: 36,
              height: 38,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              fontSize: 13,
              color: "#334155",
              outline: "none",
              width: 180,
            }}
          />
        </div>

        {/* WS Connection */}
        <div
          title={connected ? "Live — real-time updates active" : "Connecting…"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "5px 10px",
            background: connected ? "#dcfce7" : "#fef3c7",
            borderRadius: 20,
            border: `1px solid ${connected ? "#86efac" : "#fcd34d"}`,
          }}
        >
          {connected ? (
            <Wifi size={12} color="#16a34a" />
          ) : (
            <WifiOff size={12} color="#d97706" />
          )}
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: connected ? "#16a34a" : "#d97706",
            }}
          >
            {connected ? "Live" : "Connecting"}
          </span>
        </div>

        {/* Notification Bell */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setNotifOpen((p) => !p)}
            style={{
              width: 38,
              height: 38,
              background: notifOpen ? "#fef0ec" : "#f8fafc",
              border: `1px solid ${notifOpen ? "#f8c4b4" : "#e2e8f0"}`,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              position: "relative",
            }}
          >
            <Bell size={16} color={notifOpen ? "#f05323" : "#64748b"} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  minWidth: 18,
                  height: 18,
                  background: "#f05323",
                  borderRadius: 9,
                  border: "2px solid #fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 800,
                  color: "#fff",
                  padding: "0 4px",
                }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 99 }}
                onClick={() => setNotifOpen(() => false)}
              />
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 46,
                  width: 360,
                  background: "#fff",
                  borderRadius: 16,
                  boxShadow: "0 20px 60px -10px rgba(15,23,42,0.18)",
                  border: "1px solid #e2e8f0",
                  zIndex: 100,
                  overflow: "hidden",
                }}
              >
                {/* Notif header */}
                <div
                  style={{
                    padding: "14px 18px",
                    borderBottom: "1px solid #f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: "#0f172a" }}>
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span
                        style={{
                          background: "#f05323",
                          color: "#fff",
                          fontSize: 10,
                          padding: "2px 8px",
                          borderRadius: 10,
                          fontWeight: 700,
                        }}
                      >
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllRead()}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#64748b",
                          background: "#f1f5f9",
                          border: "none",
                          borderRadius: 6,
                          padding: "4px 8px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Check size={10} /> Mark all read
                      </button>
                    )}
                    <button
                      onClick={() => setNotifOpen(() => false)}
                      style={{
                        background: "none",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        color: "#94a3b8",
                        cursor: "pointer",
                        fontSize: 16,
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* Notif list */}
                <div style={{ maxHeight: 380, overflowY: "auto" }}>
                  {dbNotifications.length === 0 ? (
                    <div
                      style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8" }}
                    >
                      <Bell size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
                      <p style={{ margin: 0, fontSize: 13 }}>No notifications yet</p>
                    </div>
                  ) : (
                    dbNotifications.map((n, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "12px 18px",
                          borderBottom: "1px solid #f8fafc",
                          display: "flex",
                          gap: 12,
                          alignItems: "flex-start",
                          background: !n.isRead ? "#fff7f0" : "#fff",
                          cursor: "pointer",
                          transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLElement).style.background = "#f8fafc")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLElement).style.background = !n.isRead
                            ? "#fff7f0"
                            : "#fff")
                        }
                        onClick={() => {
                          if (n.orderId) {
                            markRead(n.orderId);
                            setNotifOpen(() => false);
                          }
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: n.type === "comment" ? "#eff6ff" : "#fff7ed",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {n.type === "comment" ? (
                            <MessageSquare size={16} color="#3b82f6" />
                          ) : (
                            <Upload size={16} color="#f97316" />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: 13,
                              color: "#0f172a",
                              marginBottom: 2,
                            }}
                          >
                            {n.title}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#64748b",
                              marginBottom: 3,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {n.message}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#94a3b8",
                              display: "flex",
                              gap: 8,
                              alignItems: "center",
                            }}
                          >
                            {n.fromName && <span>{n.fromName}</span>}
                            <span>{formatRelTime(n.createdAt)}</span>
                          </div>
                        </div>
                        {!n.isRead && (
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: "#f05323",
                              flexShrink: 0,
                              marginTop: 6,
                            }}
                          />
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div
                  style={{
                    padding: "10px 18px",
                    borderTop: "1px solid #f1f5f9",
                    textAlign: "center",
                  }}
                >
                  <button
                    onClick={() => markAllRead()}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#f05323",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Mark all as read
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
