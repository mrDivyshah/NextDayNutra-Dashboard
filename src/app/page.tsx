"use client";

import React, { useState, useEffect, Suspense, useMemo, useCallback, useRef } from "react";
import {
  Users,
  Briefcase,
  LayoutDashboard,
  ClipboardList,
  ChevronRight,
  Search,
  Bell,
  Settings,
  ArrowUpDown,
  ArrowDown,
  ExternalLink,
  RefreshCw,
  ChevronDown,
  LogOut,
  Globe,
  Calendar,
  ChevronUp,
  Filter,
  Wifi,
  WifiOff,
  Circle,
  MessageSquare,
  Upload,
  Check,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Tag,
  Sparkles,
} from "lucide-react";
import AssetVault from "@/components/AssetVault";
import { OrderFilesPreview } from "@/components/dashboard/OrderFiles";
import { signOut } from "next-auth/react";
import { useNDNWebSocket, useNotifications, useOrderHighlights } from "@/hooks/useNDNWebSocket";
import type { WSEvent, WSNotification, ActiveUser } from "@/hooks/useNDNWebSocket";

// ─── Types ────────────────────────────────────────────────────────────────────
type LORRequest = {
  id: number; date: string; brandType: string; status: string;
  qtyOrdered: number; qtyDelivered: number; deliveryDate: string; labelSize: string;
  summary?: string; // Supporting Jira Issue Summary
};
type Order = {
  id: number; highlight: boolean; health: string; healthColor: string; icon: string;
  so: string; cmKey: string; product: string; customer: string; customerNew: number;
  status: string; qty: number; start: string; est: string; days: string; notes: string[];
  initialInv: number; deliveredInv: number; remainingInv: number; lorRequests: LORRequest[];
  agentName?: string; 
  commissionPaid?: number;
  commissionDue?: number;
  commissionBalanceOwed?: number;
  customerPaymentStatus?: string;
  customerPaymentStatusColor?: string;
};
type CustomerUser = { id: number; name: string; email: string; role: string };
type Customer = { id: number; name: string; users: CustomerUser[]; agent?: string; isAgent?: boolean };
type NavSection = "customers" | "agents" | "settings" | "internal" | "multi-location" | "executive";


// ─── Root export ──────────────────────────────────────────────────────────────
export default function V2DashboardPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Loading workspace...</div>}>
      <V2Dashboard />
    </Suspense>
  );
}

// ─── View Files helper ────────────────────────────────────────────────────────

function btnStyle(bg: string, color: string, hoverBg: string) {
  return {
    background: bg, color, border: `1px solid ${hoverBg}`,
    padding: "7px 13px", borderRadius: 8, fontWeight: 600, fontSize: 13,
    cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
  } as React.CSSProperties;
}

// ── Shared Helpers ──────────────────────────────────────────────────────────

function formatRelTime(iso: string): string {
  try {
    const d = new Date(iso);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString();
  } catch { return ""; }
}

