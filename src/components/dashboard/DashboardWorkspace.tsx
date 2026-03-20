"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Users, Briefcase, Globe, Sparkles } from "lucide-react";
import { signOut } from "next-auth/react";
import { useNDNWebSocket, useNotifications, useOrderHighlights } from "@/hooks/useNDNWebSocket";
import type { WSEvent } from "@/hooks/useNDNWebSocket";
import type { Order, Customer, NavSection, JiraCustomer, JiraAgent } from "@/types/dashboard";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { CustomerOrdersView } from "@/components/dashboard/CustomerOrdersView";
import { AgentHierarchyView } from "@/components/dashboard/AgentHierarchyView";
import { SettingsSection } from "@/components/dashboard/SettingsSection";
import { CreateCustomerView } from "@/components/dashboard/CreateCustomerView";
import { useCurrentUser } from "@/hooks/useCurrentUser";

void signOut;

type DashboardWorkspaceProps = {
  initialSection: NavSection;
  homeTitle?: boolean;
};

const DASHBOARD_CACHE_TTL_MS = 5 * 60 * 1000;

type JiraDirectoryCache = {
  customers: JiraCustomer[];
  agents: JiraAgent[];
  fetchedAt: number;
};

type OrdersCacheEntry = {
  activeOrders: Order[];
  completedOrders: Order[];
  fetchedAt: number;
};

let jiraDirectoryCache: JiraDirectoryCache | null = null;
const ordersCache = new Map<string, OrdersCacheEntry>();

function isFresh(timestamp: number) {
  return Date.now() - timestamp < DASHBOARD_CACHE_TTL_MS;
}

function getCachedJiraDirectory() {
  return jiraDirectoryCache && isFresh(jiraDirectoryCache.fetchedAt) ? jiraDirectoryCache : null;
}

function getOrdersRequestUrl(
  viewMode: "client" | "agent" | "internal",
  selectedCustomer: Customer | null,
  lockedEntityName?: string | null
) {
  let url = `/api/jira/orders?view=${viewMode}`;
  const selectedName = selectedCustomer?.name.trim() || lockedEntityName?.trim();

  if (viewMode === "client" && selectedName) {
    url += `&customerName=${encodeURIComponent(selectedName)}`;
  } else if (viewMode === "agent" && selectedName) {
    url += `&agentName=${encodeURIComponent(selectedName)}`;
  } else if (viewMode === "client" || viewMode === "agent") {
    url = `/api/jira/orders?view=internal`;
  }

  return url;
}

function getCachedOrders(url: string) {
  const cached = ordersCache.get(url);
  return cached && isFresh(cached.fetchedAt) ? cached : null;
}

