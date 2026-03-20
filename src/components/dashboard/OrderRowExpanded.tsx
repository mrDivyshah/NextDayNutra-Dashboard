"use client";

import React from "react";
import { LayoutDashboard, Briefcase } from "lucide-react";
import type { Order } from "@/types/dashboard";
import { LORRequestsTable } from "./LORRequestsTable";
import AssetVault from "@/components/AssetVault";
import { OrderFilesPreview } from "@/components/dashboard/OrderFiles";

interface OrderRowExpandedProps {
  order: Order;
  isCompleted: boolean;
  custId: number;
  colSpan: number;
  variant?: "default" | "agent";
}

function OrderRowExpandedInner({ order, isCompleted, custId, colSpan, variant = "default" }: OrderRowExpandedProps) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ padding: "0 0 8px" }}>
        <div
          className="expanded-row-container"
          style={{
            background: "#f8fafc",
            borderRadius: 12,
            margin: "0 2px",
            padding: 20,
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: variant === "agent" ? "1fr" : "1fr 1fr",
              gap: 16,
              marginBottom: variant === "agent" ? 0 : 16,
            }}
          >
            {/* Order Notes */}
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: 16,
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#0f172a",
                  marginBottom: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <LayoutDashboard size={14} color="#123e67" /> Order Notes
              </div>
              {order.notes.length > 0 ? (
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 18,
                    listStyleType: "disc",
                    color: "#475569",
                    fontSize: 13,
                    lineHeight: "1.7",
                  }}
                >
                  {order.notes.map((n, i) => {
                    // Regex for bolding dates or timestamps at start (e.g., 2026-03-03 or 10/25 -)
                    const datePattern = /^(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2})(\s*[-:]\s*)?/;
                    const match = n.match(datePattern);
                    
                    return (
                      <li key={i} style={{ marginBottom: 6 }}>
                        {match ? (
                          <>
                            <strong style={{ color: "#0f172a" }}>{match[0]}</strong>
                            {n.substring(match[0].length)}
                          </>
                        ) : n}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p style={{ fontSize: 13, color: "#94a3b8", fontStyle: "italic", margin: 0 }}>
                  No notes recorded.
                </p>
              )}
            </div>

            {/* Inventory Details */}
            {variant !== "agent" && (
              <div
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: 16,
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#0f172a",
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Briefcase size={14} color="#123e67" /> Inventory Details
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  {(
                    [
                      ["Initial Inventory", order.initialInv, "#0f172a"],
                      ["Quantity Delivered", order.deliveredInv, "#16a34a"],
                      ["Quantity Remaining", order.remainingInv, "#ea580c"],
                    ] as [string, number, string][]
                  ).map(([lbl, val, col]) => (
                    <div
                      key={lbl}
                      style={{
                        flex: 1,
                        background: "#f8fafc",
                        borderRadius: 8,
                        padding: "10px 8px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          color: "#64748b",
                          textTransform: "uppercase",
                          fontWeight: 600,
                          marginBottom: 4,
                        }}
                      >
                        {lbl}
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: col }}>{val}</div>
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
            )}
          </div>

          {/* LOR Requests table */}
          {variant !== "agent" && <LORRequestsTable lorRequests={order.lorRequests} />}
        </div>
      </td>
    </tr>
  );
}

export const OrderRowExpanded = React.memo(OrderRowExpandedInner);
