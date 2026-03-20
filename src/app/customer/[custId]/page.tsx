"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowDown, Briefcase, ClipboardList, ExternalLink,
  LayoutDashboard, MessageSquare, RefreshCw, Search,
  CheckCircle2, Clock, LogOut
} from "lucide-react";
import { signOut } from "next-auth/react";
import type { Order } from "@/types/dashboard";
import AssetVault from "@/components/AssetVault";
import { OrderFilesPreview } from "@/components/dashboard/OrderFiles";
import { LORRequestsTable } from "@/components/dashboard/LORRequestsTable";
import { useOrderHighlights } from "@/hooks/useNDNWebSocket";
import { DashboardPageFrame } from "@/components/dashboard/DashboardPageFrame";

const WORKFLOW_STATUSES = [
  "1 - Ready to Start Order", "2 - In Sourcing", "3 - Ordering Raw Materials",
  "4 - All Raw Materials Ordered", "5 - All Raw Materials Received",
  "6 - Raw Materials Testing Complete", "7 - In Manufacturing",
  "8 - Manufacturing Complete", "9 - Bulk Product Testing",
  "10 - Awaiting Packaging", "11 - In Packaging", "12 - Finished Goods Testing",
  "Partial Shipment", "Final Product Shipped", "Cancelled", "On Hold",
];
const ORDER_HEALTHS = ["On Track", "Off Track", "At Risk", "White Label Order", "On Hold", "Pending Deposit"];

function tdStyle(first: boolean, last: boolean): React.CSSProperties {
  return {
    padding: "13px 14px", fontSize: 13, color: "#334155", background: "inherit",
    borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9",
    ...(first ? { borderLeft: "1px solid #f1f5f9", borderTopLeftRadius: 10, borderBottomLeftRadius: 10 } : {}),
    ...(last ? { borderRight: "1px solid #f1f5f9", borderTopRightRadius: 10, borderBottomRightRadius: 10 } : {}),
  };
}

function healthBadge(health: string) {
  const l = health.toLowerCase();
  if (l.includes("track") && !l.includes("off")) return { bg: "#dcfce7", color: "#166534" };
  if (l.includes("off track")) return { bg: "#fee2e2", color: "#991b1b" };
  if (l.includes("risk") || l.includes("hold")) return { bg: "#ffedd5", color: "#9a3412" };
  if (l.includes("pending")) return { bg: "#e0f2fe", color: "#075985" };
  if (l.includes("white")) return { bg: "#ede9fe", color: "#5b21b6" };
  return { bg: "#f1f5f9", color: "#475569" };
}

