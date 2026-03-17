"use client";

import React from "react";
import { Plus } from "lucide-react";
import { AgentSummary, Customer, ViewMode } from "@/types/dashboard";

interface AgentSidebarProps {
  summary: AgentSummary;
  viewMode: ViewMode;
  selectedCustomerId: number | null;
  onCustomerChange: (id: number | null) => void;
  isLoading: boolean;
  filteredUsersList: Customer[];
  selectedCustomer: Customer | null;
}

export function AgentSidebar({
  summary,
  viewMode,
  selectedCustomerId,
  onCustomerChange,
  isLoading,
  filteredUsersList,
  selectedCustomer
}: AgentSidebarProps) {

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <h3 style={{ border: 'none', marginBottom: 10, fontSize: 24, textAlign: 'center' }}>Agent Dashboard</h3>
        <button 
          className="action-btn" 
          style={{ 
            width: '100%', 
            backgroundColor: '#F05323', 
            padding: '12px', 
            borderRadius: 6, 
            fontWeight: 700,
            fontSize: 16,
            marginBottom: 20
          }}
        >
          <Plus size={18} style={{ display: 'inline', marginRight: 5 }} /> Create New Agent
        </button>
      </div>

      <div className="sidebar-group" style={{ marginBottom: 25 }}>
        <div className="group-label" style={{ fontSize: 13, fontWeight: 600, color: '#123E67', marginBottom: 8, textTransform: 'uppercase' }}>
          Agent Selection
        </div>
        <select
          className="customer-select"
          value={selectedCustomerId ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            onCustomerChange(val === "" ? null : Number(val));
          }}
          disabled={isLoading}
          style={{ padding: '10px', borderRadius: 6, borderColor: '#e1e8ed' }}
        >
          <option value="">
            {isLoading
              ? 'Loading...'
              : '-- All Agents --'}
          </option>
          {filteredUsersList.map((c: Customer) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        <div className="summary-box" style={{ 
          backgroundColor: '#406188', 
          padding: '15px', 
          borderRadius: 6, 
          color: '#FFF',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <label style={{ display: 'block', fontSize: 10, color: '#e0e1e1', fontWeight: 600, marginBottom: 5, textTransform: 'uppercase' }}>
            TOTAL PAID TO DATE
          </label>
          <span style={{ fontSize: 30, fontWeight: 700 }}>{formatCurrency(summary.paid)}</span>
        </div>

        <div className="summary-box" style={{ 
          backgroundColor: '#406188', 
          padding: '15px', 
          borderRadius: 6, 
          color: '#FFF',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <label style={{ display: 'block', fontSize: 10, color: '#e0e1e1', fontWeight: 600, marginBottom: 5, textTransform: 'uppercase' }}>
            NEXT PAYMENT PENDING
          </label>
          <span style={{ fontSize: 30, fontWeight: 700 }}>{formatCurrency(summary.pending)}</span>
        </div>

        <div className="summary-box" style={{ 
          backgroundColor: '#406188', 
          padding: '15px', 
          borderRadius: 6, 
          color: '#FFF',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <label style={{ display: 'block', fontSize: 10, color: '#e0e1e1', fontWeight: 600, marginBottom: 5, textTransform: 'uppercase' }}>
            TOTAL COMMISSION BALANCE
          </label>
          <span style={{ fontSize: 30, fontWeight: 700 }}>{formatCurrency(summary.total_owed)}</span>
        </div>
      </div>
    </aside>
  );
}
