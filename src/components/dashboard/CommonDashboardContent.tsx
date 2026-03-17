"use client";

import React, { useState } from "react";
import { DashboardHeader } from "./DashboardHeader";
import { StatusCards } from "./StatusCards";
import { OrdersTable } from "./OrdersTable";
import { Order, Customer, ViewMode } from "@/types/dashboard";

interface CommonDashboardContentProps {
  title: string;
  stats: {
    countOnTrack: number;
    countOffTrack: number;
    countAtRisk: number;
    countWhiteLabel: number;
  };
  isLoadingOrders: boolean;
  activeOrders: Order[];
  completedOrders: Order[];
  selectedCustomer: Customer | null;
  onCustomerSelect: (id: number) => void;
  liveCustomers: Customer[];
  filteredUsersList: Customer[];
}

export function CommonDashboardContent({
  title,
  stats,
  isLoadingOrders,
  activeOrders,
  completedOrders,
  selectedCustomer,
  onCustomerSelect,
  liveCustomers,
  filteredUsersList
}: CommonDashboardContentProps) {
  const [ordersTab, setOrdersTab] = useState<'active' | 'completed'>('active');

  return (
    <>
      <DashboardHeader title={title} />

      <div className="filters-row">
        <input
          type="text"
          className="filter-input"
          placeholder="Search Sales Order #"
        />
        <input
          type="text"
          className="filter-input"
          placeholder="Search Product Name"
        />
        <select className="filter-input">
          <option>Workflow Status</option>
        </select>
        <select className="filter-input">
          <option>Order Health</option>
        </select>
      </div>

      <StatusCards 
        onTrack={stats.countOnTrack} 
        offTrack={stats.countOffTrack} 
        atRisk={stats.countAtRisk} 
        whiteLabel={stats.countWhiteLabel} 
      />

      {isLoadingOrders ? (
        <div style={{ padding: 40, textAlign: "center", color: "#666" }}>
          Loading live Jira orders...
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid #e8ecf0' }}>
            <button
              onClick={() => setOrdersTab('active')}
              style={{
                padding: '10px 22px',
                fontWeight: 600,
                fontSize: 14,
                border: 'none',
                borderBottom: ordersTab === 'active' ? '3px solid #1a4f8a' : '3px solid transparent',
                background: 'none',
                color: ordersTab === 'active' ? '#1a4f8a' : '#888',
                cursor: 'pointer',
                marginBottom: -2,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              Active Orders
              <span style={{
                background: ordersTab === 'active' ? '#1a4f8a' : '#bbb',
                color: '#fff', borderRadius: 999, padding: '1px 9px', fontSize: 12
              }}>{activeOrders.length}</span>
            </button>
            <button
              onClick={() => setOrdersTab('completed')}
              style={{
                padding: '10px 22px',
                fontWeight: 600,
                fontSize: 14,
                border: 'none',
                borderBottom: ordersTab === 'completed' ? '3px solid #1a4f8a' : '3px solid transparent',
                background: 'none',
                color: ordersTab === 'completed' ? '#1a4f8a' : '#888',
                cursor: 'pointer',
                marginBottom: -2,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              Completed Orders
              <span style={{
                background: ordersTab === 'completed' ? '#1a4f8a' : '#bbb',
                color: '#fff', borderRadius: 999, padding: '1px 9px', fontSize: 12
              }}>{completedOrders.length}</span>
            </button>
          </div>

          <div className="orders-table-wrapper">
            {ordersTab === 'active' ? (
              activeOrders.length > 0
                ? <OrdersTable 
                    orders={activeOrders} 
                    isActive={true} 
                    selectedCustomer={selectedCustomer} 
                    onCustomerSelect={onCustomerSelect} 
                    liveCustomers={liveCustomers}
                    filteredUsersList={filteredUsersList}
                  />
                : <p style={{ color: "#777", marginTop: 10, padding: '0 24px' }}>No active orders found.</p>
            ) : (
              completedOrders.length > 0
                ? <OrdersTable 
                    orders={completedOrders} 
                    isActive={false} 
                    selectedCustomer={selectedCustomer} 
                    onCustomerSelect={onCustomerSelect} 
                    liveCustomers={liveCustomers}
                    filteredUsersList={filteredUsersList}
                  />
                : <p style={{ color: "#777", marginTop: 10, padding: '0 24px' }}>No completed orders found.</p>
            )}
          </div>
        </>
      )}
    </>
  );
}
