"use client";

import { ShieldPlus } from "lucide-react";
import { brand } from "./brand";
import type { CreateRoleForm } from "./types";

export interface RoleFormProps {
  form: CreateRoleForm;
  setForm: React.Dispatch<React.SetStateAction<CreateRoleForm>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  isPending: boolean;
  error: string;
  success: string;
}

export function RoleForm({ form, setForm, onSubmit, isPending, error, success }: RoleFormProps) {
  /** Auto-generate a slug key from the role name */
  const handleNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      // Only auto-fill key if it hasn't been manually edited yet
      key: prev._keyTouched ? prev.key : value.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""),
    }));
  };

  const handleKeyChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      key: value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
      _keyTouched: true,
    }));
  };

  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
            Access control
          </div>
          <h2 className="mt-2 text-2xl font-black text-slate-900">Create role</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Define a reusable role that can be assigned to user accounts and used for access control.
          </p>
        </div>
        <div
          className="flex h-11 w-11 items-center justify-center rounded-2xl"
          style={{ backgroundColor: brand.mist, color: brand.navy }}
        >
          <ShieldPlus className="h-5 w-5" />
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-3.5">
        {/* Role name */}
        <div className="space-y-1.5">
          <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Role name <span className="text-rose-400">*</span>
          </label>
          <input
            id="role-name"
            type="text"
            placeholder="e.g. Account Manager"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white"
          />
        </div>

        {/* Role key */}
        <div className="space-y-1.5">
          <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Role key <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <input
              id="role-key"
              type="text"
              placeholder="e.g. account_manager"
              value={form.key}
              onChange={(e) => handleKeyChange(e.target.value)}
              required
              pattern="[a-z0-9_]+"
              title="Lowercase letters, numbers, and underscores only"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              key
            </span>
          </div>
          <p className="ml-1 text-[11px] text-slate-400">
            Lowercase, underscores only. Used internally by the system — cannot be changed later.
          </p>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Description
          </label>
          <textarea
            id="role-description"
            placeholder="What can users with this role do?"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white"
          />
        </div>

        {/* System role toggle */}
        <label
          className="flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700"
          style={{ backgroundColor: brand.mist }}
        >
          <input
            id="role-is-system"
            type="checkbox"
            checked={form.isSystem}
            onChange={(e) => setForm((prev) => ({ ...prev, isSystem: e.target.checked }))}
            className="h-4 w-4"
            style={{ accentColor: brand.navy }}
          />
          Mark as system role (protected — cannot be deleted by regular admins)
        </label>

        {/* Feedback */}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}
        {success && (
          <div
            className="rounded-2xl border px-4 py-3 text-sm"
            style={{ borderColor: "#BFE7D7", backgroundColor: brand.tealSoft, color: brand.teal }}
          >
            {success}
          </div>
        )}

        <button
          id="role-submit"
          type="submit"
          disabled={isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:bg-slate-400"
          style={{ backgroundColor: brand.navy }}
        >
          <ShieldPlus className="h-4 w-4" />
          {isPending ? "Saving..." : "Create role"}
        </button>
      </form>
    </section>
  );
}
