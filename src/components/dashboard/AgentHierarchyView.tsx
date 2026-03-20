"use client";

import React, { useDeferredValue, useMemo, useRef, useState } from "react";
import { Search, ChevronRight } from "lucide-react";
import type { Order, JiraAgent, JiraCustomer } from "@/types/dashboard";
import { LoadingSpinner } from "./LoadingSpinner";
import { DateRangePicker } from "./DateRangePicker";
import { OrdersTable } from "./OrdersTable";
import { AnimatedNumber } from "./AnimatedNumber";

interface AgentHierarchyViewProps {
  allOrders: (Order & { _tab: string })[];
  allAgents: JiraAgent[];
  allAssignments: JiraCustomer[];
  isLoading: boolean;
  expandedRows: number[];
  sortConfig: { key: keyof Order; direction: "asc" | "desc" } | null;
  onSort: (key: keyof Order) => void;
  onToggleRow: (id: number, orderKey: string) => void;
  isHighlighted: (key: string) => boolean;
  resolveCustomerId: (name: string) => number;
  onSelectCustomer: (id: number) => void;
  lockedAgentName?: string | null;
  showAgentFilter?: boolean;
  showCreateAgentLink?: boolean;
}

const SEL_STYLE: React.CSSProperties = {
  height: 34,
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  fontSize: 12,
  color: "#334155",
  outline: "none",
  padding: "0 10px",
  cursor: "pointer",
};

