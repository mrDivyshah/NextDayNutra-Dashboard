"use client";

import React, { useState } from "react";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Order, Customer } from "@/types/dashboard";
import { OrderFilesPreview } from "./OrderFiles";
import AssetVault from "@/components/AssetVault";

interface OrdersTableProps {
  orders: Order[];
  isActive: boolean;
  selectedCustomer: Customer | null;
  onCustomerSelect: (id: number) => void;
  liveCustomers: Customer[];
  filteredUsersList: Customer[];
}

export function OrdersTable({ 
  orders, 
  isActive, 
  selectedCustomer, 
  onCustomerSelect,
  liveCustomers,
  filteredUsersList 
}: OrdersTableProps) {
  const [expandedRows, setExpandedRows] = useState<number[]>([]);

  const resolveCustomerId = (customerName: string) => {
    const normalized = customerName.trim().toLowerCase();
    const match = liveCustomers.find((customer) => customer.name.trim().toLowerCase() === normalized);
    return match?.users?.[0]?.id ?? match?.id ?? 0;
  };

  const toggleRow = (id: number) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const renderIcon = (iconType: string) => {
    switch (iconType) {
      case "clock":
        return <Clock size={16} />;
      case "check":
        return <CheckCircle size={16} />;
      case "alert":
        return <AlertCircle size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Order Health ▼</th>
            <th>Sales Order #</th>
            <th>CM Key</th>
            <th>Product Name</th>
            <th>Customer</th>
            <th>Status</th>
            <th>Quantity Ordered</th>
            <th>Start Date</th>
            <th>EST Ship Date</th>
            <th>Days in Production</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const isExpanded = expandedRows.includes(order.id);
            const resolvedCustomerId = resolveCustomerId(order.customer || "");
            return (
              <React.Fragment key={order.id}>
                <tr className={order.highlight ? "highlight" : ""}>
                  <td>
                    <span className={`status-pill ${order.healthColor}`}>
                      {order.health}
                    </span>
                  </td>
                  <td>{order.so}</td>
                  <td>
                    {order.cmKey ? (
                      <a
                        href={`https://nextdaynutra.atlassian.net/browse/${order.cmKey}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#0073aa', textDecoration: 'underline', fontWeight: 600 }}
                      >
                        {order.cmKey}
                      </a>
                    ) : '-'}
                  </td>
                  <td>{order.product}</td>
                  <td
                    style={{ cursor: 'pointer', color: '#1a4f8a', fontWeight: 500 }}
                    onClick={() => {
                      const match = filteredUsersList.find(
                        (c: Customer) => c.name === order.customer
                      );
                      if (match) onCustomerSelect(match.id);
                    }}
                  >
                    {order.customer || '-'}
                    {order.customerNew > 0 && (
                      <span style={{
                        marginLeft: 6, background: '#f07931', color: '#fff',
                        fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 10
                      }}>
                        💬 {order.customerNew} new
                      </span>
                    )}
                  </td>
                  <td>{order.status}</td>
                  <td>{order.qty}</td>
                  <td>{order.start}</td>
                  <td>{order.est}</td>
                  <td>{order.days}</td>
                  <td>
                    <button
                      className="action-btn"
                      onClick={() => toggleRow(order.id)}
                    >
                      {isExpanded ? "Hide Details" : "Show Details"}
                    </button>
                  </td>
                </tr>

                {isExpanded && (
                  <tr className="details-row">
                    <td colSpan={11}>
                      <div className="sub-row-content">
                        {order.notes.length > 0 ? (
                          <div className="order-notes-box">
                            <strong>📝 Order Notes</strong>
                            <ul>
                              {order.notes.map((note, idx) => {
                                const dateMatch = note.match(/^(.*? - )/);
                                const renderNote = dateMatch ? (
                                  <>
                                    <strong>{dateMatch[1]}</strong>
                                    {note.slice(dateMatch[1].length)}
                                  </>
                                ) : (
                                  note
                                );

                                return <li key={idx}>{renderNote}</li>;
                              })}
                            </ul>
                          </div>
                        ) : (
                          <p
                            style={{ color: "#888", fontStyle: "italic" }}
                          >
                            No logs available for this order.
                          </p>
                        )}

                        <div className="quantity-info">
                          <p>
                            <strong>Initial Inventory:</strong>{" "}
                            {order.initialInv}
                            <br />
                            <strong>Quantity Delivered:</strong>{" "}
                            {order.deliveredInv}
                            <br />
                            <strong>Quantity Remaining:</strong>{" "}
                            {order.remainingInv}
                          </p>

                          <OrderFilesPreview
                            orderId={(order.cmKey || order.so).toLowerCase()}
                            hideEmptyState={!isActive}
                          />

                          {isActive && resolvedCustomerId > 0 && (
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
                              <AssetVault
                                orderId={(order.cmKey || order.so).toLowerCase()}
                                customerId={resolvedCustomerId}
                                isAdmin={true}
                                mode="button"
                              />
                            </div>
                          )}
                          {isActive && resolvedCustomerId <= 0 && (
                            <p style={{ marginTop: 8, fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>
                              Upload unavailable until this order is matched to a WordPress customer.
                            </p>
                          )}
                        </div>

                        {order.lorRequests.length > 0 ? (
                          <>
                            <strong style={{ fontSize: 14 }}>
                              LOR Requests:
                            </strong>
                            <table className="details-table">
                              <thead>
                                <tr>
                                  <th>Design Order Date</th>
                                  <th>Brand Type</th>
                                  <th>Status</th>
                                  <th>Quantity Ordered</th>
                                  <th>Quantity Delivered</th>
                                  <th>Design Delivery Date</th>
                                  <th>Label Size</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.lorRequests.map((req) => (
                                  <tr key={req.id}>
                                    <td>{req.date}</td>
                                    <td>{req.brandType}</td>
                                    <td>{req.status}</td>
                                    <td>{req.qtyOrdered}</td>
                                    <td>{req.qtyDelivered}</td>
                                    <td>{req.deliveryDate}</td>
                                    <td>{req.labelSize}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </>
                        ) : (
                          <p style={{ fontStyle: "italic" }}>
                            No design orders available.
                          </p>
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
}
