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
    const fetchData = async () => {
      const cacheKey = 'jira_customers_agents';
      let cachedETags: { customer: string | null; agent: string | null } = { customer: null, agent: null };
      
      const setJiraData = (data: any) => {
        const custs = Array.isArray(data.customers) ? data.customers : [];
        const agts = Array.isArray(data.agents) ? data.agents : [];
        
        if (JSON.stringify(activeJiraCustomers) !== JSON.stringify(custs)) {
          setActiveJiraCustomers(custs);
        }
        if (JSON.stringify(activeJiraAgents) !== JSON.stringify(agts)) {
          setActiveJiraAgents(agts);
        }
      };

      if (globalCache[cacheKey]) {
        setJiraData(globalCache[cacheKey].data);
        cachedETags = globalCache[cacheKey].etags;
        setIsLoadingJiraData(false);
      } else {
        try {
          const localStr = localStorage.getItem(cacheKey);
          if (localStr) {
            const localCache = JSON.parse(localStr);
            setJiraData(localCache.data);
            cachedETags = localCache.etags || { customer: null, agent: null };
            globalCache[cacheKey] = localCache;
            setIsLoadingJiraData(false);
          } else {
            setIsLoadingJiraData(true);
          }
        } catch (e) {
          setIsLoadingJiraData(true);
        }
      }

      try {
        const custHeaders: HeadersInit = {};
        const agentHeaders: HeadersInit = {};
        if (cachedETags.customer) custHeaders['If-None-Match'] = cachedETags.customer;
        if (cachedETags.agent) agentHeaders['If-None-Match'] = cachedETags.agent;

        const [custRes, agentRes] = await Promise.all([
          fetch('/api/jira/customers?type=customer', { headers: custHeaders }),
          fetch('/api/jira/customers?type=agent', { headers: agentHeaders })
        ]);

        let newCusts = activeJiraCustomers;
        let newAgents = activeJiraAgents;
        let custEtag = cachedETags.customer;
        let agentEtag = cachedETags.agent;

        if (custRes.status !== 304 && custRes.ok) {
          newCusts = await custRes.json();
          custEtag = custRes.headers.get('ETag');
        }
        if (agentRes.status !== 304 && agentRes.ok) {
          newAgents = await agentRes.json();
          agentEtag = agentRes.headers.get('ETag');
        }

        const freshData = { customers: newCusts, agents: newAgents };
        const freshEtags = { customer: custEtag, agent: agentEtag };
        
        const cacheEntry = { data: freshData, etags: freshEtags };
        globalCache[cacheKey] = cacheEntry;
        
        try {
          localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
        } catch (e) {}

        setJiraData(freshData);
      } catch (err) {
        console.error("Failed to fetch Jira active data:", err);
      } finally {
        setIsLoadingJiraData(false);
      }
    };
    fetchData();
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

      const cacheKey = `jira_orders_${url}`;
      
      const setOrdersData = (data: any) => {
        const active = data.activeOrders || [];
        const completed = data.completedOrders || [];
        
        // Smart diffing to avoid unnecessary re-renders
        const currentActiveStr = JSON.stringify(activeOrders);
        const newActiveStr = JSON.stringify(active);
        
        if (currentActiveStr !== newActiveStr) {
          setActiveOrders(active);
          setCompletedOrders(completed);
        }

        if (viewMode === 'agent' && currentActiveStr !== newActiveStr) {
          const all = [...active, ...completed];
          const summary = all.reduce((acc: any, order: Order) => {
            acc.paid += (order.commissionPaid || 0);
            acc.pending += (order.commissionDue || 0);
            acc.total_owed += (order.commissionBalanceOwed || 0);
            return acc;
          }, { paid: 0, pending: 0, total_owed: 0 });
          setAgentSummary(summary);
        }
      };

      let cachedETag: string | null = null;

      // 1. Try Memory Cache
      if (globalCache[url]) {
        setOrdersData(globalCache[url].data);
        cachedETag = globalCache[url].etag;
        setIsLoadingOrders(false);
      } else {
        // 2. Try LocalStorage Cache
        try {
          const localStr = localStorage.getItem(cacheKey);
          if (localStr) {
            const localCache = JSON.parse(localStr);
            setOrdersData(localCache.data);
            cachedETag = localCache.etag;
            globalCache[url] = localCache;
            setIsLoadingOrders(false);
          } else {
            setIsLoadingOrders(true);
          }
        } catch (e) {
          setIsLoadingOrders(true);
        }
      }

      // 3. Stale-While-Revalidate with Server
      try {
        const headers: HeadersInit = {};
        if (cachedETag) {
          headers['If-None-Match'] = cachedETag;
        }

        const res = await fetch(url, { headers });
        
        if (res.status === 304) {
          // Data hasn't changed, no need to update UI
          setIsLoadingOrders(false);
          return;
        }

        if (!res.ok) {
          throw new Error('Jira API returned error');
        }

        const newETag = res.headers.get('ETag');
        const data = await res.json();
        
        const cacheEntry = { data, etag: newETag };
        globalCache[url] = cacheEntry;
        
        try {
          localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
        } catch (e) { /* ignore localStorage errors */ }

        setOrdersData(data);
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
