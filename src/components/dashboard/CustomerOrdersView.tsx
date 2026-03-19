"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  ChevronDown,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Tag,
} from "lucide-react";
import type { Order, Customer } from "@/types/dashboard";
import { LoadingSpinner } from "./LoadingSpinner";
import { OrdersTable } from "./OrdersTable";

const WORKFLOW_STATUSES = [
  "1 - Ready to Start Order",
  "2 - In Sourcing",
  "3 - Ordering Raw Materials",
  "4 - All Raw Materials Ordered",
  "5 - All Raw Materials Received",
  "6 - Raw Materials Testing Complete",
  "7 - In Manufacturing",
  "8 - Manufacturing Complete",
  "9 - Bulk Product Testing",
  "10 - Awaiting Packaging",
  "11 - In Packaging",
  "12 - Finished Goods Testing",
  "Partial Shipment",
  "Final Product Shipped",
  "Cancelled",
  "On Hold",
];

const ORDER_HEALTHS = [
  "On Track",
  "Off Track",
  "At Risk",
  "White Label Order",
  "On Hold",
  "Pending Deposit",
];

const QUICK_LINKS = [
  { label: "+ Create a New Customer", action: "create-customer" as const },
  { label: "+ Create an Order", href: "https://nextdaynutra.atlassian.net/jira/software/c/projects/CM/form/4" },
  { label: "+ Create a Lead in Brevo", href: "https://dashboard.nextdaynutra.com/manual-user-create-form" },
];

interface CustomerOrdersViewProps {
  viewMode: "client" | "agent";
  filteredUsersList: Customer[];
  selectedCustomerId: number | null;
  setSelectedCustomerId: (id: number | null) => void;
  selectedCustomer: Customer | null;
  isLoadingJira: boolean;
  isLoadingOrders: boolean;
  allOrders: (Order & { _tab: string })[];
  expandedRows: number[];
  sortConfig: { key: keyof Order; direction: "asc" | "desc" } | null;
  onSort: (key: keyof Order) => void;
  onToggleRow: (id: number, orderKey: string) => void;
  isHighlighted: (key: string) => boolean;
  resolveCustomerId: (name: string) => number;
  onCreateCustomer: () => void;
  canCreateCustomer: boolean;
}

