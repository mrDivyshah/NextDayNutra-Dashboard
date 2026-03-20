"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Users, Briefcase, Globe, Settings, Sparkles } from "lucide-react";
import { useNDNWebSocket, useNotifications } from "@/hooks/useNDNWebSocket";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import type { JiraAgent, JiraCustomer, NavSection } from "@/types/dashboard";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type DashboardPageFrameProps = {
  section: NavSection;
  activeLabel: string;
  sectionGroupLabel: string;
  children: React.ReactNode;
};

function sectionToPath(section: NavSection) {
  switch (section) {
    case "customers":
      return "/customer";
    case "agents":
      return "/agent";
    case "create-customer":
      return "/customer/create-customer-form";
    case "settings":
      return "/settings";
    case "multi-location":
      return "/multi-location";
    case "executive":
      return "/executive";
    default:
      return "/";
  }
}

export function DashboardPageFrame({
  section,
  activeLabel,
  sectionGroupLabel,
  children,
}: DashboardPageFrameProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string[]>(["dashboards-group"]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeUsersOpen, setActiveUsersOpen] = useState(false);
  const [customerCount, setCustomerCount] = useState(0);
  const [agentCount, setAgentCount] = useState(0);
  const { currentUser } = useCurrentUser();

  useEffect(() => {
    const cacheBuster = `&t=${Date.now()}`;
    Promise.all([
      fetch(`/api/jira/customers?type=customer${cacheBuster}`).then((r) => r.json() as Promise<JiraCustomer[]>),
      fetch(`/api/jira/customers?type=agent${cacheBuster}`).then((r) => r.json() as Promise<JiraAgent[]>),
    ])
      .then(([customers, agents]) => {
        setCustomerCount(Array.isArray(customers) ? customers.length : 0);
        setAgentCount(Array.isArray(agents) ? agents.length : 0);
      })
      .catch(() => {
        setCustomerCount(0);
        setAgentCount(0);
      });
  }, []);

  const { notifications: dbNotifications, unreadCount, addRealtimeNotification, markAllRead } =
    useNotifications(currentUser?.id || 0);

  const markRead = async () => {};

  const { connected, activeUsers } = useNDNWebSocket({
    userId: currentUser?.id || 0,
    name: currentUser?.name || "",
    role: currentUser?.role || "",
    onEvent: addRealtimeNotification,
    enabled: !!currentUser,
  });

  const navGroups = useMemo(
    () => [
      {
        key: "dashboards-group",
        label: "Dashboards",
        icon: LayoutDashboard,
        items: [
          { key: "customers" as NavSection, label: "Customer Dashboard", icon: Users, badge: customerCount },
          { key: "agents" as NavSection, label: "Agent Dashboard", icon: Briefcase, badge: agentCount },
          { key: "multi-location" as NavSection, label: "Multi location", icon: Globe },
          { key: "executive" as NavSection, label: "Executive", icon: Sparkles },
        ],
      }
      
    ],
    [customerCount, agentCount]
  );

  const toggleExpand = (key: string) =>
    setExpanded((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        gap: 0,
        padding: 0,
        background: "transparent",
      }}
    >
      <DashboardSidebar
        section={section === "create-customer" ? "customers" : section}
        setSection={(target) => router.push(sectionToPath(target))}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        expanded={expanded}
        toggleExpand={toggleExpand}
        navGroups={navGroups}
        currentUser={currentUser}
        activeUsers={activeUsers}
        activeUsersOpen={activeUsersOpen}
        setActiveUsersOpen={setActiveUsersOpen}
      />

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(20px)",
        }}
      >
        <TopBar
          activeLabel={activeLabel}
          sectionGroupLabel={sectionGroupLabel}
          search={search}
          setSearch={setSearch}
          connected={connected}
          notifOpen={notifOpen}
          setNotifOpen={setNotifOpen}
          unreadCount={unreadCount}
          dbNotifications={dbNotifications}
          markAllRead={markAllRead}
          markRead={markRead}
        />

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "auto",
            padding: "14px 14px 8px",
          }}
        >
          {children}
        </div>

        <div
          style={{
            textAlign: "center",
            padding: "0 0 12px",
            fontSize: 13,
            color: "#64748b",
            fontWeight: 500,
            flexShrink: 0,
          }}
        >
          © Copyright 2024 Next Day Nutra - All Rights Reserved.
        </div>
      </main>
    </div>
  );
}
