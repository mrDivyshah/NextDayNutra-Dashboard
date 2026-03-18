"use client";

import React from "react";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Globe,
  Settings,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Circle,
  LogOut,
  Calendar,
} from "lucide-react";
import type { NavSection } from "@/types/dashboard";
import { signOut } from "next-auth/react";

interface NavItem {
  key: NavSection;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavGroup {
  key: string;
  label: string;
  icon: React.ElementType;
  items: NavItem[];
}

interface ActiveUser {
  name: string;
  role: string;
}

interface DashboardSidebarProps {
  section: NavSection;
  setSection: (s: NavSection) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: (p: boolean) => boolean) => void;
  expanded: string[];
  toggleExpand: (key: string) => void;
  navGroups: NavGroup[];
  currentUser: { id: number; name: string; role: string } | null;
  activeUsers: ActiveUser[];
  activeUsersOpen: boolean;
  setActiveUsersOpen: (v: (p: boolean) => boolean) => void;
}

export function DashboardSidebar({
  section,
  setSection,
  sidebarCollapsed,
  setSidebarCollapsed,
  expanded,
  toggleExpand,
  navGroups,
  currentUser,
  activeUsers,
  activeUsersOpen,
  setActiveUsersOpen,
}: DashboardSidebarProps) {
  return (
    <aside
      style={{
        width: sidebarCollapsed ? 64 : 240,
        flexShrink: 0,
        background: "#123e67",
        borderRight: "none",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.25s ease",
        overflow: "hidden",
        boxShadow: "4px 0 24px -8px rgba(0,0,0,0.25)",
      }}
    >
      {/* Branding header */}
      <div
        style={{
          padding: "20px 16px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
          background: "#fff",
        }}
      >
        {!sidebarCollapsed ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/next_day_nutra.png"
              alt="NDN Logo"
              style={{ width: 140, objectFit: "contain" }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
            }}
          >
            <span style={{ fontWeight: 800, fontSize: 16, color: "#123e67" }}>NDN</span>
          </div>
        )}
        <button
          onClick={() => setSidebarCollapsed((p) => !p)}
          style={{
            marginLeft: "auto",
            background: "rgba(0,0,0,0.12)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 8,
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#fff",
            flexShrink: 0,
          }}
        >
          <ChevronRight
            size={14}
            style={{
              transform: sidebarCollapsed ? "rotate(0deg)" : "rotate(180deg)",
              transition: "transform 0.25s",
              color: "#000",
            }}
          />
        </button>
      </div>

      {/* Nav groups */}
      <nav
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {navGroups.map((group) => {
          const isGroupExp = expanded.includes(group.key);
          const GroupIcon = group.icon;
          return (
            <div key={group.key}>
              {!sidebarCollapsed && (
                <button
                  onClick={() => toggleExpand(group.key)}
                  style={{
                    width: "100%",
                    background: "none",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 8px",
                    cursor: "pointer",
                    borderRadius: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: "rgba(255,255,255,0.5)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <GroupIcon size={11} /> {group.label}
                  </span>
                  {isGroupExp ? (
                    <ChevronDown size={12} color="rgba(255,255,255,0.5)" />
                  ) : (
                    <ChevronRight size={12} color="rgba(255,255,255,0.5)" />
                  )}
                </button>
              )}
              {(isGroupExp || sidebarCollapsed) &&
                group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = section === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setSection(item.key)}
                      title={sidebarCollapsed ? item.label : undefined}
                      style={{
                        width: "100%",
                        border: "none",
                        cursor: "pointer",
                        borderRadius: 10,
                        padding: sidebarCollapsed ? "9px 0" : "9px 12px",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        justifyContent: sidebarCollapsed ? "center" : "flex-start",
                        background: isActive ? "#f05323" : "transparent",
                        color: isActive ? "#ffffff" : "rgba(255,255,255,0.75)",
                        fontWeight: isActive ? 700 : 500,
                        fontSize: 13,
                        transition: "all 0.15s",
                        marginBottom: 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive)
                          (e.currentTarget as HTMLButtonElement).style.background =
                            "rgba(255,255,255,0.1)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive)
                          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                      }}
                    >
                      <Icon size={15} style={{ flexShrink: 0 }} />
                      {!sidebarCollapsed && (
                        <>
                          <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
                          {"badge" in item &&
                            item.badge !== undefined &&
                            item.badge > 0 && (
                              <span
                                style={{
                                  background: isActive ? "#fff" : "rgba(255,255,255,0.2)",
                                  color: isActive ? "#f05323" : "rgba(255,255,255,0.7)",
                                  fontSize: 10,
                                  padding: "1px 7px",
                                  borderRadius: 10,
                                  fontWeight: 700,
                                }}
                              >
                                {item.badge}
                              </span>
                            )}
                        </>
                      )}
                    </button>
                  );
                })}
            </div>
          );
        })}

        {/* External Links Group */}
        <div style={{ marginTop: 20 }}>
          {!sidebarCollapsed && (
            <div
              style={{
                padding: "6px 16px",
                fontSize: 10,
                fontWeight: 800,
                color: "rgba(255,255,255,0.4)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 4,
              }}
            >
              Next Day Nutra
            </div>
          )}
          <SidebarExternalLink
            href="https://ndnfulfillment.com/"
            label="NDN Fulfillment"
            icon={<Globe size={15} style={{ flexShrink: 0 }} />}
            collapsed={sidebarCollapsed}
          />
          <SidebarExternalLink
            href="https://dashboard.nextdaynutra.com/book-an-appointment"
            label="Contact Sales"
            icon={<Calendar size={15} style={{ flexShrink: 0 }} />}
            collapsed={sidebarCollapsed}
          />
        </div>
      </nav>

      {/* Active Users Panel (admin only) */}
      {!sidebarCollapsed &&
        currentUser &&
        (currentUser.role === "super_admin" || currentUser.role === "admin") && (
          <div
            style={{
              margin: "0 8px 4px",
              borderRadius: 10,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <button
              onClick={() => setActiveUsersOpen((p) => !p)}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.06)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "9px 12px",
                cursor: "pointer",
                color: "rgba(255,255,255,0.8)",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Circle size={8} fill="#22c55e" color="#22c55e" style={{ animation: "pulse 2s infinite" }} />
                <span>Active Users</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    background: "rgba(34,197,94,0.2)",
                    color: "#4ade80",
                    fontSize: 10,
                    padding: "1px 7px",
                    borderRadius: 8,
                    fontWeight: 800,
                  }}
                >
                  {activeUsers.length}
                </span>
                {activeUsersOpen ? (
                  <ChevronUp size={12} color="rgba(255,255,255,0.5)" />
                ) : (
                  <ChevronDown size={12} color="rgba(255,255,255,0.5)" />
                )}
              </div>
            </button>
            {activeUsersOpen && (
              <div style={{ maxHeight: 180, overflowY: "auto", background: "rgba(0,0,0,0.1)" }}>
                {activeUsers.length === 0 ? (
                  <div
                    style={{
                      padding: "12px",
                      fontSize: 11,
                      color: "rgba(255,255,255,0.4)",
                      textAlign: "center",
                    }}
                  >
                    No other users online
                  </div>
                ) : (
                  activeUsers.map((u, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "7px 12px",
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: "50%",
                          background: "#f05323",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          fontWeight: 800,
                          color: "#fff",
                          flexShrink: 0,
                        }}
                      >
                        {u.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "rgba(255,255,255,0.9)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {u.name}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: "rgba(255,255,255,0.4)",
                            textTransform: "capitalize",
                          }}
                        >
                          {u.role.replace("_", " ")}
                        </div>
                      </div>
                      <Circle size={7} fill="#22c55e" color="#22c55e" />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

      {/* Footer: user profile + sign out */}
      <div
        style={{
          padding: sidebarCollapsed ? "16px 8px" : "16px",
          borderTop: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: sidebarCollapsed ? 0 : 16,
            justifyContent: sidebarCollapsed ? "center" : "flex-start",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "#f05323",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            {currentUser?.name
              ? currentUser.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : "U"}
          </div>
          {!sidebarCollapsed && (
            <div style={{ overflow: "hidden" }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: "#fff",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {currentUser?.name || "Loading..."}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.6)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  textTransform: "capitalize",
                }}
              >
                {currentUser?.role?.replace("_", " ") || "User"}
              </div>
            </div>
          )}
        </div>

        {!sidebarCollapsed && (
          <button
            onClick={() => signOut()}
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              padding: "9px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: "pointer",
              fontSize: 13,
              color: "rgba(255,255,255,0.8)",
              fontWeight: 600,
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(239,68,68,0.2)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.05)")
            }
          >
            <LogOut size={14} /> Sign Out
          </button>
        )}
      </div>
    </aside>
  );
}

// ─── Helper sub-component ─────────────────────────────────────────────────────
function SidebarExternalLink({
  href,
  label,
  icon,
  collapsed,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  collapsed: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={collapsed ? label : undefined}
      style={{
        width: "100%",
        border: "none",
        cursor: "pointer",
        borderRadius: 10,
        padding: collapsed ? "9px 0" : "9px 12px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        justifyContent: collapsed ? "center" : "flex-start",
        background: "transparent",
        color: "rgba(255,255,255,0.75)",
        fontWeight: 500,
        fontSize: 13,
        textDecoration: "none",
        transition: "all 0.15s",
        marginBottom: 2,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {icon}
      {!collapsed && <span style={{ flex: 1 }}>{label}</span>}
    </a>
  );
}

// Re-export icon references so navGroups can be built outside
export { LayoutDashboard, Users, Briefcase, Globe, Settings, Sparkles };