export function CustomerOrdersView({
  viewMode,
  filteredUsersList,
  selectedCustomerId,
  setSelectedCustomerId,
  selectedCustomer,
  isLoadingJira,
  isLoadingOrders,
  allOrders,
  expandedRows,
  sortConfig,
  onSort,
  onToggleRow,
  isHighlighted,
  resolveCustomerId,
  onCreateCustomer,
  canCreateCustomer,
}: CustomerOrdersViewProps) {
  const [search, setSearch] = useState("");
  const [soSearch, setSoSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [workflowFilter, setWorkflowFilter] = useState("");
  const [healthFilter, setHealthFilter] = useState("");
  const [tabFilter, setTabFilter] = useState<"all" | "active" | "completed">("all");
  const [custOpen, setCustOpen] = useState(false);

  const label = viewMode === "agent" ? "Agent" : "Customer";
  const list = filteredUsersList.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const displayOrders = useMemo(() => {
    let orders = selectedCustomer
      ? allOrders.filter(
          (o) =>
            o.customer?.trim().toLowerCase() === selectedCustomer.name.trim().toLowerCase()
        )
      : allOrders;
    if (tabFilter !== "all") orders = orders.filter((o) => o._tab === tabFilter);
    if (soSearch) orders = orders.filter((o) => o.so?.toLowerCase().includes(soSearch.toLowerCase()));
    if (productSearch) orders = orders.filter((o) => o.product?.toLowerCase().includes(productSearch.toLowerCase()));
    if (workflowFilter) orders = orders.filter((o) => o.status?.toLowerCase().includes(workflowFilter.toLowerCase()));
    if (healthFilter) orders = orders.filter((o) => o.health?.toLowerCase().includes(healthFilter.toLowerCase()));
    return orders;
  }, [allOrders, selectedCustomer, tabFilter, soSearch, productSearch, workflowFilter, healthFilter]);

  const activeCount = allOrders.filter(
    (o) =>
      o._tab === "active" &&
      (!selectedCustomer ||
        o.customer?.trim().toLowerCase() === selectedCustomer.name.trim().toLowerCase())
  ).length;

  const completedCount = allOrders.filter(
    (o) =>
      o._tab === "completed" &&
      (!selectedCustomer ||
        o.customer?.trim().toLowerCase() === selectedCustomer.name.trim().toLowerCase())
  ).length;

  const selStyle: React.CSSProperties = {
    height: 34,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 12,
    color: "#334155",
    outline: "none",
    padding: "0 10px",
    cursor: "pointer",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {/* Panel header */}
        <div style={{ padding: "14px 20px 0", borderBottom: "1px solid #f1f5f9" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
              {selectedCustomer ? selectedCustomer.name : `All ${label}s`}
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              {QUICK_LINKS.filter((link) => canCreateCustomer || !("action" in link)).map((link) =>
                "action" in link ? (
                  <button
                    key={link.label}
                    type="button"
                    onClick={onCreateCustomer}
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#123e67",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      whiteSpace: "nowrap",
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#f05323")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#123e67")}
                  >
                    {link.label}
                  </button>
                ) : (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#123e67",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#f05323")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#123e67")}
                  >
                    {link.label}
                  </a>
                )
              )}
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ display: "flex", gap: 0, marginBottom: -1 }}>
            {(
              [
                ["all", "All Orders", activeCount + completedCount, null],
                ["active", "Active", activeCount, <Clock key="clock" size={14} />],
                ["completed", "Completed", completedCount, <CheckCircle2 key="check" size={14} />],
              ] as const
            ).map(([key, label2, count, icon]) => (
              <button
                key={key}
                onClick={() => setTabFilter(key)}
                style={{
                  padding: "8px 18px",
                  border: "none",
                  background: "none",
                  borderBottom:
                    tabFilter === key ? "2px solid #123e67" : "2px solid transparent",
                  color: tabFilter === key ? "#123e67" : "#64748b",
                  fontWeight: tabFilter === key ? 700 : 500,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {icon}
                {label2}
                <span
                  style={{
                    background: tabFilter === key ? "#e8eff6" : "#f1f5f9",
                    color: tabFilter === key ? "#0d2d4e" : "#64748b",
                    fontSize: 10,
                    padding: "1px 7px",
                    borderRadius: 10,
                    fontWeight: 700,
                  }}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Filter bar */}
        <div
          style={{
            padding: "12px 20px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            background: "#fafafa",
          }}
        >
          {/* Customer Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setCustOpen(!custOpen)}
              style={{
                ...selStyle,
                width: 170,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#fff",
              }}
            >
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontWeight: 600,
                }}
              >
                {selectedCustomer ? selectedCustomer.name : `All ${label}s`}
              </span>
              <ChevronDown
                size={14}
                color="#94a3b8"
                style={{
                  transform: custOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                }}
              />
            </button>
            {custOpen && (
              <>
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 40 }}
                  onClick={() => setCustOpen(false)}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    marginTop: 4,
                    width: 260,
                    background: "#fff",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                    zIndex: 50,
                    overflow: "hidden",
                  }}
                >
                  <div style={{ padding: "12px 14px", borderBottom: "1px solid #f1f5f9" }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#94a3b8",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        marginBottom: 8,
                      }}
                    >
                      {label}s
                    </div>
                    <div style={{ position: "relative" }}>
                      <Search
                        size={12}
                        color="#94a3b8"
                        style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)" }}
                      />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search…"
                        autoFocus
                        style={{
                          width: "100%",
                          paddingLeft: 28,
                          height: 32,
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: 8,
                          fontSize: 12,
                          color: "#334155",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => { setSelectedCustomerId(null); setCustOpen(false); }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      padding: "9px 14px",
                      background: selectedCustomerId === null ? "#f0f4f8" : "transparent",
                      border: "none",
                      borderBottom: "1px solid #f8fafc",
                      cursor: "pointer",
                      color: selectedCustomerId === null ? "#123e67" : "#334155",
                    }}
                  >
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: selectedCustomerId === null ? "#e8eff6" : "#f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 800,
                        color: selectedCustomerId === null ? "#123e67" : "#64748b",
                        flexShrink: 0,
                      }}
                    >
                      <Sparkles size={14} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, flex: 1, textAlign: "left" }}>
                      All {label}s
                    </span>
                  </button>

                  <div style={{ maxHeight: 320, overflowY: "auto" }}>
                    {isLoadingJira ? (
                      [...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          style={{
                            height: 38,
                            margin: "6px 10px",
                            background: "#f8fafc",
                            borderRadius: 7,
                          }}
                        />
                      ))
                    ) : list.length === 0 ? (
                      <div
                        style={{ padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 12 }}
                      >
                        No {label.toLowerCase()}s found.
                      </div>
                    ) : (
                      list.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedCustomerId(
                              selectedCustomerId === c.id ? null : c.id
                            );
                            setCustOpen(false);
                          }}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: 9,
                            padding: "9px 14px",
                            background:
                              selectedCustomerId === c.id ? "#f0f4f8" : "transparent",
                            border: "none",
                            borderBottom: "1px solid #f8fafc",
                            cursor: "pointer",
                            color: selectedCustomerId === c.id ? "#123e67" : "#334155",
                          }}
                        >
                          <div
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: "50%",
                              background:
                                selectedCustomerId === c.id ? "#e8eff6" : "#f1f5f9",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 11,
                              fontWeight: 800,
                              color: selectedCustomerId === c.id ? "#123e67" : "#64748b",
                              flexShrink: 0,
                            }}
                          >
                            {c.name[0]?.toUpperCase()}
                          </div>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              flex: 1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              textAlign: "left",
                            }}
                          >
                            {c.name}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* SO Search */}
          <div style={{ position: "relative" }}>
            <Search
              size={12}
              color="#94a3b8"
              style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              value={soSearch}
              onChange={(e) => setSoSearch(e.target.value)}
              placeholder="Sales Order #"
              style={{
                paddingLeft: 28,
                height: 34,
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 12,
                color: "#334155",
                outline: "none",
                width: 140,
              }}
            />
          </div>

          {/* Product Search */}
          <div style={{ position: "relative" }}>
            <Search
              size={12}
              color="#94a3b8"
              style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Product name…"
              style={{
                paddingLeft: 28,
                height: 34,
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 12,
                color: "#334155",
                outline: "none",
                width: 150,
              }}
            />
          </div>

          {/* Workflow Status */}
          <select
            value={workflowFilter}
            onChange={(e) => setWorkflowFilter(e.target.value)}
            style={{ ...selStyle, width: 200 }}
          >
            <option value="">Workflow Status</option>
            {WORKFLOW_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Order Health */}
          <select
            value={healthFilter}
            onChange={(e) => setHealthFilter(e.target.value)}
            style={{ ...selStyle, width: 160 }}
          >
            <option value="">Order Health</option>
            {ORDER_HEALTHS.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>

          {/* Health stat strip */}
          {!isLoadingOrders && (
            <div style={{ display: "flex", gap: 8, marginLeft: "auto", padding: "0 8px" }}>
              {[
                { key: "On Track", label: "On Track", color: "#16a34a", border: "#16a34a", bg: "#f0fdf4", match: (h: string) => h.toLowerCase().includes("track") && !h.toLowerCase().includes("off"), icon: <CheckCircle2 size={11} /> },
                { key: "Off Track", label: "Off Track", color: "#dc2626", border: "#dc2626", bg: "#fef2f2", match: (h: string) => h.toLowerCase().includes("off track"), icon: <AlertCircle size={11} /> },
                { key: "At Risk", label: "At Risk", color: "#d97706", border: "#f59e0b", bg: "#fffbeb", match: (h: string) => h.toLowerCase().includes("risk") || h.toLowerCase().includes("hold"), icon: <AlertTriangle size={11} /> },
                { key: "White Label Order", label: "White Label Order", color: "#7c3aed", border: "#7c3aed", bg: "#f5f3ff", match: (h: string) => h.toLowerCase().includes("white"), icon: <Tag size={11} /> },
              ].map((s) => {
                const count = displayOrders.filter((o) => s.match(o.health || "")).length;
                const isActive = healthFilter === s.key;
                return (
                  <button
                    key={s.key}
                    onClick={() => setHealthFilter(healthFilter === s.key ? "" : s.key)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "6px 10px",
                      border: "1px solid #e2e8f0",
                      borderLeft: `3px solid ${isActive ? s.border : "#cbd5e1"}`,
                      background: isActive ? s.bg : "#fff",
                      borderRadius: 6,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      gap: 6,
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.background = "#f8fafc";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.background = "#fff";
                    }}
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
            <span
              style={{
                fontSize: 12,
                color: "#94a3b8",
                fontWeight: 700,
                background: "#f1f5f9",
                padding: "4px 10px",
                borderRadius: 6,
              }}
            >
              {displayOrders.length} order{displayOrders.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Table */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "auto",
            padding: "0 20px 20px",
            minHeight: 0,
          }}
        >
          {isLoadingOrders ? (
            <div style={{ paddingTop: 40 }}>
              <LoadingSpinner />
            </div>
          ) : (
            <OrdersTable
              orders={displayOrders as Order[]}
              tab="all"
              expandedRows={expandedRows}
              sortConfig={sortConfig}
              onSort={onSort}
              onToggleRow={onToggleRow}
              isHighlighted={isHighlighted}
              filteredUsersList={filteredUsersList}
              onSelectCustomer={setSelectedCustomerId}
              resolveCustomerId={resolveCustomerId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
