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
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Total users", value: stats.total.toLocaleString(), delta: "+2.5%", tone: "text-[#0D8B66]", icon: Users },
          { label: "Active accounts", value: stats.active.toLocaleString(), delta: "+0.5%", tone: "text-[#0D8B66]", icon: Shield },
          { label: "Managers", value: stats.managers.toLocaleString(), delta: "+1.8%", tone: "text-[#0D8B66]", icon: Users },
          { label: "Inactive users", value: stats.inactive.toLocaleString(), delta: "-0.2%", tone: "text-rose-500", icon: KeyRound },
        ].map((card) => (
          <div key={card.label} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              <span>{card.label}</span>
              <card.icon className="h-4 w-4 text-slate-400" />
            </div>
            <div className="mt-3 flex items-end gap-3">
              <div className="text-3xl font-black text-slate-900">{card.value}</div>
              <div className={`mb-1 text-sm font-bold ${card.tone}`}>{card.delta}</div>
            </div>
          </div>
        ))}

        <div className="rounded-[20px] border border-dashed border-slate-300 bg-[#fbfcfb] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.03)]">
          <div className="flex h-full flex-col justify-between">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Quick action</div>
            <Link
              href="/super-admin/users/add"
              className="mt-4 inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-white transition"
              style={{ backgroundColor: brand.navy }}
            >
              <UserPlus className="h-4 w-4" />
              Add user
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 2xl:grid-cols-[minmax(0,1.75fr)_380px]">
        <div className="space-y-5">
          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Role activity overview</h2>
                <p className="mt-1 text-sm text-slate-500">A fast view of how your access model is distributed right now.</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: brand.navy }} />
                  Primary roles
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: brand.orange }} />
                  Support roles
                </span>
              </div>
            </div>

            <div className="grid min-h-[320px] grid-cols-[44px_repeat(5,minmax(0,1fr))] gap-4">
              <div className="flex flex-col justify-between pb-8 pt-1 text-xs font-semibold text-slate-400">
                {["100", "75", "50", "25", "0"].map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>

              {chartBars.map((bar) => (
                <div key={bar.name} className="flex flex-col items-center justify-end gap-3">
                  <div className="flex h-[250px] w-full items-end justify-center rounded-[20px] bg-[linear-gradient(180deg,#f8faf8_0%,#f3f6f3_100%)] px-4 pb-4">
                    <div className="w-full max-w-[46px] rounded-t-[16px]" style={{ height: bar.height, backgroundColor: bar.accent }} />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-slate-900">{bar.name}</div>
                    <div className="text-xs text-slate-500">{bar.count} users</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <div className="mb-5">
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Role mix</div>
              <h2 className="mt-2 text-2xl font-black text-slate-900">Access distribution</h2>
            </div>

            <div className="space-y-4">
              {roleMix.length > 0 ? (
                roleMix.map((role, index) => {
                  const total = Math.max(users.length, 1);
                  const percent = Math.round((role.count / total) * 100);
                  const fills = [brand.navy, brand.orange, brand.teal, "#1B5F95", "#F28A63", "#7DB8A7"];

                  return (
                    <div key={role.key}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-700">{role.name}</span>
                        <span className="text-slate-500">{percent}%</span>
                      </div>
                      <div className="h-3 rounded-full bg-slate-100">
                        <div className="h-3 rounded-full" style={{ width: `${percent}%`, backgroundColor: fills[index % fills.length] }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">No role data available yet.</div>
              )}
            </div>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <div className="mb-4">
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Recent accounts</div>
              <h2 className="mt-2 text-2xl font-black text-slate-900">Newest users</h2>
            </div>

            <div className="space-y-3">
              {newestUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: brand.orangeSoft, color: brand.orange }}>
                    {getInitials(user.name) || "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-slate-900">{user.name}</div>
                    <div className="truncate text-sm text-slate-500">{user.email}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-700">{formatRoleName(roles.find((role) => role.key === user.role), user.role)}</div>
                    <div className="text-xs text-slate-400">{formatDate(user.createdAt)}</div>
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
