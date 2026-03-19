"use client";

import Link from "next/link";
import { Users, Shield, KeyRound, UserPlus } from "lucide-react";
import { brand } from "./brand";
import { formatRoleName, formatDate, getInitials } from "./utils";
import type { ManagedUser, DashboardStats, ChartBar, RoleMix } from "./types";
import type { RoleRecord } from "@/lib/roles";

export interface DashboardOverviewProps {
  stats: DashboardStats;
  chartBars: ChartBar[];
  roleMix: RoleMix[];
  newestUsers: ManagedUser[];
  roles: RoleRecord[];
  users: ManagedUser[];
}

export function DashboardOverview({
  stats,
  chartBars,
  roleMix,
  newestUsers,
  roles,
  users,
}: DashboardOverviewProps) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Total users", value: stats.total.toLocaleString(), delta: "+2.5%", tone: "text-emerald-600", icon: Users },
          { label: "Active accounts", value: stats.active.toLocaleString(), delta: "+0.5%", tone: "text-emerald-600", icon: Shield },
          { label: "Managers", value: stats.managers.toLocaleString(), delta: "+1.8%", tone: "text-emerald-600", icon: Users },
          { label: "Inactive users", value: stats.inactive.toLocaleString(), delta: "-0.2%", tone: "text-rose-500", icon: KeyRound },
        ].map((card) => (
          <div key={card.label} className="rounded-lg border border-slate-200 bg-white p-5 transition hover:shadow-sm">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <span>{card.label}</span>
              <card.icon className="h-3.5 w-3.5 text-slate-300" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <div className="text-2xl font-bold text-slate-900">{card.value}</div>
              <div className={`text-[11px] font-bold ${card.tone}`}>{card.delta}</div>
            </div>
          </div>
        ))}

        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5">
          <div className="flex h-full flex-col justify-between">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Governance</div>
            <Link
              href="/super-admin/users/add"
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-[12px] font-bold text-white transition hover:bg-black"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Add user
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">User distribution by role</h2>
                <p className="mt-0.5 text-xs text-slate-500">Live breakdown of active access policies across the organization.</p>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-slate-900" />
                  Primary
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Support
                </span>
              </div>
            </div>

            <div className="grid min-h-[300px] grid-cols-[40px_repeat(5,minmax(0,1fr))] gap-4">
              <div className="flex flex-col justify-between pb-8 pt-1 text-[10px] font-bold text-slate-300">
                {["100", "75", "50", "25", "0"].map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>

              {chartBars.map((bar) => (
                <div key={bar.name} className="flex flex-col items-center justify-end gap-3">
                  <div className="flex h-[240px] w-full items-end justify-center rounded-md bg-slate-50/50 px-3 pb-3">
                    <div className="w-full rounded-sm opacity-90 transition-opacity hover:opacity-100" style={{ height: bar.height, backgroundColor: bar.accent === brand.navy ? "#1a1a1a" : bar.accent === brand.orange ? "#10b981" : bar.accent }} />
                  </div>
                  <div className="text-center">
                    <div className="text-[12px] font-bold text-slate-900">{bar.name}</div>
                    <div className="text-[11px] text-slate-400 font-medium">{bar.count}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-sm font-bold text-slate-900">Access distribution</h2>
              <p className="mt-0.5 text-xs text-slate-500">Percentage of total user base.</p>
            </div>

            <div className="space-y-5">
              {roleMix.length > 0 ? (
                roleMix.map((role, index) => {
                  const total = Math.max(users.length, 1);
                  const percent = Math.round((role.count / total) * 100);
                  const fills = ["#1a1a1a", "#10b981", "#3b82f6", "#f59e0b", "#6366f1"];

                  return (
                    <div key={role.key}>
                      <div className="mb-2 flex items-center justify-between text-[12px]">
                        <span className="font-bold text-slate-700">{role.name}</span>
                        <span className="font-medium text-slate-400">{percent}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100">
                        <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: fills[index % fills.length] }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-md bg-slate-50 px-4 py-8 text-center text-xs text-slate-400">No role data available.</div>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-sm font-bold text-slate-900">Newest users</h2>
              <p className="mt-0.5 text-xs text-slate-500">Latest platform registrations.</p>
            </div>

            <div className="space-y-4">
              {newestUsers.map((user) => (
                <div key={user.id} className="group flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 transition group-hover:bg-slate-900 group-hover:text-white">
                    {getInitials(user.name) || "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-bold text-slate-900">{user.name}</div>
                    <div className="truncate text-[11px] text-slate-400">{user.email}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">{formatRoleName(roles.find((role) => role.key === user.role), user.role)}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
