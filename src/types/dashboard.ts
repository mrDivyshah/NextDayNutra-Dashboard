import { AlertCircle, CheckCircle, Clock } from "lucide-react";

export type LORRequest = {
  id: number;
  date: string;
  brandType: string;
  status: string;
  qtyOrdered: number;
  qtyDelivered: number;
  deliveryDate: string;
  labelSize: string;
};

export type Order = {
  id: number;
  highlight: boolean;
  health: string;
  healthColor: string;
  icon: "clock" | "check" | "alert";
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
  users: CustomerUser[];
  agent?: string;
  isAgent?: boolean; // Track if this is an agent record
};

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
