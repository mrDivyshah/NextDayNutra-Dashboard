"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CustomersTab } from "./CustomersTab";
import { AgentsTab } from "./AgentsTab";
import { InternalTab } from "./InternalTab";

export default function DashboardPageClient() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "#fff" }}>Loading...</div>}>
      <DashboardSwitcher />
    </Suspense>
  );
}

function DashboardSwitcher() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "customers";

  switch (currentTab) {
    case "agents":
      return <AgentsTab />;
    case "internal":
      return <InternalTab />;
    case "customers":
    default:
      return <CustomersTab />;
  }
}