function tdStyle(first: boolean, last: boolean): React.CSSProperties {
  return {
    padding: "13px 14px", fontSize: 13, color: "#334155",
    background: "inherit",
    borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9",
    ...(first ? { borderLeft: "1px solid #f1f5f9", borderTopLeftRadius: 10, borderBottomLeftRadius: 10 } : {}),
    ...(last ? { borderRight: "1px solid #f1f5f9", borderTopRightRadius: 10, borderBottomRightRadius: 10 } : {}),
  };
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
function V2Dashboard() {
  const [section, setSection] = useState<NavSection>("customers");
  const [expanded, setExpanded] = useState<string[]>(["dashboards-group"]);
  const [notifOpen, setNotifOpen] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [activeJiraCustomers, setActiveJiraCustomers] = useState<{name: string, agent: string, jiraId?: string}[]>([]);
  const [activeJiraAgents, setActiveJiraAgents] = useState<{name: string, jiraId: string}[]>([]);
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

  useEffect(() => {
    fetch("/api/auth/session")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.user) {
          setCurrentUser({ id: Number(data.user.id), name: data.user.name, role: data.user.role });
        }
      })
      .catch(console.error);
  }, []);

  // ── Order Highlights ─────────────────────────────────────────────────────────
  const { highlightedOrders, markHighlighted, markRead, isHighlighted } = useOrderHighlights([]);

  // ── Notifications ─────────────────────────────────────────────────────────────
  const { notifications: dbNotifications, unreadCount, addRealtimeNotification, markAllRead } = useNotifications(currentUser?.id || 0);

  // ── WebSocket ─────────────────────────────────────────────────────────────────
  const handleWSEvent = useCallback((event: WSEvent) => {
    // Add to notification list
    addRealtimeNotification(event);

    // Highlight the relevant order row
    if (event.type === "file_uploaded" || event.type === "comment_posted") {
      const orderId = event.payload.orderId as string;
      if (orderId) markHighlighted(orderId);
    }
  }, [addRealtimeNotification, markHighlighted]);

  const { connected, activeUsers } = useNDNWebSocket({
    userId: currentUser?.id || 0,
    name: currentUser?.name || "",
    role: currentUser?.role || "",
    onEvent: handleWSEvent,
    enabled: !!currentUser,
  });

  const requestSort = (key: keyof Order) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Derive viewMode from section
  const viewMode = section === "agents" ? "agent" : section === "internal" ? "internal" : "client";

  // Load Jira lists
  useEffect(() => {
    setIsLoadingJira(true);
    console.log('[Frontend] Fetching Jira customers and agents...');
    const cacheBuster = `&t=${Date.now()}`;
    Promise.all([
      fetch(`/api/jira/customers?type=customer${cacheBuster}`).then(r => r.json()),
      fetch(`/api/jira/customers?type=agent${cacheBuster}`).then(r => r.json()),
    ])
      .then(([customers, agents]) => {
        console.log('[Frontend] Received customer data:', customers);
        console.log('[Frontend] Received agent data:', agents);
        
        // Robustly handle non-array responses (e.g. error objects)
        const custs = Array.isArray(customers) ? customers : [];
        const agts = Array.isArray(agents) ? agents : [];
        
        if (custs.length > 0 || Array.isArray(customers)) {
           console.log(`[Frontend] Setting ${custs.length} active customers`);
           setActiveJiraCustomers(custs);
        } else {
           console.error('[Frontend] Customer data is not an array (defaulting to empty):', customers);
           setActiveJiraCustomers([]);
        }

        if (agts.length > 0 || Array.isArray(agents)) {
           console.log(`[Frontend] Setting ${agts.length} active agents`);
           setActiveJiraAgents(agts);
        } else {
           console.error('[Frontend] Agent data is not an array (defaulting to empty):', agents);
           setActiveJiraAgents([]);
        }
      })
      .catch((error) => {
        console.error('[Frontend] Error fetching Jira data:', error);
        setActiveJiraCustomers([]);
        setActiveJiraAgents([]);
      })
      .finally(() => setIsLoadingJira(false));
  }, []);

  const filteredUsersList = useMemo((): Customer[] => {
    if (viewMode === "agent") return activeJiraAgents.map((a, i) => ({ id: -(i + 1001), name: a.name, jiraId: a.jiraId, users: [], isAgent: true }));
    if (viewMode === "internal") return [];
    return activeJiraCustomers.map((item, i) => ({ id: -(i + 1), name: item.name, jiraId: item.jiraId, users: [], isAgent: false, agent: item.agent }));
  }, [activeJiraCustomers, activeJiraAgents, viewMode]);

  const selectedCustomer = useMemo(
    () => selectedCustomerId === null ? null : filteredUsersList.find(c => c.id === selectedCustomerId) ?? null,
    [selectedCustomerId, filteredUsersList]
  );

  // Load orders
  useEffect(() => {
    setIsLoadingOrders(true);
    let url = `/api/jira/orders?view=${viewMode}`;
    if (viewMode === "client" && selectedCustomer) url += `&customerName=${encodeURIComponent(selectedCustomer.name.trim())}`;
    else if (viewMode === "agent" && selectedCustomer) url += `&agentName=${encodeURIComponent(selectedCustomer.name.trim())}`;
    else if (viewMode === "client" || viewMode === "agent") url = `/api/jira/orders?view=internal`;
    
    url += (url.includes('?') ? '&' : '?') + `t=${Date.now()}`;
    
    fetch(url)
      .then(r => r.json())
      .then(d => { setActiveOrders(d.activeOrders || []); setCompletedOrders(d.completedOrders || []); })
      .catch(() => { setActiveOrders([]); setCompletedOrders([]); })
      .finally(() => setIsLoadingOrders(false));
  }, [selectedCustomer, viewMode]);

  const resolveCustomerId = (name: string) => {
    const n = name.trim().toLowerCase();
    const m = filteredUsersList.find(c => c.name.trim().toLowerCase() === n);
    return m?.users?.[0]?.id ?? m?.id ?? 0;
  };

  const toggleExpand = (key: string) =>
    setExpanded(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  const toggleRow = (id: number, orderId?: string) => {
    setExpandedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
    // Mark order as read when expanded
    if (orderId && !expandedRows.includes(id)) markRead(orderId);
  };

  // Stats
  const countOnTrack = activeOrders.filter(o => o.health.toLowerCase().includes("track") && !o.health.toLowerCase().includes("off")).length;
  const countOffTrack = activeOrders.filter(o => o.health.toLowerCase().includes("off track")).length;
  const countAtRisk = activeOrders.filter(o => o.health.toLowerCase().includes("risk")).length;
  const countWhiteLabel = activeOrders.filter(o => o.health.toLowerCase().includes("white label")).length;

  const healthBadge = (health: string) => {
    const l = health.toLowerCase();
    if (l.includes("track") && !l.includes("off")) return { bg: "#dcfce7", color: "#166534" };
    if (l.includes("off track")) return { bg: "#fee2e2", color: "#991b1b" };
    if (l.includes("risk") || l.includes("hold")) return { bg: "#ffedd5", color: "#9a3412" };
    if (l.includes("pending")) return { bg: "#e0f2fe", color: "#075985" };
    if (l.includes("white")) return { bg: "#ede9fe", color: "#5b21b6" };
    return { bg: "#f1f5f9", color: "#475569" };
  };

  // ── Sidebar nav data ─────────────────────────────────────────────────────────
  const navGroups = [
    {
      key: "dashboards-group", label: "Dashboards", icon: LayoutDashboard,
      items: [
        { key: "customers" as NavSection, label: "Customer Dashboard", icon: Users, badge: activeJiraCustomers.length },
        { key: "agents" as NavSection, label: "Agent Dashboard", icon: Briefcase, badge: activeJiraAgents.length },
        { key: "multi-location" as NavSection, label: "Multi location", icon: Globe },
        { key: "executive" as NavSection, label: "Executive", icon: Sparkles },
      ],
    },
    {
      key: "settings-group", label: "Config", icon: Settings,
      items: [
        { key: "settings" as NavSection, label: "Settings", icon: Settings },
      ],
    },
  ];

  // ── Renders ──────────────────────────────────────────────────────────────────
  const renderOrdersTable = (orders: Order[], tab: "active" | "completed" | "all") => {
    const headers: { label: string; key: keyof Order | "actions"; sortable?: boolean }[] = [
      { label: "Order Health", key: "health" },
      { label: "Sales Order #", key: "so" },
      { label: "CM Key", key: "cmKey" },
      { label: "Product Name", key: "product" },
      { label: "Customer", key: "customer" },
      { label: "Status", key: "status" },
      { label: "Quantity Ordered", key: "qty" },
      { label: "Start Date", key: "start" },
      { label: "EST Ship Date", key: "est" },
      { label: "Days in Production", key: "days" },
      { label: "Actions", key: "actions", sortable: false },
    ];
    const colSpan = headers.length;

    if (orders.length === 0) {
      return (
        <div style={{ position: "relative", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 6px", minWidth: 1050 }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#fff" }}>
              <tr>
                {headers.map((h) => (
                  <th key={h.key} style={{ 
                    padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", textAlign: "left", borderBottom: "1px solid #f1f5f9", 
                    background: "#fff", zIndex: 10, cursor: "default", userSelect: "none",
                  }}>
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={colSpan} style={{ padding: "60px 0", textAlign: "center", color: "#94a3b8", background: "#fff", borderRadius: 12 }}>
                  <ClipboardList size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                  <p style={{ fontSize: 15, fontWeight: 500 }}>No {tab} orders available.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    let sortedOrders = [...orders];
    if (sortConfig !== null) {
      sortedOrders.sort((a, b) => {
        let aVal: any = a[sortConfig.key as keyof Order];
        let bVal: any = b[sortConfig.key as keyof Order];

        if (sortConfig.key === "qty") {
          aVal = Number(aVal) || 0;
          bVal = Number(bVal) || 0;
        } else if (sortConfig.key === "days") {
          aVal = Number(String(aVal).replace(/\D/g, "")) || 0;
          bVal = Number(String(bVal).replace(/\D/g, "")) || 0;
        } else if (sortConfig.key === "start" || sortConfig.key === "est") {
          aVal = new Date(aVal as string).getTime() || 0;
          bVal = new Date(bVal as string).getTime() || 0;
        }

        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortConfig.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    // Sort highlighted orders to top (WhatsApp-style)
    const highlighted = sortedOrders.filter(o => isHighlighted((o.cmKey || o.so || "").toLowerCase()));
    const normal = sortedOrders.filter(o => !isHighlighted((o.cmKey || o.so || "").toLowerCase()));
    const finalOrders = [...highlighted, ...normal];

    return (
      <div style={{ position: "relative" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 6px", minWidth: 1050 }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#fff" }}>
            <tr>
               {headers.map((h) => (
                <th key={h.key} onClick={() => h.sortable !== false ? requestSort(h.key as keyof Order) : undefined}
                  style={{ 
                    padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", textAlign: "left", borderBottom: "1px solid #f1f5f9", 
                    whiteSpace: (h.key === "days" || h.key === "qty") ? "normal" : "nowrap", 
                    background: "#fff", zIndex: 10, cursor: h.sortable !== false ? "pointer" : "default", userSelect: "none",
                    width: h.key === "days" ? 110 : (h.key === "actions" ? 140 : (h.key === "cmKey" ? 100 : (h.key === "product" ? 220 : (h.key === "qty" ? 80 : "auto")))),
                    minWidth: h.key === "days" ? 110 : (h.key === "actions" ? 140 : (h.key === "cmKey" ? 100 : (h.key === "product" ? 220 : (h.key === "qty" ? 80 : "auto")))),
                  }}>
                  <div style={{ display: "flex", alignItems: (h.key === "days" || h.key === "qty") ? "flex-start" : "center", gap: 4, width: "100%" }}>
                    <span style={{ flexShrink: (h.key === "days" || h.key === "qty") ? 1 : 0 }}>{h.label}</span>
                    {h.sortable !== false && (
                      <span style={{ color: sortConfig?.key === h.key ? "#123e67" : "#cbd5e1", display: "flex", marginTop: (h.key === "days" || h.key === "qty") ? 2 : 0, flexShrink: 0 }}>
                        {sortConfig?.key === h.key ? (
                          sortConfig.direction === "asc" ? <ChevronUp size={12} strokeWidth={3} /> : <ArrowDown size={12} strokeWidth={3} />
                        ) : (
                          <ArrowUpDown size={12} />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {finalOrders.map(order => {
              const isExp = expandedRows.includes(order.id);
              const { bg, color } = healthBadge(order.health);
              const custId = resolveCustomerId(order.customer || "");
              const isCompleted = (order as Order & { _tab?: string })._tab === "completed";
              const orderKey = (order.cmKey || order.so || "").toLowerCase();
              const highlighted = isHighlighted(orderKey);
              return (
                <React.Fragment key={order.id}>
                  <tr className="order-row" style={{
                    background: highlighted ? "linear-gradient(90deg, #fff7ed 0%, #fffbf5 100%)" : "#fff",
                    borderRadius: 12,
                    boxShadow: highlighted ? "0 0 0 2px #f97316, 0 4px 16px -4px rgba(249,115,22,0.18)" : "none",
                    transition: "all 0.2s ease",
                    animation: highlighted ? "highlightPulse 2s ease-in-out" : "none",
                    cursor: "pointer"
                  }} onClick={() => toggleRow(order.id, orderKey)}>
                    <td style={tdStyle(true, false)}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {highlighted && (
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f97316", flexShrink: 0, boxShadow: "0 0 0 3px rgba(249,115,22,0.25)", animation: "pulse 1.5s infinite" }} />
                        )}
                        <span style={{ background: bg, color, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                          {order.health}
                        </span>
                      </div>
                    </td>
                    <td style={{ ...tdStyle(false, false), fontWeight: 700, color: "#0f172a" }}>{order.so}</td>
                     <td style={{ ...tdStyle(false, false), whiteSpace: "nowrap" }}>
                      {order.cmKey ? (
                        <a href={`https://nextdaynutra.atlassian.net/browse/${order.cmKey}`} target="_blank" rel="noopener noreferrer"
                          style={{ color: "#3b82f6", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                          {order.cmKey} <ExternalLink size={11} />
                        </a>
                      ) : "—"}
                    </td>
                     <td style={{ ...tdStyle(false, false), minWidth: 220, color: "#334155", lineHeight: "1.4" }}>{order.product}</td>
                    <td style={{ ...tdStyle(false, false), fontWeight: 600, color: "#334155", cursor: "pointer" }}
                      onClick={(e) => { e.stopPropagation(); const m = filteredUsersList.find(c => c.name === order.customer); if (m) setSelectedCustomerId(m.id); }}>
                      <span className="customer-name-link">{order.customer}</span>
                      {order.customerNew > 0 && (
                        <span style={{ marginLeft: 6, background: "#f97316", color: "#fff", fontSize: 10, padding: "2px 6px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 3 }}>
                          <MessageSquare size={9} /> {order.customerNew}
                        </span>
                      )}
                    </td>
                    <td style={tdStyle(false, false)}>{order.status}</td>
                    <td style={{ ...tdStyle(false, false), fontWeight: 600, width: 80 }}>{order.qty}</td>
                    <td style={{ ...tdStyle(false, false), whiteSpace: "nowrap", color: "#64748b" }}>{order.start}</td>
                    <td style={{ ...tdStyle(false, false), whiteSpace: "nowrap", color: "#64748b" }}>{order.est}</td>
                    <td style={{ ...tdStyle(false, false), fontWeight: 700, color: "#0f172a", width: 110 }}>{order.days}</td>
                    <td style={{ ...tdStyle(false, true), width: 140, minWidth: 140 }}>
                      <button onClick={(e) => { e.stopPropagation(); toggleRow(order.id, orderKey); }}
                        style={{ 
                          whiteSpace: "nowrap",
                          background: isExp ? "#f1f5f9" : (highlighted ? "#f97316" : "#0073aa"), 
                          color: isExp ? "#334155" : "#ffffff", 
                          border: "1px solid", 
                          borderColor: isExp ? "#cbd5e1" : (highlighted ? "#f97316" : "#0073aa"), 
                          padding: "6px 12px", 
                          borderRadius: 4, 
                          fontSize: 12, 
                          fontWeight: 500, 
                          cursor: "pointer", 
                          transition: "all 0.2s",
                          width: "100%",
                          textAlign: "center"
                        }}>
                        {isExp ? "Hide Details" : (highlighted ? "View New" : "Show Details")}
                      </button>
                    </td>
                  </tr>
                  {isExp && (
                    <tr>
                      <td colSpan={colSpan} style={{ padding: "0 0 8px" }}>
                        <div style={{ background: "#f8fafc", borderRadius: 12, margin: "0 2px", padding: 20, border: "1px solid #e2e8f0" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                            {/* Order Notes */}
                            <div style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e2e8f0" }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                                <LayoutDashboard size={14} color="#123e67" /> Order Notes
                              </div>
                              {order.notes.length > 0 ? (
                                <ul style={{ margin: 0, paddingLeft: 18, color: "#475569", fontSize: 13, lineHeight: 1.7 }}>
                                  {order.notes.map((n, i) => <li key={i}>{n}</li>)}
                                </ul>
                              ) : <p style={{ fontSize: 13, color: "#94a3b8", fontStyle: "italic", margin: 0 }}>No notes recorded.</p>}
                            </div>
                            {/* Inventory Details */}
                            <div style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e2e8f0" }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                                <Briefcase size={14} color="#123e67" /> Inventory Details
                              </div>
                              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                                {[["Initial Inventory", order.initialInv, "#0f172a"], ["Quantity Delivered", order.deliveredInv, "#16a34a"], ["Quantity Remaining", order.remainingInv, "#ea580c"]].map(([lbl, val, col]) => (
                                  <div key={String(lbl)} style={{ flex: 1, background: "#f8fafc", borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
                                    <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>{lbl}</div>
                                    <div style={{ fontSize: 20, fontWeight: 800, color: String(col) }}>{val}</div>
                                  </div>
                                ))}
                              </div>
                              <OrderFilesPreview 
                                orderId={(order.cmKey || order.so).toLowerCase()} 
                                hideEmptyState={isCompleted} 
                                uploadButton={
                                  !isCompleted && (
                                    <AssetVault 
                                      orderId={(order.cmKey || order.so).toLowerCase()} 
                                      customerId={Math.abs(custId) || 999} 
                                      isAdmin 
                                      mode="button" 
                                    />
                                  )
                                }
                              />
                            </div>
                          </div>

                          {/* LOR Requests table */}
                          {order.lorRequests && order.lorRequests.length > 0 && (
                            <div style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e2e8f0" }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                                <ClipboardList size={14} color="#123e67" /> LOR Requests
                              </div>
                              <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                                  <thead>
                                    <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
                                      {["Type", "Summary", "Design Order Date", "Brand Type", "Status", "Quantity Ordered", "Quantity Delivered", "Design Delivery Date", "Label Size"].map(h => (
                                        <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {order.lorRequests.map((lor, li) => {
                                      const isLabel = lor.brandType?.toLowerCase().includes("label") || lor.summary?.toLowerCase().includes("label");
                                      
                                      return (
                                        <tr key={li} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                          <td style={{ padding: "8px 10px", textAlign: "center", verticalAlign: "middle" }}>
                                            {isLabel ? (
                                              /* Jira Design/Vector icon */
                                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
                                                <path d="m12 19 7-7 3 3-7 7-3-3Z" />
                                                <path d="m18 13-1.5-7.5L4 2l3.5 12.5L13 18l5-5Z" />
                                                <path d="m2 22 5-5" />
                                                <path d="M12 11h.01" />
                                              </svg>
                                            ) : (
                                              /* Jira Subtask node icon */
                                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
                                                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                                                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                                                <path d="M10 17.5h4v-11" />
                                              </svg>
                                            )}
                                          </td>

                                          <td style={{ padding: "8px 10px", color: "#334155", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={lor.summary || lor.brandType}>
                                            {lor.summary || lor.brandType || "—"}
                                          </td>

                                          <td style={{ padding: "8px 10px", color: "#64748b", whiteSpace: "nowrap" }}>{lor.date || "—"}</td>

                                          <td style={{ padding: "8px 10px", color: "#64748b" }}>{lor.brandType || "—"}</td>

                                          <td style={{ padding: "8px 10px" }}>
                                            <span style={{ color: "#123e67", fontWeight: 600, textDecoration: "underline", cursor: "pointer" }}>{lor.status}</span>
                                          </td>

                                          <td style={{ padding: "8px 10px", fontWeight: 600, color: "#0f172a", textAlign: "center" }}>{lor.qtyOrdered}</td>

                                          <td style={{ padding: "8px 10px", fontWeight: 600, color: "#16a34a", textAlign: "center" }}>{lor.qtyDelivered}</td>

                                          <td style={{ padding: "8px 10px", color: "#64748b", whiteSpace: "nowrap" }}>{lor.deliveryDate || "—"}</td>

                                          <td style={{ padding: "8px 10px", color: "#64748b" }}>{lor.labelSize || "—"}</td>
                                        </tr>
                                      )
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Combined orders list for customer/agent view — active tagged with _tab
  const allOrdersCombined = useMemo(() => [
    ...activeOrders.map(o => ({ ...o, _tab: "active" } as Order & { _tab: string })),
    ...completedOrders.map(o => ({ ...o, _tab: "completed" } as Order & { _tab: string })),
  ], [activeOrders, completedOrders]);

  const renderContent = () => {
    switch (section) {
      case "customers":
        return <CustomerOrdersView
          viewMode="client"
          filteredUsersList={filteredUsersList}
          selectedCustomerId={selectedCustomerId}
          setSelectedCustomerId={setSelectedCustomerId}
          selectedCustomer={selectedCustomer}
          isLoadingJira={isLoadingJira}
          isLoadingOrders={isLoadingOrders}
          allOrders={allOrdersCombined}
          renderOrdersTable={renderOrdersTable}
        />;
      case "agents":
        return <AgentHierarchyView 
          allOrders={allOrdersCombined}
          allAgents={activeJiraAgents}
          allAssignments={activeJiraCustomers}
          isLoading={isLoadingOrders}
          renderOrdersTable={renderOrdersTable}
        />;
      case "settings":
        return <SettingsSection />;
      case "multi-location":
        return (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", height: "calc(100vh - 120px)", overflow: "hidden" }}>
             <iframe 
               src="https://hotworks.nextdaynutra.com" 
               style={{ width: "100%", height: "100%", border: "none" }}
               title="Multi-location Dashboard"
             />
          </div>
        );
      case "executive":
        return (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", height: "calc(100vh - 120px)", overflow: "hidden" }}>
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

  const activeLabel = navGroups.flatMap(g => g.items).find(i => i.key === section)?.label ?? "";

  return (
    <div style={{ display: "flex", height: "calc(100vh - 0px)", gap: 0, padding: "0 0 0 0", background: "transparent" }}>
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

      {/* ─── Sidebar ─────────────────────────────────────────────────── */}
      <aside style={{
        width: sidebarCollapsed ? 64 : 240,
        flexShrink: 0,
        background: "#123e67",
        borderRight: "none",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.25s ease",
        overflow: "hidden",
        boxShadow: "4px 0 24px -8px rgba(0,0,0,0.25)",
      }}>
        {/* Sidebar header (Branding) */}
        <div style={{ padding: "20px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.12)", background: "#fff" }}>
          {!sidebarCollapsed ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src="/next_day_nutra.png" alt="NDN Logo" style={{ width: 140, objectFit: "contain" }} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling && (e.currentTarget.nextElementSibling as HTMLElement).style.removeProperty('display'); }} />
            </div>
          ) : (
             <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
                <span style={{ fontWeight: 800, fontSize: 16, color: "#123e67" }}>NDN</span>
             </div>
          )}
          <button onClick={() => setSidebarCollapsed(p => !p)}
            style={{ marginLeft: "auto", background: "rgba(0, 0, 0,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", flexShrink: 0 }}>
            <ChevronRight size={14} style={{ transform: sidebarCollapsed ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.25s", color: "#000" }} />
          </button>
        </div>

        {/* Nav groups */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "12px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
          {navGroups.map(group => {
            const isGroupExp = expanded.includes(group.key);
            const GroupIcon = group.icon;
            return (
              <div key={group.key}>
                {!sidebarCollapsed && (
                  <button onClick={() => toggleExpand(group.key)}
                    style={{ width: "100%", background: "none", border: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", cursor: "pointer", borderRadius: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 6 }}>
                      <GroupIcon size={11} /> {group.label}
                    </span>
                    {isGroupExp ? <ChevronDown size={12} color="rgba(255,255,255,0.5)" /> : <ChevronRight size={12} color="rgba(255,255,255,0.5)" />}
                  </button>
                )}
                {(isGroupExp || sidebarCollapsed) && group.items.map(item => {
                  const Icon = item.icon;
                  const isActive = section === item.key;
                  return (
                    <button key={item.key} onClick={() => setSection(item.key)}
                      title={sidebarCollapsed ? item.label : undefined}
                      style={{
                        width: "100%", border: "none", cursor: "pointer", borderRadius: 10,
                        padding: sidebarCollapsed ? "9px 0" : "9px 12px",
                        display: "flex", alignItems: "center", gap: 10,
                        justifyContent: sidebarCollapsed ? "center" : "flex-start",
                        background: isActive ? "#f05323" : "transparent",
                        color: isActive ? "#ffffff" : "rgba(255,255,255,0.75)",
                        fontWeight: isActive ? 700 : 500,
                        fontSize: 13,
                        transition: "all 0.15s",
                        marginBottom: 1,
                      }}
                      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)"; }}
                      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                    >
                      <Icon size={15} style={{ flexShrink: 0 }} />
                      {!sidebarCollapsed && (
                        <>
                          <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
                          {"badge" in item && item.badge !== undefined && item.badge > 0 && (
                            <span style={{ background: isActive ? "#fff" : "rgba(255,255,255,0.2)", color: isActive ? "#f05323" : "rgba(255,255,255,0.7)", fontSize: 10, padding: "1px 7px", borderRadius: 10, fontWeight: 700 }}>
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
              <div style={{ padding: "6px 16px", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
                Next Day Nutra
              </div>
            )}
            <a href="https://ndnfulfillment.com/" target="_blank" rel="noopener noreferrer"
              title={sidebarCollapsed ? "NDN Fulfillment" : undefined}
              style={{
                width: "100%", border: "none", cursor: "pointer", borderRadius: 10,
                padding: sidebarCollapsed ? "9px 0" : "9px 12px",
                display: "flex", alignItems: "center", gap: 10,
                justifyContent: sidebarCollapsed ? "center" : "flex-start",
                background: "transparent",
                color: "rgba(255,255,255,0.75)",
                fontWeight: 500,
                fontSize: 13,
                textDecoration: "none",
                transition: "all 0.15s",
                marginBottom: 2,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <Globe size={15} style={{ flexShrink: 0 }} />
              {!sidebarCollapsed && <span style={{ flex: 1 }}>NDN Fulfillment</span>}
            </a>
            
            <a href="https://dashboard.nextdaynutra.com/book-an-appointment" target="_blank" rel="noopener noreferrer"
              title={sidebarCollapsed ? "Contact Sales" : undefined}
              style={{
                width: "100%", border: "none", cursor: "pointer", borderRadius: 10,
                padding: sidebarCollapsed ? "9px 0" : "9px 12px",
                display: "flex", alignItems: "center", gap: 10,
                justifyContent: sidebarCollapsed ? "center" : "flex-start",
                background: "transparent",
                color: "rgba(255,255,255,0.75)",
                fontWeight: 500,
                fontSize: 13,
                textDecoration: "none",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <Calendar size={15} style={{ flexShrink: 0 }} />
              {!sidebarCollapsed && <span style={{ flex: 1 }}>Contact Sales</span>}
            </a>
          </div>
        </nav>

        {/* ── Active Users Panel (admin only) ─────────────────────── */}
        {!sidebarCollapsed && currentUser && (currentUser.role === "super_admin" || currentUser.role === "admin") && (
          <div style={{ margin: "0 8px 4px", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
            <button onClick={() => setActiveUsersOpen(p => !p)}
              style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", cursor: "pointer", color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 700 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Circle size={8} fill="#22c55e" color="#22c55e" style={{ animation: "pulse 2s infinite" }} />
                <span>Active Users</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ background: "rgba(34,197,94,0.2)", color: "#4ade80", fontSize: 10, padding: "1px 7px", borderRadius: 8, fontWeight: 800 }}>{activeUsers.length}</span>
                {activeUsersOpen ? <ChevronUp size={12} color="rgba(255,255,255,0.5)" /> : <ChevronDown size={12} color="rgba(255,255,255,0.5)" />}
              </div>
            </button>
            {activeUsersOpen && (
              <div style={{ maxHeight: 180, overflowY: "auto", background: "rgba(0,0,0,0.1)" }}>
                {activeUsers.length === 0 ? (
                  <div style={{ padding: "12px", fontSize: 11, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>No other users online</div>
                ) : activeUsers.map((u, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#f05323", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                      {u.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.9)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "capitalize" }}>{u.role.replace("_", " ")}</div>
                    </div>
                    <Circle size={7} fill="#22c55e" color="#22c55e" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sidebar footer (User profile & Sign Out) */}
        <div style={{ padding: sidebarCollapsed ? "16px 8px" : "16px", borderTop: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.15)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: sidebarCollapsed ? 0 : 16, justifyContent: sidebarCollapsed ? "center" : "flex-start" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#f05323", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
              {currentUser?.name ? currentUser.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) : "U"}
            </div>
            {!sidebarCollapsed && (
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {currentUser?.name || "Loading..."}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textTransform: "capitalize" }}>
                  {currentUser?.role?.replace("_", " ") || "User"}
                </div>
              </div>
            )}
          </div>
          
          {!sidebarCollapsed && (
              <button 
                onClick={() => { signOut(); }}
                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "9px 12px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 600, transition: "background 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(ef,68,68,0.2)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
              >
              <LogOut size={14} /> Sign Out
            </button>
          )}
        </div>
      </aside>

      {/* ─── Main content ─────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "rgba(255,255,255,0.88)", backdropFilter: "blur(20px)" }}>
        {/* Top bar */}
        <header style={{ padding: "18px 28px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>
              {navGroups.find(g => g.items.some(i => i.key === section))?.label}
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>{activeLabel}</h1>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Quick search…"
                style={{ paddingLeft: 36, height: 38, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, color: "#334155", outline: "none", width: 180 }} />
            </div>
            {/* WS Connection indicator */}
            <div title={connected ? "Live — real-time updates active" : "Connecting…"} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: connected ? "#dcfce7" : "#fef3c7", borderRadius: 20, border: `1px solid ${connected ? "#86efac" : "#fcd34d"}` }}>
              {connected
                ? <Wifi size={12} color="#16a34a" />
                : <WifiOff size={12} color="#d97706" />}
              <span style={{ fontSize: 11, fontWeight: 700, color: connected ? "#16a34a" : "#d97706" }}>{connected ? "Live" : "Connecting"}</span>
            </div>

            {/* Notification bell */}
            <div style={{ position: "relative" }}>
              <button onClick={() => { setNotifOpen(p => !p); }}
                style={{ width: 38, height: 38, background: notifOpen ? "#fef0ec" : "#f8fafc", border: `1px solid ${notifOpen ? "#f8c4b4" : "#e2e8f0"}`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}>
                <Bell size={16} color={notifOpen ? "#f05323" : "#64748b"} />
                {unreadCount > 0 && (
                  <span style={{ position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, background: "#f05323", borderRadius: 9, border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff", padding: "0 4px" }}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setNotifOpen(false)} />
                  <div style={{ position: "absolute", right: 0, top: 46, width: 360, background: "#fff", borderRadius: 16, boxShadow: "0 20px 60px -10px rgba(15,23,42,0.18)", border: "1px solid #e2e8f0", zIndex: 100, overflow: "hidden" }}>
                    <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 800, fontSize: 14, color: "#0f172a" }}>Notifications</span>
                        {unreadCount > 0 && <span style={{ background: "#f05323", color: "#fff", fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>{unreadCount} new</span>}
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {unreadCount > 0 && (
                          <button onClick={() => markAllRead()} style={{ fontSize: 11, fontWeight: 600, color: "#64748b", background: "#f1f5f9", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                            <Check size={10} /> Mark all read
                          </button>
                        )}
                        <button onClick={() => setNotifOpen(false)} style={{ background: "none", border: "none", display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: 6, color: "#94a3b8", cursor: "pointer", fontSize: 16 }}>
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                    <div style={{ maxHeight: 380, overflowY: "auto" }}>
                      {dbNotifications.length === 0 ? (
                        <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8" }}>
                          <Bell size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
                          <p style={{ margin: 0, fontSize: 13 }}>No notifications yet</p>
                        </div>
                      ) : dbNotifications.map((n, i) => (
                        <div key={i} style={{ padding: "12px 18px", borderBottom: "1px solid #f8fafc", display: "flex", gap: 12, alignItems: "flex-start", background: !n.isRead ? "#fff7f0" : "#fff", cursor: "pointer", transition: "background 0.2s" }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#f8fafc"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = !n.isRead ? "#fff7f0" : "#fff"}
                          onClick={() => { if (n.orderId) { markRead(n.orderId); setNotifOpen(false); } }}>
                          <div style={{ width: 36, height: 36, borderRadius: "50%", background: n.type === "comment" ? "#eff6ff" : "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {n.type === "comment" ? <MessageSquare size={16} color="#3b82f6" /> : <Upload size={16} color="#f97316" />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 2 }}>{n.title}</div>
                            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.message}</div>
                            <div style={{ fontSize: 11, color: "#94a3b8", display: "flex", gap: 8, alignItems: "center" }}>
                              {n.fromName && <span>{n.fromName}</span>}
                              <span>{formatRelTime(n.createdAt)}</span>
                            </div>
                          </div>
                          {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f05323", flexShrink: 0, marginTop: 6 }} />}
                        </div>
                      ))}
                    </div>
                    <div style={{ padding: "10px 18px", borderTop: "1px solid #f1f5f9", textAlign: "center" }}>
                      <button onClick={() => markAllRead()} style={{ fontSize: 12, fontWeight: 600, color: "#f05323", background: "none", border: "none", cursor: "pointer" }}>Mark all as read</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "14px 14px 8px" }}>
          {renderContent()}
        </div>
        
        {/* Footer */}
        <div style={{ textAlign: "center", padding: "0 0 12px", fontSize: 13, color: "#64748b", fontWeight: 500, flexShrink: 0 }}>
          © Copyright 2024 Next Day Nutra – All Rights Reserved.
        </div>
      </main>
    </div>
  );
}

// ─── Date Range Picker Component ───────────────────────────────────────────
function DateRangePicker({ startDate, endDate, setStartDate, setEndDate }: { 
  startDate: string; endDate: string; 
  setStartDate: (d: string) => void; setEndDate: (d: string) => void; 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handleDateClick = (d: number, m: number, y: number) => {
    const formatted = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (!startDate || (startDate && endDate)) {
      setStartDate(formatted);
      setEndDate("");
    } else {
      const start = new Date(startDate);
      const clicked = new Date(formatted);
      if (clicked < start) {
        setStartDate(formatted);
        setEndDate(startDate);
      } else {
        setEndDate(formatted);
        setIsOpen(false);
      }
    }
  };

  const renderCalendar = (offset: number) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
    const days = daysInMonth(d);
    const start = firstDayOfMonth(d);
    const monthName = d.toLocaleString('default', { month: 'long' });
    const year = d.getFullYear();

    const cells = [];
    for (let i = 0; i < start; i++) cells.push(<div key={`blank-${i}`} />);
    for (let day = 1; day <= days; day++) {
      const dateStr = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isStart = startDate === dateStr;
      const isEnd = endDate === dateStr;
      const inRange = startDate && endDate && dateStr > startDate && dateStr < endDate;

      cells.push(
        <div key={day} onClick={() => handleDateClick(day, d.getMonth(), year)}
          style={{
            height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: (isStart || isEnd) ? 700 : 500,
            background: (isStart || isEnd) ? "#123e67" : inRange ? "#e8eff6" : "transparent",
            color: (isStart || isEnd) ? "#fff" : inRange ? "#123e67" : "#334155"
          }}
          onMouseEnter={e => { if(!isStart && !isEnd && !inRange) (e.currentTarget as HTMLElement).style.background = "#f1f5f9"; }}
          onMouseLeave={e => { if(!isStart && !isEnd && !inRange) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          {day}
        </div>
      );
    }
    return (
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#123e67", marginBottom: 12, textAlign: "center" }}>{monthName} {year}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(w => <div key={w} style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textAlign: "center", paddingBottom: 6 }}>{w}</div>)}
          {cells}
        </div>
      </div>
    );
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginLeft: 4 }}>Start Date</label>
          <div onClick={() => setIsOpen(true)} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, height: 34, width: 130, padding: "0 10px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", fontSize: 12, color: "#334155" }}>
            {startDate || "dd-mm-yyyy"}
            <Calendar size={14} color="#94a3b8" />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginLeft: 4 }}>End Date</label>
          <div onClick={() => setIsOpen(true)} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, height: 34, width: 130, padding: "0 10px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", fontSize: 12, color: "#334155" }}>
            {endDate || "dd-mm-yyyy"}
            <Calendar size={14} color="#94a3b8" />
          </div>
        </div>
      </div>

      {isOpen && (
        <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 10, background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 20px 50px -10px rgba(0,0,0,0.15)", zIndex: 100, padding: 24, width: 500 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><ChevronRight size={18} style={{ transform: "rotate(180deg)" }} /></button>
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><ChevronRight size={18} /></button>
          </div>
          <div style={{ display: "flex", gap: 32 }}>
            {renderCalendar(0)}
            {renderCalendar(1)}
          </div>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => setIsOpen(false)} style={{ background: "#123e67", color: "#fff", border: "none", padding: "8px 20px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
function AgentHierarchyView({ allOrders, allAgents, allAssignments, isLoading, renderOrdersTable }: { 
  allOrders: (Order & { _tab: string })[], 
  allAgents: { name: string; jiraId: string }[], 
  allAssignments: { name: string, agent: string, jiraId?: string }[],
  isLoading: boolean,
  renderOrdersTable: (orders: Order[], tab: "active" | "completed" | "all") => React.ReactNode
}) {
  const [expandedAgents, setExpandedAgents] = useState<string[]>([]);
  const [expandedCustomers, setExpandedCustomers] = useState<string[]>([]);
  
  // New Filters
  const [agentFilter, setAgentFilter] = useState("All Agents");
  const [customerSearch, setCustomerSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("All Payments");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const grouped = useMemo(() => {
    const map: Record<string, Record<string, (Order & { _tab: string })[]>> = {};
    
    // Sort and filter agents based on global filter
    const targetAgents = agentFilter === "All Agents" ? allAgents : allAgents.filter(a => a.name === agentFilter);
    targetAgents.forEach(agentObj => {
      const agent = agentObj.name;
      if (agent !== "Unassigned") {
        map[agent] = {};
        allAssignments.forEach(asm => {
          if (asm.agent === agent) {
            if (!customerSearch || asm.name.toLowerCase().includes(customerSearch.toLowerCase())) {
              map[agent][asm.name] = [];
            }
          }
        });
      }
    });

    allOrders.forEach(order => {
      const agent = order.agentName || "Unassigned";
      if (agent === "Unassigned") return;
      if (agentFilter !== "All Agents" && agent !== agentFilter) return;

      const customer = order.customer || "Unknown Customer";
      // Customer name filter
      if (customerSearch && !customer.toLowerCase().includes(customerSearch.toLowerCase())) return;

      // Payment Status filter (mapping logic from orders)
      if (paymentStatus !== "All Payments") {
        const isPaid = order.customerPaymentStatus === "Paid In Full";
        const isPending = order.customerPaymentStatus === "Deposit Paid" || order.customerPaymentStatus === "UnPaid";
        if (paymentStatus === "Paid" && !isPaid) return;
        if (paymentStatus === "Pending" && !isPending) return;
      }

      // Date Range filter (using order start date)
      if (startDate || endDate) {
        const orderDate = order.start ? new Date(order.start) : null;
        if (orderDate) {
          if (startDate && orderDate < new Date(startDate)) return;
          if (endDate && orderDate > new Date(endDate)) return;
        } else if (startDate || endDate) {
          return; // Skip if no date but filter active
        }
      }

      if (!map[agent]) map[agent] = {};
      if (!map[agent][customer]) map[agent][customer] = [];
      map[agent][customer].push(order);
    });

    // Only clean up agents that have NO assigned customers AND NO orders
    Object.keys(map).forEach(agent => {
      if (Object.keys(map[agent]).length === 0) delete map[agent];
    });

    return map;
  }, [allOrders, allAgents, allAssignments, agentFilter, customerSearch, paymentStatus, startDate, endDate]);

  const toggleAgent = (name: string) => 
    setExpandedAgents(prev => prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]);
  
  const toggleCustomer = (name: string) =>
    setExpandedCustomers(prev => prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]);

  if (isLoading && allOrders.length === 0) return <LoadingSpinner />;

  const selStyle = {
    height: 34, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8,
    fontSize: 12, color: "#334155", outline: "none", padding: "0 10px", cursor: "pointer",
  } as React.CSSProperties;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      
      {/* ── Filter Bar ── */}
      <div style={{ background: "#fff", padding: "12px 20px", borderRadius: 12, border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
        
        {/* Agent Select */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginLeft: 4 }}>Agent</label>
          <select value={agentFilter} onChange={e => setAgentFilter(e.target.value)} style={{ ...selStyle, width: 180 }}>
            <option value="All Agents">All Agents</option>
            {allAgents.filter(a => a.name !== "Unassigned").sort((a,b) => a.name.localeCompare(b.name)).map(a => <option key={a.jiraId} value={a.name}>{a.name}</option>)}
          </select>
        </div>

        {/* Customer Search */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginLeft: 4 }}>Customer</label>
          <div style={{ position: "relative" }}>
            <Search size={12} color="#94a3b8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
            <input value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} placeholder="Search customer…"
              style={{ ...selStyle, paddingLeft: 30, width: 200 }} />
          </div>
        </div>

        {/* Payment Filter */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginLeft: 4 }}>Payment Status</label>
          <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} style={{ ...selStyle, width: 140 }}>
            <option value="All Payments">All Payments</option>
            <option value="Paid">Paid Only</option>
            <option value="Pending">Pending / Deposit</option>
          </select>
        </div>

        {/* Date Range */}
        <DateRangePicker startDate={startDate} endDate={endDate} setStartDate={setStartDate} setEndDate={setEndDate} />

        {/* Reset */}
        {(agentFilter !== "All Agents" || customerSearch || paymentStatus !== "All Payments" || startDate || endDate) && (
          <button onClick={() => { setAgentFilter("All Agents"); setCustomerSearch(""); setPaymentStatus("All Payments"); setStartDate(""); setEndDate(""); }}
            style={{ marginTop: 18, background: "none", border: "none", color: "#f05323", fontSize: 11, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>
            Reset Filters
          </button>
        )}
      </div>

      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", minHeight: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 11, background: "#f8fafc" }}>
          <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
            <th style={{ padding: "14px 24px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" }}>Agent / Customer</th>
            <th style={{ padding: "14px 24px", textAlign: "right", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", width: 120 }}>Paid</th>
            <th style={{ padding: "14px 24px", textAlign: "right", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", width: 150 }}>Due / Pending</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(grouped)
            .filter(([name, customers]) => name !== "Unassigned" && Object.keys(customers).length > 0)
            .sort(([a],[b]) => a.localeCompare(b))
            .map(([agentName, customers]) => {
              const isExp = expandedAgents.includes(agentName);
              const customerList = Object.entries(customers);
              const totalPaid = allOrders.filter(o => o.agentName === agentName).reduce((acc, o) => acc + (o.commissionPaid || 0), 0);
              const totalDue = allOrders.filter(o => o.agentName === agentName).reduce((acc, o) => acc + (o.commissionDue || 0), 0);

              return (
                <React.Fragment key={agentName}>
                  {/* Agent Header Row */}
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "14px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: "#123e67" }}>{agentName}</span>
                        <span style={{ fontSize: 11, color: "#64748b", background: "#e8eff6", padding: "2px 10px", borderRadius: 12, fontWeight: 700 }}>{customerList.length} Customers</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 24px", textAlign: "right", fontSize: 14, fontWeight: 800, color: "#16a34a" }}>
                      ${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: "14px 24px", textAlign: "right", fontSize: 14, fontWeight: 800, color: "#f97316" }}>
                      ${totalDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  {/* Customer Rows - Always Visible for Agents */}
                  {customerList.map(([custName, orders]) => {
                    const custKey = `${agentName}-${custName}`;
                    const isCustExp = expandedCustomers.includes(custKey);
                    const custPaid = orders.reduce((acc, o) => acc + (o.commissionPaid || 0), 0);
                    const custDue = orders.reduce((acc, o) => acc + (o.commissionDue || 0), 0);

                    return (
                      <React.Fragment key={custName}>
                        <tr onClick={() => toggleCustomer(custKey)} style={{ background: isCustExp ? "#f8fafc" : "#fff", cursor: "pointer", borderBottom: "1px solid #f8fafc" }}>
                          <td style={{ padding: "12px 24px 12px 48px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ color: "#123e67", transition: "transform 0.2s", transform: isCustExp ? "rotate(90deg)" : "none" }}>
                                <ChevronRight size={14} />
                              </div>
                              <span style={{ fontWeight: 600, color: "#334155", fontSize: 13 }}>{custName}</span>
                              <span style={{ fontSize: 11, color: "#94a3b8" }}>({orders.length} Orders)</span>
                            </div>
                          </td>
                          <td style={{ padding: "12px 24px", textAlign: "right", fontSize: 13, color: "#16a34a", fontWeight: 600 }}>
                            ${custPaid.toLocaleString()}
                          </td>
                          <td style={{ padding: "12px 24px", textAlign: "right", fontSize: 13, color: "#f97316", fontWeight: 600 }}>
                            ${custDue.toLocaleString()}
                          </td>
                        </tr>
                        {isCustExp && (
                          <tr style={{ background: "#fff" }}>
                            <td colSpan={3} style={{ padding: "8px 24px 20px 48px" }}>
                              <div style={{ display: "flex", background: "#8fa3c0", borderRadius: 12, padding: "16px 0", marginBottom: 12, alignItems: "center", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                                <div style={{ flex: 1, textAlign: "center", borderRight: "1px solid rgba(255,255,255,0.3)" }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Total Orders</div>
                                  <div style={{ fontSize: 20, fontWeight: 800, color: "#123e67" }}>{orders.length}</div>
                                </div>
                                <div style={{ flex: 1, textAlign: "center", borderRight: "1px solid rgba(255,255,255,0.3)" }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Total Paid</div>
                                  <div style={{ fontSize: 20, fontWeight: 800, color: "#123e67" }}>${custPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                </div>
                                <div style={{ flex: 1, textAlign: "center", borderRight: "1px solid rgba(255,255,255,0.3)" }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Total Amount Pending</div>
                                  <div style={{ fontSize: 20, fontWeight: 800, color: "#123e67" }}>${custDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                </div>
                                <div style={{ flex: 1, textAlign: "center" }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Total Balance Pending</div>
                                  <div style={{ fontSize: 20, fontWeight: 800, color: "#123e67" }}>
                                    ${orders.reduce((acc, o) => acc + (o.commissionBalanceOwed || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </div>
                                </div>
                              </div>
                              <div style={{ border: "1px solid #f1f5f9", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                                {renderOrdersTable(orders, "all")}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              );
            })}
        </tbody>
      </table>
    </div>
  </div>
  );
}

// ─── Customer / Agent Orders View ────────────────────────────────────────────
const WORKFLOW_STATUSES = [
  "1 - Ready to Start Order", "2 - In Sourcing", "3 - Ordering Raw Materials",
  "4 - All Raw Materials Ordered", "5 - All Raw Materials Received",
  "6 - Raw Materials Testing Complete", "7 - In Manufacturing",
  "8 - Manufacturing Complete", "9 - Bulk Product Testing",
  "10 - Awaiting Packaging", "11 - In Packaging", "12 - Finished Goods Testing",
  "Partial Shipment", "Final Product Shipped", "Cancelled", "On Hold",
];
const ORDER_HEALTHS = ["On Track", "Off Track", "At Risk", "White Label Order", "On Hold", "Pending Deposit"];

function CustomerOrdersView({ viewMode, filteredUsersList, selectedCustomerId, setSelectedCustomerId, selectedCustomer, isLoadingJira, isLoadingOrders, allOrders, renderOrdersTable }: {
  viewMode: "client" | "agent";
  filteredUsersList: Customer[];
  selectedCustomerId: number | null;
  setSelectedCustomerId: (id: number | null) => void;
  selectedCustomer: Customer | null;
  isLoadingJira: boolean;
  isLoadingOrders: boolean;
  allOrders: (Order & { _tab: string })[];
  renderOrdersTable: (orders: Order[], tab: "active" | "completed" | "all") => React.ReactNode;
}) {
  const [search, setSearch] = useState("");
  const [soSearch, setSoSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [workflowFilter, setWorkflowFilter] = useState("");
  const [healthFilter, setHealthFilter] = useState("");
  const [tabFilter, setTabFilter] = useState<"all" | "active" | "completed">("all");
  const [custOpen, setCustOpen] = useState(false);
  const label = viewMode === "agent" ? "Agent" : "Customer";
  const list = filteredUsersList.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  // Filter orders
  const displayOrders = useMemo(() => {
    let orders = selectedCustomer
      ? allOrders.filter(o => o.customer?.trim().toLowerCase() === selectedCustomer.name.trim().toLowerCase())
      : allOrders;
    if (tabFilter !== "all") orders = orders.filter(o => o._tab === tabFilter);
    if (soSearch) orders = orders.filter(o => o.so?.toLowerCase().includes(soSearch.toLowerCase()));
    if (productSearch) orders = orders.filter(o => o.product?.toLowerCase().includes(productSearch.toLowerCase()));
    if (workflowFilter) orders = orders.filter(o => o.status?.toLowerCase().includes(workflowFilter.toLowerCase()));
    if (healthFilter) orders = orders.filter(o => o.health?.toLowerCase().includes(healthFilter.toLowerCase()));
    return orders;
  }, [allOrders, selectedCustomer, tabFilter, soSearch, productSearch, workflowFilter, healthFilter]);

  const activeCount = allOrders.filter(o =>
    o._tab === "active" && (!selectedCustomer || o.customer?.trim().toLowerCase() === selectedCustomer.name.trim().toLowerCase())
  ).length;
  const completedCount = allOrders.filter(o =>
    o._tab === "completed" && (!selectedCustomer || o.customer?.trim().toLowerCase() === selectedCustomer.name.trim().toLowerCase())
  ).length;

  const hasFilters = soSearch || productSearch || workflowFilter || healthFilter;
  const clearFilters = () => { setSoSearch(""); setProductSearch(""); setWorkflowFilter(""); setHealthFilter(""); };

  const selStyle = {
    height: 34, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8,
    fontSize: 12, color: "#334155", outline: "none", padding: "0 10px", cursor: "pointer",
  } as React.CSSProperties;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* ── Orders table panel ── */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", minHeight: 0 }}>

        {/* Panel header row */}
        <div style={{ padding: "14px 20px 0", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                {selectedCustomer ? selectedCustomer.name : `All ${label}s`}
              </div>
            </div>
            {/* Quick action links */}
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              {[
                { label: "+ Create a New Customer", href: "https://dashboard.nextdaynutra.com/user-create-form" },
                { label: "+ Create an Order", href: "https://nextdaynutra.atlassian.net/jira/software/c/projects/CM/form/4" },
                { label: "+ Create a Lead in Brevo", href: "https://dashboard.nextdaynutra.com/manual-user-create-form" },
              ].map(link => (
                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12, fontWeight: 700, color: "#123e67", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#f05323"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#123e67"}
                >{link.label}</a>
              ))}
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ display: "flex", gap: 0, marginBottom: -1 }}>
            {([["all", "All Orders", activeCount + completedCount, null], ["active", "Active", activeCount, <Clock size={14} />], ["completed", "Completed", completedCount, <CheckCircle2 size={14} />]] as const).map(([key, label2, count, icon]) => (
              <button key={key} onClick={() => setTabFilter(key)}
                style={{ padding: "8px 18px", border: "none", background: "none", borderBottom: tabFilter === key ? "2px solid #123e67" : "2px solid transparent", color: tabFilter === key ? "#123e67" : "#64748b", fontWeight: tabFilter === key ? 700 : 500, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                {icon}
                {label2}
                <span style={{ background: tabFilter === key ? "#e8eff6" : "#f1f5f9", color: tabFilter === key ? "#0d2d4e" : "#64748b", fontSize: 10, padding: "1px 7px", borderRadius: 10, fontWeight: 700 }}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ padding: "12px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", background: "#fafafa" }}>
          
          {/* Customer Dropdown Component */}
          <div style={{ position: "relative" }}>
            <button onClick={() => setCustOpen(!custOpen)} style={{ ...selStyle, width: 170, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff" }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }}>
                {selectedCustomer ? selectedCustomer.name : `All ${label}s`}
              </span>
              <ChevronDown size={14} color="#94a3b8" style={{ transform: custOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
            </button>
            {custOpen && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setCustOpen(false)} />
                <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 4, width: 260, background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", zIndex: 50, overflow: "hidden" }}>
                  <div style={{ padding: "12px 14px", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{label}s</div>
                    <div style={{ position: "relative" }}>
                      <Search size={12} color="#94a3b8" style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)" }} />
                      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" autoFocus
                        style={{ width: "100%", paddingLeft: 28, height: 32, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#334155", outline: "none", boxSizing: "border-box" }} />
                    </div>
                  </div>
                  <button onClick={() => { setSelectedCustomerId(null); setCustOpen(false); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "9px 14px", background: selectedCustomerId === null ? "#f0f4f8" : "transparent", border: "none", borderBottom: "1px solid #f8fafc", cursor: "pointer", color: selectedCustomerId === null ? "#123e67" : "#334155" }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: selectedCustomerId === null ? "#e8eff6" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: selectedCustomerId === null ? "#123e67" : "#64748b", flexShrink: 0 }}>
                      <Sparkles size={14} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, flex: 1, textAlign: "left" }}>All {label}s</span>
                  </button>
                  <div style={{ maxHeight: 320, overflowY: "auto" }}>
                    {(isLoadingJira) ? (
                      [...Array(3)].map((_, i) => <div key={i} style={{ height: 38, margin: "6px 10px", background: "#f8fafc", borderRadius: 7 }} />)
                    ) : list.length === 0 ? (
                      <div style={{ padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 12 }}>No {label.toLowerCase()}s found.</div>
                    ) : list.map(c => (
                      <button key={c.id} onClick={() => { setSelectedCustomerId(selectedCustomerId === c.id ? null : c.id); setCustOpen(false); }}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "9px 14px", background: selectedCustomerId === c.id ? "#f0f4f8" : "transparent", border: "none", borderBottom: "1px solid #f8fafc", cursor: "pointer", color: selectedCustomerId === c.id ? "#123e67" : "#334155" }}>
                        <div style={{ width: 26, height: 26, borderRadius: "50%", background: selectedCustomerId === c.id ? "#e8eff6" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: selectedCustomerId === c.id ? "#123e67" : "#64748b", flexShrink: 0 }}>
                          {c.name[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "left" }}>{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          {/* Sales Order search */}
          <div style={{ position: "relative" }}>
            <Search size={12} color="#94a3b8" style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)" }} />
            <input value={soSearch} onChange={e => setSoSearch(e.target.value)} placeholder="Sales Order #"
              style={{ paddingLeft: 28, height: 34, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#334155", outline: "none", width: 140 }} />
          </div>

          {/* Product Name search */}
          <div style={{ position: "relative" }}>
            <Search size={12} color="#94a3b8" style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)" }} />
            <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Product name…"
              style={{ paddingLeft: 28, height: 34, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#334155", outline: "none", width: 150 }} />
          </div>

          {/* Workflow Status */}
          <select value={workflowFilter} onChange={e => setWorkflowFilter(e.target.value)} style={{ ...selStyle, width: 200 }}>
            <option value="">Workflow Status</option>
            {WORKFLOW_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Order Health */}
          <select value={healthFilter} onChange={e => setHealthFilter(e.target.value)} style={{ ...selStyle, width: 160 }}>
            <option value="">Order Health</option>
            {ORDER_HEALTHS.map(h => <option key={h} value={h}>{h}</option>)}
          </select>


          {/* ── Health stat strip (Integrated into filter bar) ────────────────── */}
          {!isLoadingOrders && (
            <div style={{ display: "flex",  gap: 8, marginLeft: "auto", padding: "0 8px",}}>
              {[
                { key: "On Track",           label: "On Track",          color: "#16a34a", border: "#16a34a", bg: "#f0fdf4", match: (h: string) => h.toLowerCase().includes("track") && !h.toLowerCase().includes("off"), icon: <CheckCircle2 size={11} /> },
                { key: "Off Track",          label: "Off Track",         color: "#dc2626", border: "#dc2626", bg: "#fef2f2", match: (h: string) => h.toLowerCase().includes("off track"), icon: <AlertCircle size={11} /> },
                { key: "At Risk",            label: "At Risk",           color: "#d97706", border: "#f59e0b", bg: "#fffbeb", match: (h: string) => h.toLowerCase().includes("risk") || h.toLowerCase().includes("hold"), icon: <AlertTriangle size={11} /> },
                { key: "White Label Order",  label: "White Label Order", color: "#7c3aed", border: "#7c3aed", bg: "#f5f3ff", match: (h: string) => h.toLowerCase().includes("white"), icon: <Tag size={11} /> },
              ].map((s) => {
                const count = displayOrders.filter(o => s.match(o.health || "")).length;
                const isActive = healthFilter === s.key;
                return (
                  <button
                    key={s.key}
                    onClick={() => setHealthFilter(healthFilter === s.key ? "" : s.key)}
                    style={{
                      display: "flex", alignItems: "center",
                      padding: "6px 10px", border: "1px solid #e2e8f0", borderLeft: `3px solid ${isActive ? s.border : "#cbd5e1"}`,
                      background: isActive ? s.bg : "#fff", borderRadius: 6,
                      cursor: "pointer", transition: "all 0.15s", gap: 6, whiteSpace: "nowrap"
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "#f8fafc"; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "#fff"; }}
                  >
                    <div style={{ color: isActive ? s.color : "#94a3b8", display: "flex" }}>{s.icon}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: isActive ? s.color : "#64748b", textTransform: "uppercase", letterSpacing: "0.02em" }}>{s.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: isActive ? s.color : "#0f172a", marginLeft: 4 }}>{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, background: "#f1f5f9", padding: "4px 10px", borderRadius: 6 }}>
              {displayOrders.length} order{displayOrders.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>


        {/* Table wrapper - takes remaining height and scrolls */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "auto", padding: "0 20px 20px", minHeight: 0 }}>
          {isLoadingOrders
            ? <div style={{ paddingTop: 40 }}><LoadingSpinner /></div>
            : renderOrdersTable(displayOrders as Order[], "all")
          }
        </div>
      </div>
    </div>
  );
}


// ─── Internal overview ────────────────────────────────────────────────────────
function InternalView({ activeOrders, completedOrders, countOnTrack, countOffTrack, countAtRisk, countWhiteLabel, isLoadingOrders, renderOrdersTable }: {
  activeOrders: Order[]; completedOrders: Order[]; countOnTrack: number; countOffTrack: number;
  countAtRisk: number; countWhiteLabel: number; isLoadingOrders: boolean;
  renderOrdersTable: (orders: Order[], tab: "active" | "completed" | "all") => React.ReactNode;
}) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "On Track", value: countOnTrack, color: "#10b981", bg: "#d1fae5" },
          { label: "Off Track", value: countOffTrack, color: "#ef4444", bg: "#fee2e2" },
          { label: "At Risk", value: countAtRisk, color: "#f59e0b", bg: "#fef3c7" },
          { label: "White Label", value: countWhiteLabel, color: "#6366f1", bg: "#ede9fe" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1px solid #e2e8f0", borderLeft: `4px solid ${s.color}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 34, fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "20px 24px", marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 14 }}>Active Orders ({activeOrders.length})</div>
        {isLoadingOrders ? <LoadingSpinner /> : renderOrdersTable(activeOrders, "active")}
      </div>
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "20px 24px" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 14 }}>Completed Orders ({completedOrders.length})</div>
        {isLoadingOrders ? <LoadingSpinner /> : renderOrdersTable(completedOrders, "completed")}
      </div>
    </div>
  );
}

// ─── Orders section ───────────────────────────────────────────────────────────
function OrdersSection({ title, orders, tab, isLoading, renderTable, stats }: {
  title: string; orders: Order[]; tab: "active" | "completed"; isLoading: boolean;
  renderTable: (orders: Order[], tab: "active" | "completed" | "all") => React.ReactNode;
  stats: { onTrack: number; offTrack: number; atRisk: number; whiteLabel: number } | null;
}): React.ReactNode {
  const [search, setSearch] = useState("");
  const filtered = orders.filter(o =>
    !search || o.so.toLowerCase().includes(search.toLowerCase()) || o.product.toLowerCase().includes(search.toLowerCase()) || o.customer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
          {[
            { label: "On Track", value: stats.onTrack, color: "#10b981" },
            { label: "Off Track", value: stats.offTrack, color: "#ef4444" },
            { label: "At Risk", value: stats.atRisk, color: "#f59e0b" },
            { label: "White Label", value: stats.whiteLabel, color: "#6366f1" },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1px solid #e2e8f0", borderLeft: `4px solid ${s.color}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 34, fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{title} <span style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", marginLeft: 6 }}>{filtered.length}</span></div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ position: "relative" }}>
              <Search size={13} color="#94a3b8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders…"
                style={{ paddingLeft: 30, height: 34, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 9, fontSize: 12, color: "#334155", outline: "none", width: 180 }} />
            </div>
            <button style={{ height: 34, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 9, padding: "0 12px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: "#475569", fontWeight: 600 }}>
              <Filter size={12} /> Filter
            </button>
          </div>
        </div>
        <div style={{ padding: "16px 24px" }}>
          {isLoading ? <LoadingSpinner /> : renderTable(filtered, tab)}
        </div>
      </div>
    </div>
  );
}

// ─── Settings placeholder ─────────────────────────────────────────────────────
function SettingsSection() {
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: "40px", textAlign: "center" }}>
      <Settings size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
      <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Settings</h2>
      <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Workspace configuration options will appear here.</p>
    </div>
  );
}

// ─── Loading spinner ──────────────────────────────────────────────────────────
function LoadingSpinner() {
  return (
    <div style={{ 
      padding: "60px 0", 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      color: "#94a3b8",
      gap: 12
    }}>
      <RefreshCw size={32} style={{ opacity: 0.4, animation: "spin 2s linear infinite" }} />
      <p style={{ fontSize: 13, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8" }}>Loading data…</p>
    </div>
  );
}
