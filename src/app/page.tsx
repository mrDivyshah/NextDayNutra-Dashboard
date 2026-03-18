"use client";

import React, { useState, useEffect, Suspense, useMemo, useCallback } from "react";
import { LayoutDashboard, Users, Briefcase, Globe, Settings, Sparkles } from "lucide-react";
import { signOut } from "next-auth/react";
import { useNDNWebSocket, useNotifications, useOrderHighlights } from "@/hooks/useNDNWebSocket";
import type { WSEvent } from "@/hooks/useNDNWebSocket";

import type { Order, Customer, NavSection, JiraCustomer, JiraAgent } from "@/types/dashboard";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { CustomerOrdersView } from "@/components/dashboard/CustomerOrdersView";
import { AgentHierarchyView } from "@/components/dashboard/AgentHierarchyView";
import { SettingsSection } from "@/components/dashboard/SettingsSection";

// Suppress unused import warning
void signOut;

// ─── Root export ──────────────────────────────────────────────────────────────
export default function V2DashboardPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Loading workspace...</div>}>
      <V2Dashboard />
    </Suspense>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
function V2Dashboard() {
  const [section, setSection] = useState<NavSection>("customers");
  const [expanded, setExpanded] = useState<string[]>(["dashboards-group"]);
  const [notifOpen, setNotifOpen] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [activeJiraCustomers, setActiveJiraCustomers] = useState<JiraCustomer[]>([]);
  const [activeJiraAgents, setActiveJiraAgents] = useState<JiraAgent[]>([]);
  const [isLoadingJira, setIsLoadingJira] = useState(false);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Order; direction: "asc" | "desc" } | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: number; name: string; role: string } | null>(null);
  const [activeUsersOpen, setActiveUsersOpen] = useState(false);

  // ── Session ───────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) {
          setCurrentUser({ id: Number(data.user.id), name: data.user.name, role: data.user.role });
        }
      })
      .catch(console.error);
  }, []);

  // ── Order Highlights ──────────────────────────────────────────────────────
  const { markHighlighted, markRead, isHighlighted } = useOrderHighlights([]);

  // ── Notifications ─────────────────────────────────────────────────────────
  const { notifications: dbNotifications, unreadCount, addRealtimeNotification, markAllRead } =
    useNotifications(currentUser?.id || 0);

  // ── WebSocket ─────────────────────────────────────────────────────────────
  const handleWSEvent = useCallback(
    (event: WSEvent) => {
      addRealtimeNotification(event);
      if (event.type === "file_uploaded" || event.type === "comment_posted") {
        const orderId = event.payload.orderId as string;
        if (orderId) markHighlighted(orderId);
      }
    },
    [addRealtimeNotification, markHighlighted]
  );

  const { connected, activeUsers } = useNDNWebSocket({
    userId: currentUser?.id || 0,
    name: currentUser?.name || "",
    role: currentUser?.role || "",
    onEvent: handleWSEvent,
    enabled: !!currentUser,
  });

  // ── Sort ──────────────────────────────────────────────────────────────────
  const requestSort = (key: keyof Order) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // ── viewMode derived from section ─────────────────────────────────────────
  const viewMode = section === "agents" ? "agent" : section === "internal" ? "internal" : "client";

  // ── Fetch Jira lists ──────────────────────────────────────────────────────
  useEffect(() => {
    setIsLoadingJira(true);
    const cacheBuster = `&t=${Date.now()}`;
    Promise.all([
      fetch(`/api/jira/customers?type=customer${cacheBuster}`).then((r) => r.json()),
      fetch(`/api/jira/customers?type=agent${cacheBuster}`).then((r) => r.json()),
    ])
      .then(([customers, agents]) => {
        setActiveJiraCustomers(Array.isArray(customers) ? customers : []);
        setActiveJiraAgents(Array.isArray(agents) ? agents : []);
      })
      .catch(() => {
        setActiveJiraCustomers([]);
        setActiveJiraAgents([]);
      })
      .finally(() => setIsLoadingJira(false));
  }, []);

  // ── Derive customer lists ─────────────────────────────────────────────────
  const filteredUsersList = useMemo((): Customer[] => {
    if (viewMode === "agent")
      return activeJiraAgents.map((a, i) => ({
        id: -(i + 1001),
        name: a.name,
        jiraId: a.jiraId,
        users: [],
        isAgent: true,
      }));
    if (viewMode === "internal") return [];
    return activeJiraCustomers.map((item, i) => ({
      id: -(i + 1),
      name: item.name,
      jiraId: item.jiraId,
      users: [],
      isAgent: false,
      agent: item.agent,
    }));
  }, [activeJiraCustomers, activeJiraAgents, viewMode]);

  const selectedCustomer = useMemo(
    () =>
      selectedCustomerId === null
        ? null
        : filteredUsersList.find((c) => c.id === selectedCustomerId) ?? null,
    [selectedCustomerId, filteredUsersList]
  );

  // ── Fetch orders ──────────────────────────────────────────────────────────
  useEffect(() => {
    setIsLoadingOrders(true);
    let url = `/api/jira/orders?view=${viewMode}`;
    if (viewMode === "client" && selectedCustomer)
      url += `&customerName=${encodeURIComponent(selectedCustomer.name.trim())}`;
    else if (viewMode === "agent" && selectedCustomer)
      url += `&agentName=${encodeURIComponent(selectedCustomer.name.trim())}`;
    else if (viewMode === "client" || viewMode === "agent")
      url = `/api/jira/orders?view=internal`;

    url += (url.includes("?") ? "&" : "?") + `t=${Date.now()}`;

    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setActiveOrders(d.activeOrders || []);
        setCompletedOrders(d.completedOrders || []);
      })
      .catch(() => {
        setActiveOrders([]);
        setCompletedOrders([]);
      })
      .finally(() => setIsLoadingOrders(false));
  }, [selectedCustomer, viewMode]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const resolveCustomerId = (name: string) => {
    const n = name.trim().toLowerCase();
    const m = filteredUsersList.find((c) => c.name.trim().toLowerCase() === n);
    return m?.users?.[0]?.id ?? m?.id ?? 0;
  };

  const toggleExpand = (key: string) =>
    setExpanded((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );

  const toggleRow = (id: number, orderId?: string) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
    if (orderId && !expandedRows.includes(id)) markRead(orderId);
  };

  // ── Combined orders ───────────────────────────────────────────────────────
  const allOrdersCombined = useMemo(
    () => [
      ...activeOrders.map((o) => ({ ...o, _tab: "active" } as Order & { _tab: string })),
      ...completedOrders.map((o) => ({ ...o, _tab: "completed" } as Order & { _tab: string })),
    ],
    [activeOrders, completedOrders]
  );

  // ── Nav groups ────────────────────────────────────────────────────────────
  const navGroups = [
    {
      key: "dashboards-group",
      label: "Dashboards",
      icon: LayoutDashboard,
      items: [
        { key: "customers" as NavSection, label: "Customer Dashboard", icon: Users, badge: activeJiraCustomers.length },
        { key: "agents" as NavSection, label: "Agent Dashboard", icon: Briefcase, badge: activeJiraAgents.length },
        { key: "multi-location" as NavSection, label: "Multi location", icon: Globe },
        { key: "executive" as NavSection, label: "Executive", icon: Sparkles },
      ],
    },
    {
      key: "settings-group",
      label: "Config",
      icon: Settings,
      items: [{ key: "settings" as NavSection, label: "Settings", icon: Settings }],
    },
  ];

  const activeLabel = navGroups.flatMap((g) => g.items).find((i) => i.key === section)?.label ?? "";
  const sectionGroupLabel =
    navGroups.find((g) => g.items.some((i) => i.key === section))?.label ?? "";

  // ── Section content ───────────────────────────────────────────────────────
  const renderContent = () => {
    switch (section) {
      case "customers":
        return (
          <CustomerOrdersView
            viewMode="client"
            filteredUsersList={filteredUsersList}
            selectedCustomerId={selectedCustomerId}
            setSelectedCustomerId={setSelectedCustomerId}
            selectedCustomer={selectedCustomer}
            isLoadingJira={isLoadingJira}
            isLoadingOrders={isLoadingOrders}
            allOrders={allOrdersCombined}
            expandedRows={expandedRows}
            sortConfig={sortConfig}
            onSort={requestSort}
            onToggleRow={toggleRow}
            isHighlighted={isHighlighted}
            resolveCustomerId={resolveCustomerId}
          />
        );
      case "agents":
        return (
          <AgentHierarchyView
            allOrders={allOrdersCombined}
            allAgents={activeJiraAgents}
            allAssignments={activeJiraCustomers}
            isLoading={isLoadingOrders}
            expandedRows={expandedRows}
            sortConfig={sortConfig}
            onSort={requestSort}
            onToggleRow={toggleRow}
            isHighlighted={isHighlighted}
            resolveCustomerId={resolveCustomerId}
            onSelectCustomer={setSelectedCustomerId}
          />
        );
      case "settings":
        return <SettingsSection />;
      case "multi-location":
        return (
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              height: "calc(100vh - 120px)",
              overflow: "hidden",
            }}
          >
            <iframe
              src="https://hotworks.nextdaynutra.com"
              style={{ width: "100%", height: "100%", border: "none" }}
              title="Multi-location Dashboard"
            />
          </div>
        );
      case "executive":
        return (
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              height: "calc(100vh - 120px)",
              overflow: "hidden",
            }}
          >
            <iframe
              src="https://exe.nextdaynutra.com"
              style={{ width: "100%", height: "100%", border: "none" }}
              title="Executive Dashboard"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        gap: 0,
        padding: 0,
        background: "transparent",
      }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .order-row {
          transition: all 0.2s ease !important;
          position: relative;
        }
        .order-row:hover {
          background-color: #f8fafc !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px -4px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.05) !important;
          z-index: 2;
        }
        .order-row:hover td {
          background-color: #f8fafc !important;
        }
        .customer-name-link:hover {
          text-decoration: underline;
          text-decoration-color: #000;
          text-decoration-thickness: 1px;
        }
      `}</style>

      {/* Sidebar */}
      <DashboardSidebar
        section={section}
        setSection={setSection}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        expanded={expanded}
        toggleExpand={toggleExpand}
        navGroups={navGroups}
        currentUser={currentUser}
        activeUsers={activeUsers}
        activeUsersOpen={activeUsersOpen}
        setActiveUsersOpen={setActiveUsersOpen}
      />

      {/* Main content */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(20px)",
        }}
      >
        <TopBar
          activeLabel={activeLabel}
          sectionGroupLabel={sectionGroupLabel}
          search={search}
          setSearch={setSearch}
          connected={connected}
          notifOpen={notifOpen}
          setNotifOpen={setNotifOpen}
          unreadCount={unreadCount}
          dbNotifications={dbNotifications}
          markAllRead={markAllRead}
          markRead={markRead}
        />

        {/* Page content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            padding: "14px 14px 8px",
          }}
        >
          {renderContent()}
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            padding: "0 0 12px",
            fontSize: 13,
            color: "#64748b",
            fontWeight: 500,
            flexShrink: 0,
          }}
        >
          © Copyright 2024 Next Day Nutra – All Rights Reserved.
        </div>
      </main>
    </div>
  );
}
