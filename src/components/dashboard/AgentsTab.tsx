"use client";

import React from "react";
import { AgentSidebar } from "./AgentSidebar";
import { AgentFilters } from "./AgentFilters";
import { AgentHierarchyView } from "./AgentHierarchyView";
import { useDashboardData } from "@/hooks/useDashboardData";

export function AgentsTab() {
  const {
    selectedCustomerId,
    setSelectedCustomerId,
    liveCustomers,
    filteredUsersList,
    selectedCustomer,
    activeOrders,
    completedOrders,
    isLoadingUsers,
    isLoadingJiraData,
    isLoadingOrders,
    agentSummary
  } = useDashboardData('agent');

  const [searchCustomer, setSearchCustomer] = React.useState('');
  const [paymentStatus, setPaymentStatus] = React.useState('All Payments');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');

  // Reset customer search whenever agent changes
  React.useEffect(() => {
    setSearchCustomer('');
  }, [selectedCustomerId]);

  // Extract unique customers from all orders for the dropdown
  const allOrders = React.useMemo(() => [...activeOrders, ...completedOrders], [activeOrders, completedOrders]);
  
  const uniqueCustomers = React.useMemo(() => {
    let sourceOrders = allOrders;
    
    // If an agent is selected in the sidebar, only show customers belonging to that agent
    if (selectedCustomer && selectedCustomer.isAgent) {
      sourceOrders = allOrders.filter(o => o.agentName === selectedCustomer.name);
    }
    
    const custs = new Set(sourceOrders.map(o => o.customer).filter(Boolean));
    return Array.from(custs).sort();
  }, [allOrders, selectedCustomer]);

  // Apply filters
  const filteredOrders = React.useMemo(() => {
    return allOrders.filter(order => {
      // 1. Customer Filter
      if (searchCustomer && searchCustomer !== '-- Search Customer --' && order.customer !== searchCustomer) {
        return false;
      }
      
      // 2. Payment Status Filter
      if (paymentStatus === 'Paid') {
        if (!order.customerPaymentStatus || order.customerPaymentStatus !== 'Paid In Full') return false;
      } else if (paymentStatus === 'Pending') {
        if (!order.customerPaymentStatus || order.customerPaymentStatus !== 'UnPaid') return false;
      }

      // 3. Date Filters (comparing against order.start or order.est, usually 'est' ship date or order 'start' date? Assuming start date)
      if (startDate) {
        const orderDate = new Date(order.start);
        const sDate = new Date(startDate);
        if (!isNaN(orderDate.getTime()) && orderDate < sDate) return false;
      }
      
      if (endDate) {
        const orderDate = new Date(order.start);
        const eDate = new Date(endDate);
        if (!isNaN(orderDate.getTime()) && orderDate > eDate) return false;
      }

      return true;
    });
  }, [allOrders, searchCustomer, paymentStatus, startDate, endDate]);

  return (
    <div className="main-layout">
      <AgentSidebar 
        summary={agentSummary}
        viewMode="agent" 
        selectedCustomerId={selectedCustomerId} 
        onCustomerChange={setSelectedCustomerId} 
        isLoading={isLoadingUsers || isLoadingJiraData} 
        filteredUsersList={filteredUsersList} 
        selectedCustomer={selectedCustomer} 
      />
      <main className="content-area" style={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
        <AgentFilters 
          customers={uniqueCustomers}
          searchCustomer={searchCustomer}
          setSearchCustomer={setSearchCustomer}
          paymentStatus={paymentStatus}
          setPaymentStatus={setPaymentStatus}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />
        {isLoadingOrders ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#64748b', fontSize: 15, fontWeight: 500 }}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="40" 
              height="40" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#cbd5e1" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              style={{ marginBottom: 16, marginTop: 40, animation: 'pulse 2s infinite' }}
            >
              <rect x="3" y="3" width="7" height="9" rx="1"></rect>
              <rect x="14" y="3" width="7" height="5" rx="1"></rect>
              <rect x="14" y="12" width="7" height="9" rx="1"></rect>
              <rect x="3" y="16" width="7" height="5" rx="1"></rect>
            </svg>
            <p style={{ color: '#fff' }}>Syncing Latest Data...</p>
          </div>
        ) : (
          <AgentHierarchyView orders={filteredOrders} liveCustomers={liveCustomers} />
        )}
      </main>
    </div>
  );
}
