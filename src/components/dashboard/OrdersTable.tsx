"use client";

import React from "react";
import { createPortal } from "react-dom";
import {
  ClipboardList,
  ExternalLink,
  MessageSquare,
  ArrowUpDown,
  ArrowDown,
  ChevronUp,
  ChevronRight,
  Info,
} from "lucide-react";
import type { Order, Customer } from "@/types/dashboard";
import { tdStyle, healthBadgeColors } from "@/types/dashboard";
import { OrderRowExpanded } from "./OrderRowExpanded";

interface OrdersTableProps {
  orders: Order[];
  tab: "active" | "completed" | "all";
  expandedRows: number[];
  sortConfig: { key: keyof Order; direction: "asc" | "desc" } | null;
  onSort: (key: keyof Order) => void;
  onToggleRow: (id: number, orderKey: string) => void;
  isHighlighted: (key: string) => boolean;
  filteredUsersList: Customer[];
  onSelectCustomer: (id: number) => void;
  resolveCustomerId: (name: string) => number;
  variant?: "default" | "agent";
}

const TABLE_HEADERS: { label: string; key: keyof Order | "actions"; sortable?: boolean }[] = [
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

const AGENT_TABLE_HEADERS: { label: string; key: keyof Order | "actions"; sortable?: boolean }[] = [
  { label: "Sales Order #", key: "so" },
  { label: "Product Name", key: "product" },
  { label: "Status", key: "status" },
  { label: "Quantity Ordered", key: "qty" },
  { label: "Quoted Order Total", key: "quotedOrderTotal" },
  { label: "Final Order Total", key: "finalOrderTotal" },
  { label: "Days in Production", key: "days" },
  { label: "EST Ship", key: "est" },
  { label: "Customer Payment Status", key: "customerPaymentStatus" },
  { label: "Commission %", key: "commissionPercent" },
  { label: "Commission Total", key: "commissionTotal" },
  { label: "Commission Balance Owed", key: "commissionBalanceOwed" },
  { label: "Commission Paid", key: "commissionPaid" },
  { label: "Commission Due", key: "commissionDue" },
];

function EmptyTableState({ tab, headers }: { tab: string; headers: typeof TABLE_HEADERS }) {
  return (
    <div style={{ position: "relative", overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "separate",
          borderSpacing: "0 6px",
        }}
      >
        <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#fff" }}>
          <tr>
            {headers.map((h) => (
              <th
                key={h.key}
                style={{
                  padding: "12px 14px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  textAlign: "left",
                  borderBottom: "1px solid #f1f5f9",
                  background: "#fff",
                  zIndex: 10,
                  cursor: "default",
                  userSelect: "none",
                }}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td
              colSpan={headers.length}
              style={{
                padding: "80px 0",
                textAlign: "center",
                color: "#94a3b8",
                background: "#fff",
                borderRadius: 12,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <ClipboardList size={48} style={{ marginBottom: 16, opacity: 0.3, color: "#cbd5e1" }} />
                <p style={{ fontSize: 16, fontWeight: 500, color: "#64748b" }}>No {tab === "all" ? "" : tab} orders available.</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/** ─── Tooltip Component ──────────────────────────────────────────────────────── */
function Tooltip({ content, children }: { content: React.ReactNode; children: React.ReactNode }) {
  const [show, setShow] = React.useState(false);
  const [coords, setCoords] = React.useState({ top: 0, left: 0 });
  const [alignment, setAlignment] = React.useState<"center" | "right">("center");
  const triggerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (show && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      
      const centerLeft = rect.left + rect.width / 2;
      const tooltipWidth = 320;
      const viewportLimit = window.innerWidth - 20;
      
      const isOverflowingRight = (centerLeft + (tooltipWidth / 2)) > viewportLimit;
      
      setAlignment(isOverflowingRight ? "right" : "center");
      setCoords({
        top: rect.top + scrollY,
        left: centerLeft + scrollX,
      });
    }
  }, [show]);

  return (
    <div
      ref={triggerRef}
      style={{ display: "inline-flex", alignItems: "center" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show &&
        createPortal(
          <div
            style={{
              position: "absolute",
              top: coords.top,
              left: coords.left,
              transform: alignment === "center" ? "translateX(-50%) translateY(-100%) translateY(-8px)" : "translateX(-90%) translateY(-100%) translateY(-8px)",
              background: "white",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: "14px 18px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              zIndex: 10000,
              width: 320,
              maxWidth: 320,
              fontSize: 12,
              color: "#334155",
              lineHeight: 1.6,
              pointerEvents: "none",
            }}
          >
            {content}
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: alignment === "center" ? "50%" : "90%",
                transform: "translateX(-50%)",
                borderWidth: "6px",
                borderStyle: "solid",
                borderColor: "white transparent transparent transparent",
              }}
            />
          </div>,
          document.body
        )}
    </div>
  );
}

/** ─── OrdersTable Component ─────────────────────────────────────────────────── */
export function OrdersTable({
  orders,
  tab,
  expandedRows,
  sortConfig,
  onSort,
  onToggleRow,
  isHighlighted,
  filteredUsersList,
  onSelectCustomer,
  resolveCustomerId,
  variant = "default",
}: OrdersTableProps) {
  const headers = variant === "agent" ? AGENT_TABLE_HEADERS : TABLE_HEADERS;

  if (orders.length === 0) {
    return <EmptyTableState tab={tab} headers={headers} />;
  }

  // Sort
  let sortedOrders = [...orders];
  if (sortConfig !== null) {
    sortedOrders.sort((a, b) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let aVal: any = a[sortConfig.key as keyof Order];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let bVal: any = b[sortConfig.key as keyof Order];

      if (
        sortConfig.key === "qty" ||
        sortConfig.key === "quotedOrderTotal" ||
        sortConfig.key === "finalOrderTotal" ||
        sortConfig.key === "commissionPercent" ||
        sortConfig.key === "commissionTotal" ||
        sortConfig.key === "commissionBalanceOwed" ||
        sortConfig.key === "commissionPaid" ||
        sortConfig.key === "commissionDue"
      ) {
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
        return sortConfig.direction === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  // Highlighted orders bubble to top
  const highlightedOrders = sortedOrders.filter((o) =>
    isHighlighted((o.cmKey || o.so || "").toLowerCase())
  );
  const normalOrders = sortedOrders.filter(
    (o) => !isHighlighted((o.cmKey || o.so || "").toLowerCase())
  );
  const finalOrders = [...highlightedOrders, ...normalOrders];

  return (
    <div style={{ position: "relative" }}>
      <style>{`
        .expanded-row-container {
          animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
            max-height: 0;
          }
          to {
            opacity: 1;
            transform: translateY(0);
            max-height: 1000px;
          }
        }
      `}</style>
      <table
        style={{
          width: "100%",
          borderCollapse: "separate",
          borderSpacing: "0 6px",
        }}
      >
        <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#fff" }}>
          <tr>
            {headers.map((h) => (
              <th
                key={h.key}
                onClick={() =>
                  h.sortable !== false ? onSort(h.key as keyof Order) : undefined
                }
                style={{
                  padding: "12px 14px",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  textAlign: "left",
                  borderBottom: "1px solid #f1f5f9",
                  whiteSpace: "normal",
                  background: "#fff",
                  zIndex: 10,
                  cursor: h.sortable !== false ? "pointer" : "default",
                  userSelect: "none",
                  width:
                    h.key === "days"
                      ? 70
                      : h.key === "actions"
                      ? 140
                      : h.key === "cmKey"
                      ? 90
                      : h.key === "product"
                      ? 160
                      : h.key === "qty"
                      ? 60
                      : h.key === "customerPaymentStatus"
                      ? 100
                      : h.key === "commissionPercent"
                      ? 80
                      : h.key === "commissionBalanceOwed"
                      ? 100
                      : "auto",
                  minWidth:
                    h.key === "days"
                      ? 70
                      : h.key === "actions"
                      ? 140
                      : h.key === "cmKey"
                      ? 90
                      : h.key === "product"
                      ? 160
                      : h.key === "qty"
                      ? 60
                      : h.key === "customerPaymentStatus"
                      ? 100
                      : h.key === "commissionPercent"
                      ? 80
                      : h.key === "commissionBalanceOwed"
                      ? 100
                      : "auto",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 3,
                    width: "100%",
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ flexShrink: 1, lineHeight: "1.2" }}>
                    {h.label}
                  </span>
                  {h.sortable !== false && (
                    <span
                      style={{
                        color: sortConfig?.key === h.key ? "#123e67" : "#cbd5e1",
                        display: "flex",
                        marginTop: h.key === "days" || h.key === "qty" ? 2 : 0,
                        flexShrink: 0,
                      }}
                    >
                      {sortConfig?.key === h.key ? (
                        sortConfig.direction === "asc" ? (
                          <ChevronUp size={12} strokeWidth={3} />
                        ) : (
                          <ArrowDown size={12} strokeWidth={3} />
                        )
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
          {finalOrders.map((order) => {
            const isExp = expandedRows.includes(order.id);
            const { bg, color } = healthBadgeColors(order.health);
            const custId = resolveCustomerId(order.customer || "");
            const isCompleted = (order as Order & { _tab?: string })._tab === "completed";
            const orderKey = (order.cmKey || order.so || "").toLowerCase();
            const hl = isHighlighted(orderKey);

            // Row Coloring Logic
            const isFullPaid = variant === "agent" && order.customerPaymentStatus === "Paid In Full" && (!order.commissionDue || order.commissionDue === 0);
            const isUnpaid = variant === "agent" && order.customerPaymentStatus === "UnPaid";
            
            const rowClass = isFullPaid ? "row-success" : isUnpaid ? "row-warning" : "";
            const rowStyle: React.CSSProperties = {
              backgroundColor: isExp ? "#f8fafc" : isFullPaid ? "#dcfce7" : isUnpaid ? "#fef9c3" : hl ? "#fffbf5" : "#fff",
              color: isExp ? "inherit" : isFullPaid ? "#166534" : isUnpaid ? "#854d0e" : "inherit",
              borderRadius: 12,
              transition: "all 0.2s ease",
              boxShadow: hl
                ? "0 0 0 2px #f97316, 0 4px 16px -4px rgba(249,115,22,0.18)"
                : "none",
              animation: hl ? "highlightPulse 2s ease-in-out" : "none",
              cursor: "pointer",
            };

            return (
              <React.Fragment key={order.id}>
                <tr
                  className={`order-row ${rowClass}`}
                  style={rowStyle}
                  onClick={() => onToggleRow(order.id, orderKey)}
                >
                  {variant === "agent" ? (
                    <>
                      {/* SO */}
                      <td style={{ ...tdStyle(false, false), fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {order.notes && order.notes.length > 0 && (
                            <ChevronRight
                              size={16}
                              style={{
                                color: "#f97316",
                                transform: isExp ? "rotate(90deg)" : "none",
                                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                              }}
                            />
                          )}
                          {order.so || "—"}
                        </div>
                      </td>
                      {/* Product */}
                      <td style={{ ...tdStyle(false, false), minWidth: 220, color: "#334155", lineHeight: "1.4" }}>
                        {order.product || "—"}
                      </td>
                      {/* Status */}
                      <td style={tdStyle(false, false)}>{order.status || "—"}</td>
                      {/* Qty */}
                      <td style={{ ...tdStyle(false, false), fontWeight: 600 }}>{order.qty || "—"}</td>
                      {/* Quoted Order Total */}
                      <td style={{ ...tdStyle(false, false), color: isFullPaid ? "#166534" : "#16a34a", fontWeight: 600, position: "relative" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                          {order.quotedOrderTotal != null ? `$${order.quotedOrderTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                          <Tooltip content={(
                            <div style={{ textAlign: "left" }}>
                              <p style={{ fontWeight: 700, marginBottom: 6, color: "#0f172a" }}>Quoted Order Total</p>
                              <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>The projected total value of the order based on the Quantity Ordered and agreed Unit Price at the time of quoting.</p>
                            </div>
                          )}>
                            <Info size={12} style={{ opacity: 0.5, cursor: "help" }} />
                          </Tooltip>
                        </div>
                      </td>
                      {/* Final Order Total */}
                      <td style={{ ...tdStyle(false, false), color: isFullPaid ? "#166534" : "#16a34a", fontWeight: 600, position: "relative" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                          {order.finalOrderTotal != null ? `$${order.finalOrderTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                          <Tooltip content={(
                            <div style={{ textAlign: "left" }}>
                              <p style={{ fontWeight: 700, marginBottom: 6, color: "#0f172a" }}>Final Order Total</p>
                              <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>The confirmed total value of the order after production is complete. This is based on the actual total yield and the agreed unit price from the customer quote. Once available, this amount replaces the Quoted Order Total for commission calculations.</p>
                            </div>
                          )}>
                            <Info size={12} style={{ opacity: 0.5, cursor: "help" }} />
                          </Tooltip>
                        </div>
                      </td>
                      {/* Days */}
                      <td style={{ ...tdStyle(false, false), fontWeight: 700, color: isFullPaid ? "#166534" : "#0f172a" }}>{order.days || "—"}</td>
                      {/* EST */}
                      <td style={{ ...tdStyle(false, false), whiteSpace: "nowrap", color: isFullPaid ? "#166534" : "#64748b" }}>{order.est || "—"}</td>
                      {/* Payment Status */}
                      <td style={tdStyle(false, false)}>
                        <span style={{ 
                          background: order.customerPaymentStatus === "Paid In Full" ? "#dcfce7" : order.customerPaymentStatus === "UnPaid" ? "#fee2e2" : "#e0f2fe",
                          color: order.customerPaymentStatus === "Paid In Full" ? "#166534" : order.customerPaymentStatus === "UnPaid" ? "#991b1b" : "#075985",
                          padding: "4px 10px",
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 700,
                          whiteSpace: "nowrap"
                        }}>
                          {order.customerPaymentStatus || "—"}
                        </span>
                      </td>
                      {/* Commission % */}
                      <td style={{ ...tdStyle(false, false), fontWeight: 600 }}>
                        {order.commissionPercent != null ? `${order.commissionPercent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%` : "—"}
                      </td>
                      {/* Commission Total */}
                      <td style={{ ...tdStyle(false, false), color: isFullPaid ? "#166534" : "#0f172a", fontWeight: 600, position: "relative" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                          {order.commissionTotal != null ? `$${order.commissionTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                          <Tooltip content={(
                            <div style={{ textAlign: "left" }}>
                              <p style={{ fontWeight: 700, marginBottom: 6, color: "#0f172a" }}>Total Commission</p>
                              <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>The total commission earned for this order. This amount is projected based on the Quoted Order Total until the Final Order Total has been confirmed.</p>
                            </div>
                          )}>
                            <Info size={12} style={{ opacity: 0.5, cursor: "help" }} />
                          </Tooltip>
                        </div>
                      </td>
                      {/* Commission Balance Owed */}
                      <td style={{ ...tdStyle(false, false), color: isFullPaid ? "#166534" : "#dc2626", fontWeight: 600, position: "relative" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                          {order.commissionBalanceOwed != null ? `$${order.commissionBalanceOwed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                          <Tooltip content={(
                            <div style={{ textAlign: "left" }}>
                              <p style={{ fontWeight: 700, marginBottom: 6, color: "#0f172a" }}>Commission Balance Owed</p>
                              <p style={{ margin: "0 0 8px 0", fontSize: 12, color: "#475569" }}>The remaining commission expected for this order that has not yet been earned or paid.</p>
                              <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>While the order is in progress, this amount is projected. Once confirmed, this reflects the balance tied to outstanding payments.</p>
                            </div>
                          )}>
                            <Info size={12} style={{ opacity: 0.5, cursor: "help" }} />
                          </Tooltip>
                        </div>
                      </td>
                      {/* Commission Paid */}
                      <td style={{ ...tdStyle(false, false), color: isFullPaid ? "#166534" : "#16a34a", fontWeight: 600, position: "relative" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                          {order.commissionPaid != null ? `$${order.commissionPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                          {order.commissionPaymentHistory && order.commissionPaymentHistory.length > 0 && (
                            <Tooltip content={(
                              <div style={{ textAlign: "left" }}>
                                <h4 style={{ margin: "0 0 10px 0", fontSize: 13, fontWeight: 700, color: "#0f172a", borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                                  {order.product || "N/A"}
                                </h4>
                                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
                                  <tbody>
                                    <tr>
                                      <td style={{ padding: "4px 0", fontSize: 12, color: "#94a3b8" }}>Sales Order #:</td>
                                      <td style={{ padding: "4px 0", fontSize: 12, fontWeight: 700, color: "#1e293b", textAlign: "right" }}>{order.so || "N/A"}</td>
                                    </tr>
                                    <tr>
                                      <td style={{ padding: "4px 0", fontSize: 12, color: "#94a3b8" }}>Commission Total:</td>
                                      <td style={{ padding: "4px 0", fontSize: 12, fontWeight: 700, color: "#f97316", textAlign: "right" }}>
                                        ${(order.commissionTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td style={{ padding: "4px 0", fontSize: 12, color: "#94a3b8" }}>Commission Paid:</td>
                                      <td style={{ padding: "4px 0", fontSize: 12, fontWeight: 700, color: "#16a34a", textAlign: "right" }}>
                                        ${(order.commissionPaid || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>

                                <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: 10 }}>
                                  <p style={{ fontWeight: 700, marginBottom: 8, fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Payment History</p>
                                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    {order.commissionPaymentHistory.map((p, i) => (
                                      <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 20, fontSize: 12 }}>
                                        <span style={{ color: "#64748b" }}>{p.date}</span>
                                        <span style={{ fontWeight: 600, color: "#1e293b" }}>${p.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}>
                              <Info size={12} style={{ color: "#f97316", cursor: "help" }} />
                            </Tooltip>
                          )}
                        </div>
                      </td>
                      {/* Commission Due */}
                      <td style={{ ...tdStyle(false, false), color: isFullPaid ? "#166534" : "#f97316", fontWeight: 600, position: "relative" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                          {order.commissionDue != null ? `$${order.commissionDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                          <Tooltip content={(
                            <div style={{ textAlign: "left" }}>
                              <p style={{ fontWeight: 700, marginBottom: 6, color: "#0f172a" }}>Commission Due</p>
                              <p style={{ margin: "0 0 10px 0", fontSize: 12, color: "#475569" }}>The amount of commission currently pending payment to you.</p>
                              <p style={{ margin: "0 0 6px 0", fontSize: 12, fontWeight: 600, color: "#0f172a" }}>Commission is paid in two stages:</p>
                              <ol style={{ margin: "0 0 10px 0", paddingLeft: "18px", fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
                                <li><strong>After the customer deposit is received</strong></li>
                                <li><strong>After the final customer payment is received</strong></li>
                              </ol>
                              <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>This reflects what is owed to you right now but has not yet been paid.</p>
                            </div>
                          )}>
                            <Info size={12} style={{ opacity: 0.5, cursor: "help" }} />
                          </Tooltip>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      {/* Health */}
                      <td style={tdStyle(true, false)}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {hl && (
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: "#f97316",
                                flexShrink: 0,
                                boxShadow: "0 0 0 3px rgba(249,115,22,0.25)",
                                animation: "pulse 1.5s infinite",
                              }}
                            />
                          )}
                          <span
                            style={{
                              background: bg,
                              color,
                              padding: "4px 10px",
                              borderRadius: 20,
                              fontSize: 11,
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {order.health}
                          </span>
                        </div>
                      </td>

                      {/* SO */}
                      <td style={{ ...tdStyle(false, false), fontWeight: 700, color: "#0f172a" }}>
                        {order.so}
                      </td>

                      {/* CM Key */}
                      <td style={{ ...tdStyle(false, false), whiteSpace: "nowrap" }}>
                        {order.cmKey ? (
                          <a
                            href={`https://nextdaynutra.atlassian.net/browse/${order.cmKey}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#3b82f6",
                              fontWeight: 600,
                              textDecoration: "none",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {order.cmKey} <ExternalLink size={11} />
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Product */}
                      <td
                        style={{
                          ...tdStyle(false, false),
                          minWidth: 220,
                          color: "#334155",
                          lineHeight: "1.4",
                        }}
                      >
                        {order.product}
                      </td>

                      {/* Customer */}
                      <td
                        style={{
                          ...tdStyle(false, false),
                          fontWeight: 600,
                          color: "#334155",
                          cursor: "pointer",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          const m = filteredUsersList.find((c) => c.name === order.customer);
                          if (m) onSelectCustomer(m.id);
                        }}
                      >
                        <span className="customer-name-link">{order.customer}</span>
                        {order.customerNew > 0 && (
                          <span
                            style={{
                              marginLeft: 6,
                              background: "#f97316",
                              color: "#fff",
                              fontSize: 10,
                              padding: "2px 6px",
                              borderRadius: 8,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                            }}
                          >
                            <MessageSquare size={9} /> {order.customerNew}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={tdStyle(false, false)}>{order.status}</td>

                      {/* Qty */}
                      <td style={{ ...tdStyle(false, false), fontWeight: 600, width: 80 }}>
                        {order.qty}
                      </td>

                      {/* Start */}
                      <td
                        style={{ ...tdStyle(false, false), whiteSpace: "nowrap", color: "#64748b" }}
                      >
                        {order.start}
                      </td>

                      {/* EST */}
                      <td
                        style={{ ...tdStyle(false, false), whiteSpace: "nowrap", color: "#64748b" }}
                      >
                        {order.est}
                      </td>

                      {/* Days */}
                      <td
                        style={{
                          ...tdStyle(false, false),
                          fontWeight: 700,
                          color: "#0f172a",
                          width: 110,
                        }}
                      >
                        {order.days}
                      </td>
                    </>
                  )}

                  {/* Actions */}
                  {variant !== "agent" && (
                    <td style={{ ...tdStyle(false, true), width: 140, minWidth: 140 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleRow(order.id, orderKey);
                        }}
                        style={{
                          whiteSpace: "nowrap",
                          background: isExp ? "#f1f5f9" : hl ? "#f97316" : "#0073aa",
                          color: isExp ? "#334155" : "#ffffff",
                          border: "1px solid",
                          borderColor: isExp ? "#cbd5e1" : hl ? "#f97316" : "#0073aa",
                          padding: "6px 12px",
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: "pointer",
                          transition: "all 0.2s",
                          width: "100%",
                          textAlign: "center",
                        }}
                      >
                        {isExp ? "Hide Details" : hl ? "View New" : "Show Details"}
                      </button>
                    </td>
                  )}
                </tr>

                {/* Expanded row */}
                {isExp && (
                  <OrderRowExpanded
                    order={order}
                    isCompleted={isCompleted}
                    custId={custId}
                    colSpan={headers.length}
                    variant={variant}
                  />
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
