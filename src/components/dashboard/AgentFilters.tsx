"use client";

import React from "react";

type AgentFiltersProps = {
  customers: string[];
  searchCustomer: string;
  setSearchCustomer: (val: string) => void;
  paymentStatus: string;
  setPaymentStatus: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
};

export function AgentFilters({
  customers,
  searchCustomer,
  setSearchCustomer,
  paymentStatus,
  setPaymentStatus,
  startDate,
  setStartDate,
  endDate,
  setEndDate
}: AgentFiltersProps) {
  return (
    <div className="filters-row" style={{ 
      backgroundColor: '#ffffff', 
      padding: '15px 25px', 
      borderRadius: 6, 
      display: 'flex', 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 15, 
      border: '1px solid #e1e8ed', 
      boxShadow: '0 2px 5px rgba(0, 0, 0, 0.02)',
      marginBottom: 20
    }}>
      <select 
        className="filter-input" 
        style={{ flex: 1.5, minWidth: 200, padding: '10px', borderRadius: 6, borderColor: '#e1e8ed' }}
        value={searchCustomer}
        onChange={(e) => setSearchCustomer(e.target.value)}
      >
        <option value="">-- Search Customer --</option>
        {customers.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <select 
        className="filter-input" 
        style={{ flex: 1, minWidth: 150, padding: '10px', borderRadius: 6, borderColor: '#e1e8ed' }}
        value={paymentStatus}
        onChange={(e) => setPaymentStatus(e.target.value)}
      >
        <option value="All Payments">All Payments</option>
        <option value="Paid">Paid</option>
        <option value="Pending">Pending</option>
      </select>
      <input 
        type="date" 
        className="filter-input" 
        style={{ flex: 1, minWidth: 150, padding: '10px', borderRadius: 6, borderColor: '#e1e8ed' }} 
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
      />
      <input 
        type="date" 
        className="filter-input" 
        style={{ flex: 1, minWidth: 150, padding: '10px', borderRadius: 6, borderColor: '#e1e8ed' }} 
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
      />
    </div>
  );
}
