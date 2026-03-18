"use client";

import { useState, useEffect, useMemo } from "react";
import { Customer, Order, ViewMode, AgentSummary } from "@/types/dashboard";

// Global in-memory cache to enable Stale-While-Revalidate (instant tab switching)
const globalCache: Record<string, any> = {};

export function useDashboardData(viewMode: ViewMode) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [liveCustomers, setLiveCustomers] = useState<Customer[]>([]);
  const [activeJiraCustomers, setActiveJiraCustomers] = useState<{name: string, agent?: string, jiraId?: string}[]>([]);
  const [activeJiraAgents, setActiveJiraAgents] = useState<{name: string, jiraId: string}[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingJiraData, setIsLoadingJiraData] = useState(false);
  
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [agentSummary, setAgentSummary] = useState<AgentSummary>({ paid: 0, pending: 0, total_owed: 0 });
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Fetch WordPress Users
  useEffect(() => {
    setIsLoadingUsers(false);
    setLiveCustomers([]);
  }, []);

  // Fetch Jira Active Data
  useEffect(() => {
    const cacheKey = 'jira_customers_agents';
    if (globalCache[cacheKey]) {
      setActiveJiraCustomers(globalCache[cacheKey].customers);
      setActiveJiraAgents(globalCache[cacheKey].agents);
      setIsLoadingJiraData(false);
    } else {
      setIsLoadingJiraData(true);
    }

    Promise.all([
      fetch('/api/jira/customers?type=customer').then(res => res.json()),
      fetch('/api/jira/customers?type=agent').then(res => res.json())
    ])
    .then(([customers, agents]) => {
      const custs = Array.isArray(customers) ? customers : [];
      const agts = Array.isArray(agents) ? agents : [];
      setActiveJiraCustomers(custs);
      setActiveJiraAgents(agts);
      globalCache[cacheKey] = { customers: custs, agents: agts }; // Update cache
    })
    .finally(() => setIsLoadingJiraData(false));
  }, []);

  const filteredUsersList = useMemo((): Customer[] => {
    if (viewMode === 'agent') {
      return activeJiraAgents.map((a, index) => ({ id: -(index + 1001), name: a.name, jiraId: a.jiraId, users: [], isAgent: true }));
    }
    if (viewMode === 'internal') return [];
    return activeJiraCustomers.map((c, index) => ({ id: -(index + 1), name: c.name, jiraId: c.jiraId, users: [], isAgent: false }));
  }, [activeJiraCustomers, activeJiraAgents, viewMode]);

  const selectedCustomer = useMemo(() => {
    if (selectedCustomerId === null) return null;
    return filteredUsersList.find(c => c.id === selectedCustomerId) || null;
  }, [selectedCustomerId, filteredUsersList]);

  // Fetch Orders Logic
  useEffect(() => {
    const fetchOrders = async () => {
      let url = `/api/jira/orders?view=${viewMode}`;
      if (viewMode === 'client' && selectedCustomer) {
        url += `&customerName=${encodeURIComponent(selectedCustomer.name.trim())}`;
      } else if (viewMode === 'agent' && selectedCustomer) {
        url += `&agentName=${encodeURIComponent(selectedCustomer.name.trim())}`;
      } else if (viewMode === 'client' || viewMode === 'agent') {
        url = `/api/jira/orders?view=internal`;
      }

      // Check cache first for rapid UI updates
      if (globalCache[url]) {
        const data = globalCache[url];
        const active = data.activeOrders || [];
        const completed = data.completedOrders || [];
        setActiveOrders(active);
        setCompletedOrders(completed);
        
        if (viewMode === 'agent') {
          const all = [...active, ...completed];
          const summary = all.reduce((acc: any, order: Order) => {
            acc.paid += (order.commissionPaid || 0);
            acc.pending += (order.commissionDue || 0);
            acc.total_owed += (order.commissionBalanceOwed || 0);
            return acc;
          }, { paid: 0, pending: 0, total_owed: 0 });
          setAgentSummary(summary);
        }
        setIsLoadingOrders(false); // Do not show loader if cached
      } else {
        setIsLoadingOrders(true); // Show loader only on first mount
      }

      try {
        const res = await fetch(url);
        const data = await res.json();
        
        // Update cache silently
        globalCache[url] = data;

        const active = data.activeOrders || [];
        const completed = data.completedOrders || [];
        
        // Compare new data with existing to avoid redundant renders if data hasn't changed
        // Real-world diffing is complex, but simply setting states updates it reactively
        setActiveOrders(active);
        setCompletedOrders(completed);
        
        if (viewMode === 'agent') {
          const all = [...active, ...completed];
          const summary = all.reduce((acc: any, order: Order) => {
            acc.paid += (order.commissionPaid || 0);
            acc.pending += (order.commissionDue || 0);
            acc.total_owed += (order.commissionBalanceOwed || 0);
            return acc;
          }, { paid: 0, pending: 0, total_owed: 0 });
          setAgentSummary(summary);
        }
      } catch (err) {
        console.error("Failed to fetch Jira orders:", err);
      } finally {
        setIsLoadingOrders(false);
      }
    };
    fetchOrders();
  }, [selectedCustomer, viewMode]);

  useEffect(() => {
    setSelectedCustomerId(null);
  }, [viewMode]);

  const stats = useMemo(() => {
    const countOnTrack = activeOrders.filter(o => o.health.toLowerCase().includes('track') && !o.health.toLowerCase().includes('off')).length;
    const countOffTrack = activeOrders.filter(o => o.health.toLowerCase().includes('off track')).length;
    const countAtRisk = activeOrders.filter(o => o.health.toLowerCase().includes('risk')).length;
    const countWhiteLabel = activeOrders.filter(o => o.health.toLowerCase().includes('white label')).length;
    return { countOnTrack, countOffTrack, countAtRisk, countWhiteLabel };
  }, [activeOrders]);

  return {
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
    stats,
    agentSummary
  };
}
