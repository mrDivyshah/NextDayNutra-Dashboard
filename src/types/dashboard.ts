// ─── Shared Dashboard Types ───────────────────────────────────────────────────
import type React from "react";

export type LORRequest = {
  id: number;
  date: string;
  brandType: string;
  status: string;
  qtyOrdered: number;
  qtyDelivered: number;
  deliveryDate: string;
  labelSize: string;
  summary?: string;
};

export type Order = {
  id: number;
  highlight: boolean;
  health: string;
  healthColor: string;
  icon: string;
  so: string;
  cmKey: string;
  product: string;
  customer: string;
  customerNew: number;
  status: string;
  qty: number;
  start: string;
  est: string;
  days: string;
  notes: string[];
  initialInv: number;
  deliveredInv: number;
  remainingInv: number;
  lorRequests: LORRequest[];
  agentName?: string;
  commissionPercent?: number;
  commissionTotal?: number;
  commissionPaid?: number;
  commissionDue?: number;
  commissionBalanceOwed?: number;
  customerPaymentStatus?: string;
  quotedOrderTotal?: number;
  finalOrderTotal?: number;
  unitPrice?: number;
  commissionPaymentHistory?: { amount: number, date: string }[];
};

export type CustomerUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export type Customer = {
  id: number;
  name: string;
  jiraId?: string;
  users: CustomerUser[];
  agent?: string;
  isAgent?: boolean;
};

export type JiraCustomer = { name: string; agent: string; jiraId?: string };
export type JiraAgent = { name: string; jiraId: string };

export type NavSection = "customers" | "create-customer" | "agents" | "settings" | "internal" | "multi-location" | "executive";

export type ViewMode = 'internal' | 'agent' | 'client';

export type AgentSummary = {
  paid: number;
  pending: number;
  total_owed: number;
};

export type AgentHierarchy = {
  [agentName: string]: {
    summary: AgentSummary;
    customers: {
      [customerName: string]: {
        paid: number;
        pending: number;
        total_owed: number;
        orders: Order[];
      };
    };
  };
};

// ─── Shared UI Helpers ────────────────────────────────────────────────────────

export function formatRelTime(iso: string): string {
  try {
    const d = new Date(iso);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString();
  } catch {
    return "";
  }
}

export function tdStyle(first: boolean, last: boolean): React.CSSProperties {
  return {
    padding: "13px 14px",
    fontSize: 13,
    color: "#334155",
    background: "inherit",
    borderTop: "1px solid #f1f5f9",
    borderBottom: "1px solid #f1f5f9",
    ...(first
      ? { borderLeft: "1px solid #f1f5f9", borderTopLeftRadius: 10, borderBottomLeftRadius: 10 }
      : {}),
    ...(last
      ? { borderRight: "1px solid #f1f5f9", borderTopRightRadius: 10, borderBottomRightRadius: 10 }
      : {}),
  };
}

export function healthBadgeColors(health: string): { bg: string; color: string } {
  const l = health.toLowerCase();
  if (l.includes("track") && !l.includes("off")) return { bg: "#dcfce7", color: "#166534" };
  if (l.includes("off track")) return { bg: "#fee2e2", color: "#991b1b" };
  if (l.includes("risk") || l.includes("hold")) return { bg: "#ffedd5", color: "#9a3412" };
  if (l.includes("pending")) return { bg: "#e0f2fe", color: "#075985" };
  if (l.includes("white")) return { bg: "#ede9fe", color: "#5b21b6" };
  return { bg: "#f1f5f9", color: "#475569" };
}