function CustomerDetailContent() {
  const params = useParams();
  const router = useRouter();
  const custId = params.custId as string;

  const [customerName, setCustomerName] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [agentName, setAgentName] = useState<string | null>(null);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [tabFilter, setTabFilter] = useState<"all" | "active" | "completed">("all");
  const [soSearch, setSoSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [workflowFilter, setWorkflowFilter] = useState("");
  const [healthFilter, setHealthFilter] = useState("");

  const { isHighlighted, markRead } = useOrderHighlights([]);

  // Resolve customer name from the Jira custId
  useEffect(() => {
    fetch(`/api/jira/customers?type=customer`)
      .then(r => r.json())
      .then((customers: { name: string; agent: string; jiraId: string }[]) => {
        const match = customers.find(c => c.jiraId === custId);
        if (match) {
          setCustomerName(match.name);
          if (match.agent && match.agent !== "Unassigned") setAgentName(match.agent);
        } else {
          setCustomerName(custId); // fallback
        }
      })
      .catch(() => setCustomerName(custId));
  }, [custId]);

  // Load orders for this customer
  useEffect(() => {
    if (!customerName || customerName === custId) return;
    setIsLoading(true);
    fetch(`/api/jira/orders?view=client&customerName=${encodeURIComponent(customerName)}`)
      .then(r => r.json())
      .then(d => {
        setActiveOrders(d.activeOrders || []);
        setCompletedOrders(d.completedOrders || []);
      })
      .catch(() => { setActiveOrders([]); setCompletedOrders([]); })
      .finally(() => setIsLoading(false));
  }, [customerName, custId]);

  const allOrders = useMemo(() => [
    ...activeOrders.map(o => ({ ...o, _tab: "active" as const })),
    ...completedOrders.map(o => ({ ...o, _tab: "completed" as const })),
  ], [activeOrders, completedOrders]);

  const displayOrders = useMemo(() => {
    let orders = allOrders as (Order & { _tab: string })[];
    if (tabFilter !== "all") orders = orders.filter(o => o._tab === tabFilter);
    if (soSearch) orders = orders.filter(o => o.so?.toLowerCase().includes(soSearch.toLowerCase()));
    if (productSearch) orders = orders.filter(o => o.product?.toLowerCase().includes(productSearch.toLowerCase()));
    if (workflowFilter) orders = orders.filter(o => o.status?.toLowerCase().includes(workflowFilter.toLowerCase()));
    if (healthFilter) orders = orders.filter(o => o.health?.toLowerCase().includes(healthFilter.toLowerCase()));
    return orders;
  }, [allOrders, tabFilter, soSearch, productSearch, workflowFilter, healthFilter]);

  const toggleRow = (id: number, orderKey?: string) => {
    setExpandedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
    if (orderKey && !expandedRows.includes(id)) markRead(orderKey);
  };

  const totalPaid = allOrders.reduce((s, o) => s + (o.commissionPaid || 0), 0);
  const totalDue = allOrders.reduce((s, o) => s + (o.commissionDue || 0), 0);

  const selStyle = { height: 34, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#334155", outline: "none", padding: "0 10px", cursor: "pointer" } as React.CSSProperties;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .order-row:hover { background-color: #f8fafc !important; }`}</style>

      {/* Header */}
      <div style={{ background: "#123e67", padding: "20px 32px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => router.back()} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "6px 14px", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          ← Back
        </button>
        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Customer Profile</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff" }}>{customerName || "Loading…"}</h1>
          {agentName && (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
              Account Manager: <span style={{ color: "#fff", fontWeight: 700 }}>{agentName}</span>
            </div>
          )}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 14px", color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 600 }}>
            Jira ID: {custId}
          </div>
          <a href={`https://nextdaynutra.atlassian.net/browse/${custId}`} target="_blank" rel="noopener noreferrer"
            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 8, padding: "6px 14px", color: "#fff", fontSize: 12, fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
            View in Jira
          </a>
          <button 
            onClick={() => signOut()}
            style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 8, padding: "6px 14px", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>

      <div style={{ padding: "24px 32px" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Total Orders", value: allOrders.length, color: "#123e67", bg: "#e8eff6" },
            { label: "Active Orders", value: activeOrders.length, color: "#16a34a", bg: "#dcfce7" },
            { label: "Completed Orders", value: completedOrders.length, color: "#7c3aed", bg: "#ede9fe" },
            { label: "Amount Paid", value: `$${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: "#ea580c", bg: "#fff7ed" },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: "16px 20px", border: `1px solid ${s.color}22` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Orders panel */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px 0", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>Orders for {customerName}</div>
              <div style={{ display: "flex", gap: 16 }}>
                {[
                  { label: "+ Create an Order", href: "https://nextdaynutra.atlassian.net/jira/software/c/projects/CM/form/4" },
                ].map(link => (
                  <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, fontWeight: 700, color: "#123e67", textDecoration: "none" }}>
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 0, marginBottom: -1 }}>
              {([["all","All Orders", allOrders.length], ["active","Active", activeOrders.length], ["completed","Completed", completedOrders.length]] as const).map(([key, lbl, count]) => (
                <button key={key} onClick={() => setTabFilter(key)} style={{ padding: "8px 18px", border: "none", background: "none", borderBottom: tabFilter === key ? "2px solid #123e67" : "2px solid transparent", color: tabFilter === key ? "#123e67" : "#64748b", fontWeight: tabFilter === key ? 700 : 500, fontSize: 13, cursor: "pointer" }}>
                  {lbl} <span style={{ background: "#f1f5f9", fontSize: 10, padding: "1px 7px", borderRadius: 10, fontWeight: 700, marginLeft: 4 }}>{count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div style={{ padding: "10px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", gap: 10, flexWrap: "wrap", background: "#fafafa" }}>
            <div style={{ position: "relative" }}>
              <Search size={12} color="#94a3b8" style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)" }} />
              <input value={soSearch} onChange={e => setSoSearch(e.target.value)} placeholder="Sales Order #" style={{ paddingLeft: 28, height: 34, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#334155", outline: "none", width: 140 }} />
            </div>
            <div style={{ position: "relative" }}>
              <Search size={12} color="#94a3b8" style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)" }} />
              <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Product name…" style={{ paddingLeft: 28, height: 34, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#334155", outline: "none", width: 150 }} />
            </div>
            <select value={workflowFilter} onChange={e => setWorkflowFilter(e.target.value)} style={{ ...selStyle, width: 180 }}>
              <option value="">Workflow Status</option>
              {WORKFLOW_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={healthFilter} onChange={e => setHealthFilter(e.target.value)} style={{ ...selStyle, width: 140 }}>
              <option value="">Order Health</option>
              {ORDER_HEALTHS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <span style={{ marginLeft: "auto", fontSize: 12, color: "#94a3b8", fontWeight: 700, background: "#f1f5f9", padding: "4px 10px", borderRadius: 6, alignSelf: "center" }}>
              {displayOrders.length} order{displayOrders.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div style={{ overflowX: "auto", padding: "0 20px 20px" }}>
            {isLoading ? (
              <div style={{ padding: "48px 0", textAlign: "center", color: "#94a3b8" }}>
                <RefreshCw size={28} style={{ opacity: 0.3, animation: "spin 1s linear infinite", marginBottom: 10 }} />
                <p style={{ fontSize: 14, margin: 0 }}>Loading orders…</p>
              </div>
            ) : displayOrders.length === 0 ? (
              <div style={{ padding: "48px 0", textAlign: "center", color: "#94a3b8" }}>
                <ClipboardList size={36} style={{ opacity: 0.3, marginBottom: 10 }} />
                <p style={{ fontSize: 14, margin: 0 }}>No orders found</p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 6px", minWidth: 1000 }}>
                <thead>
                  <tr>
                    {["Order Health","Sales Order #","CM Key","Product","Status","Qty","Start Date","EST Ship","Actions"].map(h => (
                      <th key={h} style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", textAlign: "left", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayOrders.map(order => {
                    const isExp = expandedRows.includes(order.id);
                    const { bg, color } = healthBadge(order.health);
                    const orderKey = (order.cmKey || order.so || "").toLowerCase();
                    const hl = isHighlighted(orderKey);
                    const isCompleted = (order as any)._tab === "completed";
                    return (
                      <React.Fragment key={order.id}>
                        <tr className="order-row" 
                          style={{ 
                            background: isExp ? "#f8fafc" : hl ? "#fffbf5" : "#fff", 
                            cursor: "pointer",
                            boxShadow: hl ? "0 0 0 2px #f97316, 0 4px 16px -4px rgba(249,115,22,0.18)" : "none",
                            animation: hl ? "highlightPulse 2s ease-in-out" : "none",
                            transition: "all 0.2s ease"
                          }} 
                          onClick={() => toggleRow(order.id, orderKey)}
                        >
                          <td style={tdStyle(true, false)}><span style={{ background: bg, color, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{order.health}</span></td>
                          <td style={{ ...tdStyle(false, false), fontWeight: 700, color: "#0f172a" }}>{order.so || "—"}</td>
                          <td style={{ ...tdStyle(false, false), whiteSpace: "nowrap" }}>
                            {order.cmKey ? <a href={`https://nextdaynutra.atlassian.net/browse/${order.cmKey}`} target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }} onClick={e => e.stopPropagation()}>{order.cmKey} <ExternalLink size={11} /></a> : "—"}
                          </td>
                          <td style={{ ...tdStyle(false, false), minWidth: 200 }}>{order.product}</td>
                          <td style={tdStyle(false, false)}>{order.status}</td>
                          <td style={{ ...tdStyle(false, false), fontWeight: 600 }}>{order.qty}</td>
                          <td style={{ ...tdStyle(false, false), whiteSpace: "nowrap", color: "#64748b" }}>{order.start}</td>
                          <td style={{ ...tdStyle(false, false), whiteSpace: "nowrap", color: "#64748b" }}>{order.est}</td>
                          <td style={{ ...tdStyle(false, true), width: 130 }}>
                            <button onClick={e => { e.stopPropagation(); toggleRow(order.id, orderKey); }} style={{ background: isExp ? "#f1f5f9" : "#123e67", color: isExp ? "#334155" : "#fff", border: "none", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", width: "100%" }}>
                              {isExp ? "Hide" : "Details"}
                            </button>
                          </td>
                        </tr>
                        {isExp && (
                          <tr>
                            <td colSpan={9} style={{ padding: "0 0 8px" }}>
                              <div style={{ background: "#f8fafc", borderRadius: 12, margin: "0 2px", padding: 20, border: "1px solid #e2e8f0" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                                  <div style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e2e8f0" }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><LayoutDashboard size={14} color="#123e67" /> Order Notes</div>
                                    {order.notes.length > 0 ? <ul style={{ margin: 0, paddingLeft: 18, color: "#475569", fontSize: 13, lineHeight: 1.7 }}>{order.notes.map((n, i) => <li key={i}>{n}</li>)}</ul> : <p style={{ fontSize: 13, color: "#94a3b8", fontStyle: "italic", margin: 0 }}>No notes recorded.</p>}
                                  </div>
                                  <div style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e2e8f0" }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}><Briefcase size={14} color="#123e67" /> Inventory</div>
                                    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                                      {[["Initial", order.initialInv, "#0f172a"], ["Delivered", order.deliveredInv, "#16a34a"], ["Remaining", order.remainingInv, "#ea580c"]].map(([lbl, val, col]) => (
                                        <div key={String(lbl)} style={{ flex: 1, background: "#f8fafc", borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
                                          <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>{lbl}</div>
                                          <div style={{ fontSize: 20, fontWeight: 800, color: String(col) }}>{val}</div>
                                        </div>
                                      ))}
                                    </div>
                                    <OrderFilesPreview
                                      orderId={(order.cmKey || order.so).toLowerCase()}
                                      hideEmptyState={isCompleted}
                                      uploadButton={!isCompleted && <AssetVault orderId={(order.cmKey || order.so).toLowerCase()} customerId={order.id || 999} isAdmin mode="button" />}
                                    />
                                  </div>
                                </div>
                                {/* LOR Requests */}
                                {order.lorRequests?.length > 0 && (
                                  <LORRequestsTable lorRequests={order.lorRequests} />
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomerDetailPage() {
  return (
    <DashboardPageFrame section="customers" activeLabel="Customer Profile" sectionGroupLabel="Dashboards">
      <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading customer profile…</div>}>
        <CustomerDetailContent />
      </Suspense>
    </DashboardPageFrame>
  );
}