export function AgentHierarchyView({
  allOrders,
  allAgents,
  allAssignments,
  isLoading,
  expandedRows,
  sortConfig,
  onSort,
  onToggleRow,
  isHighlighted,
  resolveCustomerId,
  onSelectCustomer,
  lockedAgentName,
  showAgentFilter = true,
  showCreateAgentLink = true,
}: AgentHierarchyViewProps) {
  const [expandedCustomers, setExpandedCustomers] = useState<string[]>([]);
  const [agentFilter, setAgentFilter] = useState(lockedAgentName || "All Agents");
  const [customerSearch, setCustomerSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("All Payments");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const deferredCustomerSearch = useDeferredValue(customerSearch);
  const effectiveAgentFilter = lockedAgentName || agentFilter;
  const isLockedAgentView = !!lockedAgentName;
  const hasUserToggledCustomerRef = useRef(false);

  const grouped = useMemo(() => {
    const map: Record<string, Record<string, (Order & { _tab: string })[]>> = {};

    const targetAgents =
      effectiveAgentFilter === "All Agents"
        ? allAgents
        : allAgents.filter((a) => a.name === effectiveAgentFilter);

    targetAgents.forEach((agentObj) => {
      const agent = agentObj.name;
      if (agent !== "Unassigned") {
        map[agent] = {};
        allAssignments.forEach((asm) => {
          if (asm.agent === agent) {
            if (!deferredCustomerSearch || asm.name.toLowerCase().includes(deferredCustomerSearch.toLowerCase())) {
              map[agent][asm.name] = [];
            }
          }
        });
      }
    });

    allOrders.forEach((order) => {
      const agent = order.agentName || "Unassigned";
      if (agent === "Unassigned") return;
      if (effectiveAgentFilter !== "All Agents" && agent !== effectiveAgentFilter) return;

      const customer = order.customer || "Unknown Customer";
      if (deferredCustomerSearch && !customer.toLowerCase().includes(deferredCustomerSearch.toLowerCase())) return;

      if (paymentStatus !== "All Payments") {
        const isPaid = order.customerPaymentStatus === "Paid In Full";
        const isPending =
          order.customerPaymentStatus === "Deposit Paid" ||
          order.customerPaymentStatus === "UnPaid";
        if (paymentStatus === "Paid" && !isPaid) return;
        if (paymentStatus === "Pending" && !isPending) return;
      }

      if (startDate || endDate) {
        const orderDate = order.start ? new Date(order.start) : null;
        if (orderDate) {
          if (startDate && orderDate < new Date(startDate)) return;
          if (endDate && orderDate > new Date(endDate)) return;
        } else if (startDate || endDate) {
          return;
        }
      }

      if (!map[agent]) map[agent] = {};
      if (!map[agent][customer]) map[agent][customer] = [];
      map[agent][customer].push(order);
    });

    Object.keys(map).forEach((agent) => {
      if (Object.keys(map[agent]).length === 0) delete map[agent];
    });

    return map;
  }, [allOrders, allAgents, allAssignments, effectiveAgentFilter, deferredCustomerSearch, paymentStatus, startDate, endDate]);

  const toggleCustomer = (name: string) =>
    setExpandedCustomers((prev) => {
      hasUserToggledCustomerRef.current = true;
      return prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name];
    });

  const totals = useMemo(() => {
    let paid = 0;
    let pending = 0;
    let balance = 0;
    Object.values(grouped).forEach(customers => {
      Object.values(customers).forEach(orders => {
        orders.forEach(o => {
          paid += (o.commissionPaid || 0);
          pending += (o.commissionDue || 0);
          balance += (o.commissionBalanceOwed || 0);
        });
      });
    });
    return { paid, pending, balance };
  }, [grouped]);

  const firstExpandedCustomerKey = useMemo(() => {
    if (!isLockedAgentView) return null;

    const firstAgentEntry = Object.entries(grouped)
      .filter(([name, customers]) => name !== "Unassigned" && Object.keys(customers).length > 0)
      .sort(([a], [b]) => a.localeCompare(b))[0];

    if (!firstAgentEntry) return null;

    const [agentName, customers] = firstAgentEntry;
    const firstCustomerName = Object.keys(customers)[0];
    return firstCustomerName ? `${agentName}-${firstCustomerName}` : null;
  }, [grouped, isLockedAgentView]);

  if (isLoading && allOrders.length === 0) return <LoadingSpinner />;

  const hasFilters =
    customerSearch ||
    paymentStatus !== "All Payments" ||
    startDate ||
    endDate;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%", overflow: "hidden" }}>
      {/* Filter Bar & Summary Widget */}
      <div style={{ display: "flex", gap: 16, alignItems: "stretch", flexWrap: "wrap" }}>
        <div
          style={{
            background: "#fff",
            padding: "16px 20px",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
            flex: 1,
          }}
        >
          {showAgentFilter && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginLeft: 4 }}>
                Agent
              </label>
              <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} style={{ ...SEL_STYLE, width: 180 }}>
                <option value="All Agents">All Agents</option>
                {allAgents
                  .filter((a) => a.name !== "Unassigned")
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((a) => (
                    <option key={a.jiraId} value={a.name}>{a.name}</option>
                  ))}
              </select>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginLeft: 4 }}>
              Customer
            </label>
            <div style={{ position: "relative" }}>
              <Search size={12} color="#94a3b8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
              <input value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} placeholder="Search customer…" style={{ ...SEL_STYLE, paddingLeft: 30, width: 200 }} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginLeft: 4 }}>
              Payment Status
            </label>
            <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} style={{ ...SEL_STYLE, width: 140 }}>
              <option value="All Payments">All Payments</option>
              <option value="Paid">Paid Only</option>
              <option value="Pending">Pending / Deposit</option>
            </select>
          </div>

          <DateRangePicker startDate={startDate} endDate={endDate} setStartDate={setStartDate} setEndDate={setEndDate} />

          {hasFilters && (
            <button
              onClick={() => {
                if (!lockedAgentName) setAgentFilter("All Agents");
                setCustomerSearch("");
                setPaymentStatus("All Payments");
                setStartDate("");
                setEndDate("");
              }}
              style={{ background: "none", border: "none", color: "#f05323", fontSize: 11, fontWeight: 700, cursor: "pointer", textDecoration: "underline", padding: "0 10px" }}
            >
              Reset Filters
            </button>
          )}

          {showCreateAgentLink && (
            <>
              <div style={{ width: 1, height: 24, background: "#e2e8f0", margin: "0 8px" }} />

              <a 
                href="https://dashboard.nextdaynutra.com/agent-create-form"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  color: "#123e67",
                  fontSize: 12,
                  fontWeight: 700,
                  textDecoration: "none",
                  padding: "6px 12px",
                  borderRadius: 8,
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Create Agent
              </a>
            </>
          )}
        </div>

        {/* Aggregate Totals Widget */}
        <div
          style={{
            background: "#123e67",
            borderRadius: 12,
            padding: "0",
            display: "flex",
            color: "#fff",
            margin: "2px 0px",

            overflow: "hidden",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            minWidth: 500,
          }}
        >
          {[
            { label: "Total Paid to Date", value: totals.paid, color: "#fff" },
            { label: "Next Payment Pending", value: totals.pending, color: "#fff" },
            { label: "Total Commission Balance", value: totals.balance, color: "#fff" },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                padding: "4px 20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                borderRight: i < 2 ? "1px solid rgba(255,255,255,1)" : "none",
              }}
            >
              <div style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: item.color }}>
                <AnimatedNumber
                  value={item.value}
                  prefix="$"
                  minimumFractionDigits={0}
                  maximumFractionDigits={2}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hierarchy Table */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "auto", flex: 1, minHeight: 0 }}>
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
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([agentName, customers]) => {
                const customerList = Object.entries(customers);
                const totalPaid = allOrders.filter((o) => o.agentName === agentName).reduce((acc, o) => acc + (o.commissionPaid || 0), 0);
                const totalDue = allOrders.filter((o) => o.agentName === agentName).reduce((acc, o) => acc + (o.commissionDue || 0), 0);

                return (
                  <React.Fragment key={agentName}>
                    {!isLockedAgentView && (
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                        <td style={{ padding: "14px 24px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontSize: 16, fontWeight: 800, color: "#123e67" }}>{agentName}</span>
                            <span style={{ fontSize: 11, color: "#64748b", background: "#e8eff6", padding: "2px 10px", borderRadius: 12, fontWeight: 700 }}>{customerList.length} Customers</span>
                          </div>
                        </td>
                        <td style={{ padding: "14px 24px", textAlign: "right", fontSize: 14, fontWeight: 800, color: "#16a34a" }}>${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td style={{ padding: "14px 24px", textAlign: "right", fontSize: 14, fontWeight: 800, color: "#f97316" }}>${totalDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    )}

                    {customerList.map(([custName, orders]) => {
                      const custKey = `${agentName}-${custName}`;
                      const isCustExp =
                        expandedCustomers.includes(custKey) ||
                        (
                          isLockedAgentView &&
                          !hasUserToggledCustomerRef.current &&
                          expandedCustomers.length === 0 &&
                          custKey === firstExpandedCustomerKey
                        );
                      const custPaid = orders.reduce((acc, o) => acc + (o.commissionPaid || 0), 0);
                      const custDue = orders.reduce((acc, o) => acc + (o.commissionDue || 0), 0);

                      return (
                        <React.Fragment key={custName}>
                          <tr onClick={() => toggleCustomer(custKey)} style={{ background: isCustExp ? "#f8fafc" : "#fff", cursor: "pointer", borderBottom: "1px solid #f8fafc" }}>
                            <td style={{ padding: isLockedAgentView ? "12px 24px" : "12px 24px 12px 48px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ color: "#123e67", transition: "transform 0.2s", transform: isCustExp ? "rotate(90deg)" : "none" }}>
                                  <ChevronRight size={14} />
                                </div>
                                <span style={{ fontWeight: 600, color: "#334155", fontSize: 13 }}>{custName}</span>
                                <span style={{ fontSize: 11, color: "#94a3b8" }}>({orders.length} Orders)</span>
                              </div>
                            </td>
                            <td style={{ padding: "12px 24px", textAlign: "right", fontSize: 13, color: "#16a34a", fontWeight: 600 }}>${custPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td style={{ padding: "12px 24px", textAlign: "right", fontSize: 13, color: "#f97316", fontWeight: 600 }}>${custDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>

                          {isCustExp && (
                            <tr style={{ background: "#fff" }}>
                              <td colSpan={3} style={{ padding: isLockedAgentView ? "8px 24px 20px" : "8px 24px 20px 48px" }}>
                                <div style={{ display: "flex", borderRadius: 12, padding: "16px 0", marginBottom: 12, alignItems: "center", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", border: "0.5px solid #111" }}>
                                  {[
                                    { label: "Total Orders", value: String(orders.length), border: true },
                                    { label: "Total Paid", value: `$${custPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, border: true },
                                    { label: "Total Amount Pending", value: `$${custDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, border: true },
                                    { label: "Total Balance Pending", value: `$${orders.reduce((acc, o) => acc + (o.commissionBalanceOwed || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, border: false },
                                  ].map((stat) => (
                                    <div key={stat.label} style={{ flex: 1, textAlign: "center", borderRight: stat.border ? "1px solid rgba(1,1,1,0.3)" : undefined }}>
                                      <div style={{ fontSize: 10, fontWeight: 700, color: "#123e67b5", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{stat.label}</div>
                                      <div style={{ fontSize: 20, fontWeight: 800, color: "#123e67" }}>{stat.value}</div>
                                    </div>
                                  ))}
                                </div>
                                <div style={{ border: "1px solid #f1f5f9", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                                    <OrdersTable
                                      orders={orders}
                                      tab="all"
                                      expandedRows={expandedRows}
                                      sortConfig={sortConfig}
                                      onSort={onSort}
                                      onToggleRow={onToggleRow}
                                      isHighlighted={isHighlighted}
                                      filteredUsersList={[]}
                                      onSelectCustomer={onSelectCustomer}
                                      resolveCustomerId={resolveCustomerId}
                                      variant="agent"
                                    />
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
