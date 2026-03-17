"use client";

import { UserPlus } from "lucide-react";
import { brand } from "./brand";
import type { AppRole, RoleRecord } from "@/lib/roles";
import type { CreateUserForm } from "./types";

export interface UserFormProps {
  createForm: CreateUserForm;
  setCreateForm: React.Dispatch<React.SetStateAction<CreateUserForm>>;
  createRoleOptions: RoleRecord[];
  handleCreate: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  isPending: boolean;
  error: string;
  success: string;
}

export function UserForm({
  createForm,
  setCreateForm,
  createRoleOptions,
  handleCreate,
  isPending,
  error,
  success,
}: UserFormProps) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Provision access</div>
          <h2 className="mt-2 text-2xl font-black text-slate-900">Create user</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">Add an account with a database role and activation status from the start.</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: brand.orangeSoft, color: brand.orange }}>
          <UserPlus className="h-5 w-5" />
        </div>
      </div>

      <form onSubmit={handleCreate} className="space-y-3.5">
        <input
          type="text"
          placeholder="Full name"
          value={createForm.name}
          onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
          required
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-300 focus:bg-white"
        />
        <input
          type="email"
          placeholder="Email"
          value={createForm.email}
          onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
          required
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-300 focus:bg-white"
        />
        <input
          type="password"
          placeholder="Temporary password"
          value={createForm.password}
          onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
          required
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-300 focus:bg-white"
        />
        <select
          value={createForm.role}
          onChange={(event) => setCreateForm((prev) => ({ ...prev, role: event.target.value as AppRole }))}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-300 focus:bg-white"
        >
          {createRoleOptions.map((role) => (
            <option key={role.key} value={role.key}>
              {role.name}
            </option>
          ))}
        </select>

        <div className="grid gap-3.5 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 ml-1">Redirect URL</label>
            <input
              type="url"
              placeholder="https://example.com/welcome"
              value={createForm.redirectUrl}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, redirectUrl: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-300 focus:bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 ml-1">Additional Access</label>
            <input
              type="text"
              placeholder="e.g. legacy_vault_read"
              value={createForm.additionalAccess}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, additionalAccess: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-300 focus:bg-white"
            />
          </div>
        </div>

        <label className="flex items-center gap-3 rounded-2xl bg-[#f7faf7] px-4 py-3 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={createForm.isActive}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, isActive: event.target.checked }))}
            className="h-4 w-4"
            style={{ accentColor: brand.orange }}
          />
          Activate account immediately
        </label>

        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
        {success && <div className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: "#BFE7D7", backgroundColor: brand.tealSoft, color: brand.teal }}>{success}</div>}

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:bg-slate-400"
          style={{ backgroundColor: brand.orange }}
        >
          <UserPlus className="h-4 w-4" />
          {isPending ? "Saving..." : "Create user"}
        </button>
      </form>
    </section>
  );
}
