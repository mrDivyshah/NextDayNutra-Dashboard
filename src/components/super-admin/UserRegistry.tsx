"use client";

import { Search, Users, Shield, KeyRound } from "lucide-react";
import { brand } from "./brand";
import { formatDate, getInitials } from "./utils";
import type { ManagedUser } from "./types";
import type { AppRole, RoleRecord } from "@/lib/roles";
import { Pagination } from "./Pagination";

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
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
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
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onLimitChange,
}: UserRegistryProps) {
  return (
    <div className="flex flex-col gap-1 bg-white rounded-2xl mb-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm p-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ms-3" />
          <input
            type="text"
            placeholder="Filter users..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-[13px] text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
            <span className="text-[12px] font-bold text-slate-400">Loading registry...</span>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden border border-slate-200 rounded-b-2xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Identity</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Email</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Policy</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Security</th>
                  <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const roleRecord = roles.find((role) => role.key === user.role);

                  return (
                    <tr
                      key={user.id}
                      className="group transition-colors hover:bg-slate-50/30"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
                            {getInitials(user.name) || "U"}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-[13px] font-bold text-slate-900">{user.name}</div>
                            <div className="text-[10px] font-medium text-slate-400">UID-{user.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="text-[13px] text-slate-600">{user.email}</span>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="max-w-[140px]">
                          <select
                            value={user.role}
                            onChange={(event) => void handleInlineUpdate(user, { role: event.target.value as AppRole })}
                            className="w-full rounded-md border border-transparent bg-transparent px-1 py-1 text-[13px] font-bold text-slate-900 outline-none transition hover:bg-slate-100 focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600"
                          >
                            {roles.map((role) => (
                              <option key={role.key} value={role.key}>
                                {role.name}
                              </option>
                            ))}
                          </select>
                          {(user.redirectUrl || user.additionalAccess) && (
                            <div className="mt-1 flex items-center gap-1.5 opacity-60">
                               <Shield className="h-2.5 w-2.5 text-emerald-600" />
                               <span className="text-[9px] font-bold text-slate-500">Custom routing</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() => void handleInlineUpdate(user, { isActive: !user.isActive })}
                          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold transition-all ${
                            user.isActive
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-rose-100 text-rose-800 hover:bg-rose-200"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? "bg-emerald-600" : "bg-rose-600"}`} />
                          {user.isActive ? "Active" : "Disabled"}
                        </button>
                      </td>

                      <td className="px-5 py-3.5">
                        {editingUserId === user.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="password"
                              autoFocus
                              placeholder="New key..."
                              value={editPassword}
                              onChange={(event) => setEditPassword(event.target.value)}
                              className="w-28 rounded-md border border-slate-300 bg-white px-2 py-1 text-[12px] outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                            />
                            <button
                              type="button"
                              onClick={() => void handleInlineUpdate(user, { password: editPassword })}
                              className="text-emerald-600 hover:text-emerald-800"
                            >
                              <Shield className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditingUserId(user.id)}
                            className="text-[11px] font-bold text-slate-400 hover:text-slate-900 hover:underline"
                          >
                            Rotate key
                          </button>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <span className="text-[11px] font-medium text-slate-400">{formatDate(user.updatedAt)}</span>
                      </td>
                    </tr>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-20 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-[14px] font-bold text-slate-900">No users found</div>
                        <p className="text-[13px] text-slate-500">Refine your filters to see more results.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={onPageChange}
            onLimitChange={onLimitChange}
          />
        </div>
      )}
    </div>
  );
}
