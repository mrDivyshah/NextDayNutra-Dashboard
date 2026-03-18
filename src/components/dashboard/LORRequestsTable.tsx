"use client";

import React from "react";
import type { LORRequest } from "@/types/dashboard";

interface LORRequestsTableProps {
  lorRequests: LORRequest[];
}

export function LORRequestsTable({ lorRequests }: LORRequestsTableProps) {
  if (!lorRequests || lorRequests.length === 0) return null;

  return (
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
        {/* ClipboardList icon inline as SVG */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#123e67"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <path d="M12 11h4" />
          <path d="M12 16h4" />
          <path d="M8 11h.01" />
          <path d="M8 16h.01" />
        </svg>
        LOR Requests
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
              {[
                "Type",
                "Summary",
                "Design Order Date",
                "Brand Type",
                "Status",
                "Quantity Ordered",
                "Quantity Delivered",
                "Design Delivery Date",
                "Label Size",
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "6px 10px",
                    textAlign: "left",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lorRequests.map((lor, li) => {
              const isLabel =
                lor.brandType?.toLowerCase().includes("label") ||
                lor.summary?.toLowerCase().includes("label");

              return (
                <tr key={li} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  {/* Type icon */}
                  <td
                    style={{
                      padding: "8px 10px",
                      textAlign: "center",
                      verticalAlign: "middle",
                    }}
                  >
                    {isLabel ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ display: "inline-block", verticalAlign: "middle" }}
                      >
                        <path d="m12 19 7-7 3 3-7 7-3-3Z" />
                        <path d="m18 13-1.5-7.5L4 2l3.5 12.5L13 18l5-5Z" />
                        <path d="m2 22 5-5" />
                        <path d="M12 11h.01" />
                      </svg>
                    ) : (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ display: "inline-block", verticalAlign: "middle" }}
                      >
                        <rect x="3" y="14" width="7" height="7" rx="1.5" />
                        <rect x="14" y="3" width="7" height="7" rx="1.5" />
                        <path d="M10 17.5h4v-11" />
                      </svg>
                    )}
                  </td>

                  <td
                    style={{
                      padding: "8px 10px",
                      color: "#334155",
                      maxWidth: 220,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={lor.summary || lor.brandType}
                  >
                    {lor.summary || lor.brandType || "—"}
                  </td>

                  <td style={{ padding: "8px 10px", color: "#64748b", whiteSpace: "nowrap" }}>
                    {lor.date || "—"}
                  </td>

                  <td style={{ padding: "8px 10px", color: "#64748b" }}>
                    {lor.brandType || "—"}
                  </td>

                  <td style={{ padding: "8px 10px" }}>
                    <span
                      style={{
                        color: "#123e67",
                        fontWeight: 600,
                        textDecoration: "underline",
                        cursor: "pointer",
                      }}
                    >
                      {lor.status}
                    </span>
                  </td>

                  <td
                    style={{
                      padding: "8px 10px",
                      fontWeight: 600,
                      color: "#0f172a",
                      textAlign: "center",
                    }}
                  >
                    {lor.qtyOrdered}
                  </td>

                  <td
                    style={{
                      padding: "8px 10px",
                      fontWeight: 600,
                      color: "#16a34a",
                      textAlign: "center",
                    }}
                  >
                    {lor.qtyDelivered}
                  </td>

                  <td style={{ padding: "8px 10px", color: "#64748b", whiteSpace: "nowrap" }}>
                    {lor.deliveryDate || "—"}
                  </td>

                  <td style={{ padding: "8px 10px", color: "#64748b" }}>
                    {lor.labelSize || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
