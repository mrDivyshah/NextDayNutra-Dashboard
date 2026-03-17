"use client";

import { Shield, ShieldCheck, Lock } from "lucide-react";
import { brand } from "./brand";
import type { RoleRecord } from "@/lib/roles";

export interface RolesRegistryProps {
  roles: RoleRecord[];
  isLoading: boolean;
}

export function RolesRegistry({ roles, isLoading }: RolesRegistryProps) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
            Role registry
          </div>
          <h2 className="mt-2 text-2xl font-black text-slate-900">All roles</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            These are all roles available for user assignment in the system.
          </p>
        </div>
        <div
          className="flex h-11 w-11 items-center justify-center rounded-2xl"
          style={{ backgroundColor: brand.tealSoft, color: brand.teal }}
        >
          <Shield className="h-5 w-5" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : roles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
          No roles found. Create your first role using the form above.
        </div>
      ) : (
        <div className="space-y-2">
          {roles.map((role) => (
            <div
              key={role.id}
              className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3.5 transition hover:border-slate-200 hover:bg-white"
            >
              {/* Icon */}
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={
                  role.isSystem
                    ? { backgroundColor: brand.mist, color: brand.navy }
                    : { backgroundColor: brand.tealSoft, color: brand.teal }
                }
              >
                {role.isSystem ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{role.name}</span>
                  {role.isSystem && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{ backgroundColor: brand.mist, color: brand.navy }}
                    >
                      System
                    </span>
                  )}
                </div>
                <div className="mt-0.5 font-mono text-xs text-slate-400">{role.key}</div>
                {role.description && (
                  <div className="mt-1 truncate text-xs text-slate-500">{role.description}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
