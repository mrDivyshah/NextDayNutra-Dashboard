"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { CommonDashboardContent } from "./CommonDashboardContent";
import { useDashboardData } from "@/hooks/useDashboardData";

export function InternalTab() {
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
    stats
  } = useDashboardData('internal');

  return (
    <div className="main-layout">
      <Sidebar 
        viewMode="internal" 
        selectedCustomerId={selectedCustomerId} 
        onCustomerChange={setSelectedCustomerId} 
        isLoading={isLoadingUsers || isLoadingJiraData} 
        filteredUsersList={filteredUsersList} 
        selectedCustomer={selectedCustomer} 
      />
      <main className="content-area">
        <CommonDashboardContent 
          title="Internal Company Dashboard" 
          stats={stats} 
          isLoadingOrders={isLoadingOrders} 
          activeOrders={activeOrders} 
          completedOrders={completedOrders} 
          selectedCustomer={selectedCustomer} 
          onCustomerSelect={setSelectedCustomerId} 
          liveCustomers={liveCustomers}
          filteredUsersList={filteredUsersList} 
        />
      </main>
    </div>
  );
}
