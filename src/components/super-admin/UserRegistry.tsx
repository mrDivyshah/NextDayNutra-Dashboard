"use client";

import { Search, Users, Shield, KeyRound } from "lucide-react";
import { brand } from "./brand";
import { formatDate, getInitials } from "./utils";
import type { ManagedUser } from "./types";
import type { AppRole, RoleRecord } from "@/lib/roles";

export interface UserRegistryProps {
  roles: RoleRecord[];
  isLoading: boolean;
  search: string;
  setSearch: (value: string) => void;
  filteredUsers: ManagedUser[];
  editingUserId: number | null;
  setEditingUserId: (id: number | null) => void;
  editPassword: string;
  setEditPassword: (value: string) => void;
  handleInlineUpdate: (user: ManagedUser, updates: Partial<ManagedUser> & { password?: string }) => Promise<void>;
}

export function UserRegistry({
  roles,
  isLoading,
  search,
  setSearch,
  filteredUsers,
  editingUserId,
  setEditingUserId,
  editPassword,
  setEditPassword,
  handleInlineUpdate,
}: UserRegistryProps) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">User registry</div>
          <h2 className="mt-2 text-2xl font-black text-slate-900">All users</h2>
          <p className="mt-1 text-sm text-slate-500">Search, update roles, deactivate accounts, and rotate passwords inline.</p>
        </div>

        <label className="relative block w-full max-w-sm">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search users, email, role..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-300 focus:bg-white"
          />
        </label>
      </div>

      {isLoading ? (
        <div className="flex min-h-[280px] items-center justify-center rounded-[20px] bg-slate-50 text-slate-500">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />
            <span className="text-sm font-medium">Synchronizing user registry...</span>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[24px] border border-slate-200">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-[#f7faf7]">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">User identity</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Email address</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Access role</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Account status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Security</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Modified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => {
                const roleRecord = roles.find((role) => role.key === user.role);

                return (
                  <tr
                    key={user.id}
                    className="group transition-colors hover:bg-[#fbfdfb]"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm" style={{ backgroundColor: brand.orangeSoft, color: brand.orange }}>
                          {getInitials(user.name) || "U"}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-bold text-slate-900">{user.name}</div>
                          <div className="text-[10px] font-bold uppercase tracking-tight text-slate-400">UID-{user.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-600">{user.email}</span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="max-w-[160px]">
                        <select
                          value={user.role}
                          onChange={(event) => void handleInlineUpdate(user, { role: event.target.value as AppRole })}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white"
                        >
                          {roles.map((role) => (
                            <option key={role.key} value={role.key}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 truncate text-[10px] text-slate-400">{roleRecord?.description || "Standard access policy"}</p>
                        {(user.redirectUrl || user.additionalAccess) && (
                          <div className="mt-2 space-y-0.5 border-t border-slate-100 pt-1.5">
                            {user.redirectUrl && (
                              <div className="flex items-center gap-1.5 truncate text-[9px] font-bold text-emerald-600">
                                <Shield className="h-2.5 w-2.5 shrink-0" />
                                <span className="truncate" title={user.redirectUrl}>{user.redirectUrl}</span>
                              </div>
                            )}
                            {user.additionalAccess && (
                              <div className="flex items-center gap-1.5 truncate text-[9px] font-bold text-amber-500">
                                <KeyRound className="h-2.5 w-2.5 shrink-0" />
                                <span className="truncate" title={user.additionalAccess}>{user.additionalAccess}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => void handleInlineUpdate(user, { isActive: !user.isActive })}
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                          user.isActive
                            ? "opacity-100"
                            : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                        }`}
                        style={user.isActive ? { backgroundColor: brand.tealSoft, color: brand.teal } : undefined}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? "animate-pulse" : "bg-rose-500"}`} style={user.isActive ? { backgroundColor: brand.teal } : undefined} />
                        {user.isActive ? "Active" : "Disabled"}
                      </button>
                    </td>

                    <td className="px-6 py-4">
                      {editingUserId === user.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="password"
                            autoFocus
                            placeholder="New pass..."
                            value={editPassword}
                            onChange={(event) => setEditPassword(event.target.value)}
                            className="w-32 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs outline-none focus:border-emerald-400 focus:bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => void handleInlineUpdate(user, { password: editPassword })}
                            className="rounded-lg p-1.5 text-emerald-600 transition hover:bg-emerald-50"
                            title="Confirm change"
                          >
                            <Shield className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUserId(null);
                              setEditPassword("");
                            }}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-50"
                            title="Cancel"
                          >
                            <div className="rotate-45 text-lg font-light leading-none">+</div>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingUserId(user.id)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2 text-[10px] font-bold text-slate-500 transition-all hover:border-slate-300 hover:bg-white hover:text-slate-900"
                        >
                          <KeyRound className="h-3.5 w-3.5" style={{ color: brand.navy }} />
                          Security key
                        </button>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <span className="text-[11px] font-bold text-slate-400">{formatDate(user.updatedAt)}</span>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Users className="h-10 w-10 text-slate-200" />
                      <div className="text-lg font-black text-slate-400">No matching accounts</div>
                      <p className="max-w-xs text-xs leading-5 text-slate-500">Refine your search criteria or clear filters to view the registry.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