function normalizeValue(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

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

export function DashboardWorkspace({
  initialSection,
  homeTitle = false,
}: DashboardWorkspaceProps) {
  const router = useRouter();
  const initialViewMode = initialSection === "agents" ? "agent" : initialSection === "internal" ? "internal" : "client";
  const initialOrdersUrl = getOrdersRequestUrl(initialViewMode, null);
  const initialJiraDirectory = getCachedJiraDirectory();
  const initialOrders = getCachedOrders(initialOrdersUrl);
  const [section, setSection] = useState<NavSection>(initialSection);
  const [expanded, setExpanded] = useState<string[]>(["dashboards-group"]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [activeJiraCustomers, setActiveJiraCustomers] = useState<JiraCustomer[]>(() => initialJiraDirectory?.customers ?? []);
  const [activeJiraAgents, setActiveJiraAgents] = useState<JiraAgent[]>(() => initialJiraDirectory?.agents ?? []);
  const [isLoadingJira, setIsLoadingJira] = useState(() => !initialJiraDirectory);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [ordersState, setOrdersState] = useState(() => ({
    key: initialOrdersUrl,
    activeOrders: initialOrders?.activeOrders ?? [],
    completedOrders: initialOrders?.completedOrders ?? [],
  }));
  const [isLoadingOrders, setIsLoadingOrders] = useState(() => !initialOrders);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Order; direction: "asc" | "desc" } | null>(null);
  const [activeUsersOpen, setActiveUsersOpen] = useState(false);
  const { currentUser } = useCurrentUser();
  const isCustomerScopedUser = ["customer", "customer_team"].includes(currentUser?.role || "");
  const isAgentScopedUser = currentUser?.role === "agent";
  const lockedSection: NavSection | null = isCustomerScopedUser ? "customers" : isAgentScopedUser ? "agents" : null;

  const { markHighlighted, markRead, isHighlighted } = useOrderHighlights([]);
  const { notifications: dbNotifications, unreadCount, addRealtimeNotification, markAllRead } =
    useNotifications(currentUser?.id || 0);

  const handleWSEvent = useCallback(
    (event: WSEvent) => {
      addRealtimeNotification(event);
      if (event.type === "file_uploaded" || event.type === "comment_posted") {
        const orderId = event.payload.orderId as string;
        if (orderId) markHighlighted(orderId);
      }
    },
    [addRealtimeNotification, markHighlighted]
  );

  const { connected, activeUsers } = useNDNWebSocket({
    userId: currentUser?.id || 0,
    name: currentUser?.name || "",
    role: currentUser?.role || "",
    onEvent: handleWSEvent,
    enabled: !!currentUser,
  });

  const requestSort = useCallback((key: keyof Order) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  }, [sortConfig]);

  const effectiveSection = lockedSection ?? section;
  const viewMode = effectiveSection === "agents" ? "agent" : effectiveSection === "internal" ? "internal" : "client";

  useEffect(() => {
    const cachedDirectory = getCachedJiraDirectory();
    if (cachedDirectory) {
      jiraDirectoryCache = cachedDirectory;
      return;
    }

    queueMicrotask(() => setIsLoadingJira(true));
    const cacheBuster = `&t=${Date.now()}`;
    Promise.all([
      fetch(`/api/jira/customers?type=customer${cacheBuster}`).then((r) => r.json()),
      fetch(`/api/jira/customers?type=agent${cacheBuster}`).then((r) => r.json()),
    ])
      .then(([customers, agents]) => {
        const nextCustomers = Array.isArray(customers) ? customers : [];
        const nextAgents = Array.isArray(agents) ? agents : [];
        jiraDirectoryCache = {
          customers: nextCustomers,
          agents: nextAgents,
          fetchedAt: Date.now(),
        };
        setActiveJiraCustomers(nextCustomers);
        setActiveJiraAgents(nextAgents);
      })
      .catch(() => {
        setActiveJiraCustomers([]);
        setActiveJiraAgents([]);
      })
      .finally(() => setIsLoadingJira(false));
  }, []);

  const filteredUsersList = useMemo((): Customer[] => {
    if (viewMode === "agent") {
      const baseAgents = activeJiraAgents.map((a, i) => ({
        id: -(i + 1001),
        name: a.name,
        jiraId: a.jiraId,
        users: [],
        isAgent: true,
      }));

      if (isAgentScopedUser) {
        const currentUserName = normalizeValue(currentUser?.name);
        const currentUserJiraId = normalizeValue(currentUser?.jiraId);

        return baseAgents.filter(
          (agent) =>
            normalizeValue(agent.name) === currentUserName ||
            (currentUserJiraId && normalizeValue(agent.jiraId) === currentUserJiraId)
        );
      }

      return baseAgents;
    }

    if (viewMode === "internal") return [];

    const baseCustomers = activeJiraCustomers.map((item, i) => ({
      id: -(i + 1),
      name: item.name,
      jiraId: item.jiraId,
      users: [],
      isAgent: false,
      agent: item.agent,
    }));

    if (isCustomerScopedUser) {
      const currentCompanyName = normalizeValue(currentUser?.companyName);
      const currentUserJiraId = normalizeValue(currentUser?.jiraId);

      return baseCustomers.filter(
        (customer) =>
          normalizeValue(customer.name) === currentCompanyName ||
          (currentUserJiraId && normalizeValue(customer.jiraId) === currentUserJiraId)
      );
    }

    return baseCustomers;
  }, [activeJiraCustomers, activeJiraAgents, currentUser?.companyName, currentUser?.jiraId, currentUser?.name, isAgentScopedUser, isCustomerScopedUser, viewMode]);
  const effectiveSelectedCustomerId = lockedSection ? filteredUsersList[0]?.id ?? null : selectedCustomerId;

  const selectedCustomer = useMemo(
    () =>
      effectiveSelectedCustomerId === null
        ? null
        : filteredUsersList.find((c) => c.id === effectiveSelectedCustomerId) ?? null,
    [effectiveSelectedCustomerId, filteredUsersList]
  );
  const lockedEntityName =
    isCustomerScopedUser ? currentUser?.companyName ?? null : isAgentScopedUser ? currentUser?.name ?? null : null;

  useEffect(() => {
    if (lockedSection && section !== lockedSection) {
      router.replace(sectionToPath(lockedSection));
    }
  }, [lockedSection, router, section]);

  const ordersRequestUrl = useMemo(
    () => getOrdersRequestUrl(viewMode, selectedCustomer, lockedEntityName),
    [viewMode, selectedCustomer, lockedEntityName]
  );
  const cachedOrders = useMemo(() => getCachedOrders(ordersRequestUrl), [ordersRequestUrl]);

  useEffect(() => {
    if (cachedOrders) {
      return;
    }

    queueMicrotask(() => setIsLoadingOrders(true));
    const url = `${ordersRequestUrl}${ordersRequestUrl.includes("?") ? "&" : "?"}t=${Date.now()}`;

    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        const nextEntry = {
          activeOrders: d.activeOrders || [],
          completedOrders: d.completedOrders || [],
          fetchedAt: Date.now(),
        };

        ordersCache.set(ordersRequestUrl, nextEntry);
        setOrdersState({
          key: ordersRequestUrl,
          activeOrders: nextEntry.activeOrders,
          completedOrders: nextEntry.completedOrders,
        });
      })
      .catch(() => {
        setOrdersState({
          key: ordersRequestUrl,
          activeOrders: [],
          completedOrders: [],
        });
      })
      .finally(() => setIsLoadingOrders(false));
  }, [cachedOrders, ordersRequestUrl]);

  const resolvedActiveOrders = useMemo(
    () => cachedOrders?.activeOrders ?? (ordersState.key === ordersRequestUrl ? ordersState.activeOrders : []),
    [cachedOrders, ordersState.activeOrders, ordersState.key, ordersRequestUrl]
  );
  const resolvedCompletedOrders = useMemo(
    () => cachedOrders?.completedOrders ?? (ordersState.key === ordersRequestUrl ? ordersState.completedOrders : []),
    [cachedOrders, ordersState.completedOrders, ordersState.key, ordersRequestUrl]
  );

  const resolveCustomerId = useCallback((name: string) => {
    const normalized = name.trim().toLowerCase();
    const match = filteredUsersList.find((c) => c.name.trim().toLowerCase() === normalized);
    return match?.users?.[0]?.id ?? match?.id ?? 0;
  }, [filteredUsersList]);

  const toggleExpand = useCallback((key: string) =>
    setExpanded((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key])), []);

  const toggleRow = useCallback((id: number, orderId?: string) => {
    let shouldMarkRead = false;

    setExpandedRows((prev) => {
      const isAlreadyExpanded = prev.includes(id);
      shouldMarkRead = !isAlreadyExpanded;
      return isAlreadyExpanded ? prev.filter((row) => row !== id) : [...prev, id];
    });

    if (orderId && shouldMarkRead) {
      markRead(orderId);
    }
  }, [markRead]);

  const allOrdersCombined = useMemo(
    () => [
      ...resolvedActiveOrders.map((o) => ({ ...o, _tab: "active" } as Order & { _tab: string })),
      ...resolvedCompletedOrders.map((o) => ({ ...o, _tab: "completed" } as Order & { _tab: string })),
    ],
    [resolvedActiveOrders, resolvedCompletedOrders]
  );

  const navGroups = useMemo(() => {
    if (isCustomerScopedUser) {
      return [
        {
          key: "dashboards-group",
          label: "Dashboards",
          icon: LayoutDashboard,
          items: [{ key: "customers" as NavSection, label: "Customer Dashboard", icon: Users }],
        },
      ];
    }

    if (isAgentScopedUser) {
      return [
        {
          key: "dashboards-group",
          label: "Dashboards",
          icon: LayoutDashboard,
          items: [{ key: "agents" as NavSection, label: "Agent Dashboard", icon: Briefcase }],
        },
      ];
    }

    return [
      {
        key: "dashboards-group",
        label: "Dashboards",
        icon: LayoutDashboard,
        items: [
          { key: "customers" as NavSection, label: "Customer Dashboard", icon: Users, badge: activeJiraCustomers.length },
          { key: "agents" as NavSection, label: "Agent Dashboard", icon: Briefcase, badge: activeJiraAgents.length },
          { key: "multi-location" as NavSection, label: "Multi location", icon: Globe },
          { key: "executive" as NavSection, label: "Executive", icon: Sparkles },
        ],
      },
    ];
  }, [activeJiraAgents.length, activeJiraCustomers.length, isAgentScopedUser, isCustomerScopedUser]);

  const effectiveSidebarSection = effectiveSection === "create-customer" ? "customers" : effectiveSection;
  const activeLabel = navGroups.flatMap((g) => g.items).find((i) => i.key === effectiveSidebarSection)?.label ?? "";
  const sectionGroupLabel = navGroups.find((g) => g.items.some((i) => i.key === effectiveSidebarSection))?.label ?? "";
  const canCreateCustomer = ["super_admin", "admin", "manager"].includes(currentUser?.role || "");
  const resolvedActiveLabel =
    effectiveSection === "create-customer" ? "Create Customer" : homeTitle ? "Dashboard" : activeLabel;
  const resolvedSectionGroupLabel =
    effectiveSection === "create-customer" ? "Customer Dashboard" : homeTitle ? "Workspace" : sectionGroupLabel;

  const navigateToSection = useCallback((target: NavSection) => {
    if (lockedSection && target !== lockedSection) {
      router.push(sectionToPath(lockedSection));
      return;
    }

    setSection(target);
    router.push(sectionToPath(target));
  }, [lockedSection, router]);

  const customerView = (
    <CustomerOrdersView
      viewMode="client"
      filteredUsersList={filteredUsersList}
      selectedCustomerId={effectiveSelectedCustomerId}
      setSelectedCustomerId={setSelectedCustomerId}
      selectedCustomer={selectedCustomer}
      isLoadingJira={isLoadingJira}
      isLoadingOrders={isLoadingOrders}
      allOrders={allOrdersCombined}
      expandedRows={expandedRows}
      sortConfig={sortConfig}
      onSort={requestSort}
      onToggleRow={toggleRow}
      isHighlighted={isHighlighted}
      resolveCustomerId={resolveCustomerId}
      onCreateCustomer={() => router.push("/customer/create-customer-form")}
      canCreateCustomer={canCreateCustomer}
      allowEntitySelection={!isCustomerScopedUser}
    />
  );

  let contentNode: React.ReactNode = null;
  switch (effectiveSection) {
    case "customers":
      contentNode = customerView;
      break;
    case "create-customer":
      contentNode = canCreateCustomer ? (
        <CreateCustomerView currentUserRole={currentUser?.role} onBack={() => router.push("/customer")} />
      ) : (
        customerView
      );
      break;
    case "agents":
      contentNode = (
        <AgentHierarchyView
          allOrders={allOrdersCombined}
          allAgents={activeJiraAgents}
          allAssignments={activeJiraCustomers}
          isLoading={isLoadingOrders}
          expandedRows={expandedRows}
          sortConfig={sortConfig}
          onSort={requestSort}
          onToggleRow={toggleRow}
          isHighlighted={isHighlighted}
          resolveCustomerId={resolveCustomerId}
          onSelectCustomer={setSelectedCustomerId}
          lockedAgentName={isAgentScopedUser ? currentUser?.name ?? null : null}
          showAgentFilter={!isAgentScopedUser}
          showCreateAgentLink={!isAgentScopedUser}
        />
      );
      break;
    case "settings":
      contentNode = <SettingsSection />;
      break;
    case "multi-location":
      contentNode = (
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            height: "calc(100vh - 120px)",
            overflow: "hidden",
          }}
        >
          <iframe
            src="https://hotworks.nextdaynutra.com"
            style={{ width: "100%", height: "100%", border: "none" }}
            title="Multi-location Dashboard"
          />
        </div>
      );
      break;
    case "executive":
      contentNode = (
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            height: "calc(100vh - 120px)",
            overflow: "hidden",
          }}
        >
          <iframe
            src="https://exe.nextdaynutra.com"
            style={{ width: "100%", height: "100%", border: "none" }}
            title="Executive Dashboard"
          />
        </div>
      );
      break;
    default:
      contentNode = null;
  }

  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Loading workspace...</div>}>
      <div
        style={{
          display: "flex",
          height: "100vh",
          gap: 0,
          padding: 0,
          background: "transparent",
        }}
      >
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          .order-row {
            transition: all 0.2s ease !important;
            position: relative;
          }
          .order-row:hover {
            background-color: #f8fafc !important;

            z-index: 2;
          }
          .order-row:hover td {
            background-color: #f8fafc !important;
          }
          .customer-name-link:hover {
            text-decoration: underline;
            text-decoration-color: #000;
            text-decoration-thickness: 1px;
          }
        `}</style>

        <DashboardSidebar
          section={effectiveSidebarSection}
          setSection={navigateToSection}
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
            position: "relative",
          }}
        >
          <TopBar
            activeLabel={resolvedActiveLabel}
            sectionGroupLabel={resolvedSectionGroupLabel}
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
              overflow: "hidden",
              padding: "14px 14px 8px",
            }}
          >
            {contentNode}
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
    </Suspense>
  );
}
