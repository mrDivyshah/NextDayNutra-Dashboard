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
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-sm font-bold text-slate-900">Account provisioning</h2>
        <p className="mt-1 text-xs text-slate-500">Define identity, security policy, and initial state.</p>
      </div>

      <form onSubmit={handleCreate} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[12px] font-bold text-slate-700">Display name</label>
          <input
            type="text"
            placeholder="e.g. John Doe"
            value={createForm.name}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
            required
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] font-bold text-slate-700">Email address</label>
          <input
            type="email"
            placeholder="johndoe@example.com"
            value={createForm.email}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
            required
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] font-bold text-slate-700">Initial security key</label>
          <input
            type="password"
            placeholder="••••••••"
            value={createForm.password}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
            required
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] font-bold text-slate-700">Base access role</label>
          <select
            value={createForm.role}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, role: event.target.value as AppRole }))}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          >
            {createRoleOptions.map((role) => (
              <option key={role.key} value={role.key}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-slate-700">Success redirect</label>
            <input
              type="url"
              placeholder="https://..."
              value={createForm.redirectUrl}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, redirectUrl: event.target.value }))}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-slate-700">Specific flags</label>
            <input
              type="text"
              placeholder="e.g. beta_user"
              value={createForm.additionalAccess}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, additionalAccess: event.target.value }))}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 py-2">
          <input
            type="checkbox"
            id="is_active"
            checked={createForm.isActive}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, isActive: event.target.checked }))}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
          />
          <label htmlFor="is_active" className="text-[13px] font-medium text-slate-700 cursor-pointer">
            Activate account and enable immediate login
          </label>
        </div>

        {error && <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700">{error}</div>}
        {success && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-700">{success}</div>}

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-2 text-[12px] font-bold text-white shadow-sm transition hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Creating..." : "Save and notify"}
          </button>
        </div>
      </form>
    </div>
  );
}
