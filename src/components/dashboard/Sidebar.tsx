"use client";

import React, { useState } from "react";
import { Plus, ChevronDown, ChevronUp, Mail, Trash2 } from "lucide-react";
import { Customer, CustomerUser, ViewMode } from "@/types/dashboard";

interface SidebarProps {
  viewMode: ViewMode;
  selectedCustomerId: number | null;
  onCustomerChange: (id: number | null) => void;
  isLoading: boolean;
  filteredUsersList: Customer[];
  selectedCustomer: Customer | null;
}

export function Sidebar({
  viewMode,
  selectedCustomerId,
  onCustomerChange,
  isLoading,
  filteredUsersList,
  selectedCustomer
}: SidebarProps) {
  const [expandedUserPanels, setExpandedUserPanels] = useState<number[]>([]);

  const toggleUserPanel = (id: number) => {
    setExpandedUserPanels((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <h3>Customers Workspace</h3>
        <nav className="sidebar-nav">
          <button className="sidebar-nav-btn">
            <Plus size={18} /> Create a New Customer
          </button>
          <button className="sidebar-nav-btn">
            <Plus size={18} /> Create an Order
          </button>
          <button className="sidebar-nav-btn">
            <Plus size={18} /> Create a Lead in Brevo
          </button>
        </nav>
      </div>

      {viewMode !== 'internal' && (
        <div className="sidebar-group">
          <div className="group-label">
            {viewMode === 'agent' ? 'Select Agent' : 'Select Customer'}
          </div>
          <select
            className="customer-select"
            value={selectedCustomerId ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              onCustomerChange(val === "" ? null : Number(val));
            }}
            disabled={isLoading}
          >
            <option value="">
              {isLoading
                ? 'Loading...'
                : (viewMode === 'agent' ? '-- All Agents --' : '-- All Customers --')}
            </option>
            {filteredUsersList.map((c: Customer) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedCustomer && (
        <div className="customer-card">
          <div className="customer-title-row">
            <h4>{selectedCustomer.name}</h4>
          </div>

          <div className="users-section">
            <h5>Dashboard Users</h5>
            {selectedCustomer.users.length === 0 ? (
              <p style={{ fontSize: 13, color: "#666" }}>
                No users linked yet.
              </p>
            ) : (
              selectedCustomer.users.map((u: CustomerUser) => {
                const isPanelExpanded = expandedUserPanels.includes(u.id);
                return (
                  <div className="user-item" key={u.id}>
                    <div
                      className="user-item-header"
                      onClick={() => toggleUserPanel(u.id)}
                    >
                      <div>
                        <span className="user-item-name">{u.name}</span>
                        <span className="user-item-role">{u.role}</span>
                      </div>
                      {isPanelExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>

                    {isPanelExpanded && (
                      <div className="user-item-details">
                        <div className="user-item-email">
                          <Mail size={14} /> {u.email}
                        </div>
                        <div className="user-item-actions">
                          <button className="action-sm-btn">Edit Email</button>
                          <button className="action-sm-btn">Reset Pass</button>
                          <button
                            className="action-sm-btn"
                            style={{ backgroundColor: "#ef4444" }}
                          >
                            <Trash2 size={13} style={{ display: "inline" }} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="add-user-section">
            <h5>Add / Link User</h5>
            <div className="add-user-form">
              <input
                type="text"
                placeholder="Full name (optional)"
                className="form-input"
              />
              <input
                type="email"
                placeholder="email@example.com"
                className="form-input"
              />
              <button
                className="action-btn"
                style={{ width: "fit-content", marginTop: 8 }}
              >
                Add / Link
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
