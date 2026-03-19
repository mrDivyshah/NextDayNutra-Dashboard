"use client";

import { ShieldPlus, ArrowLeft, Save } from "lucide-react";
import { brand } from "./brand";
import type { CreateRoleForm } from "./types";

export interface RoleFormProps {
  form: CreateRoleForm;
  setForm: React.Dispatch<React.SetStateAction<CreateRoleForm>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  isPending: boolean;
  error: string;
  success: string;
  isEditing?: boolean;
  onCancel?: () => void;
}

export function RoleForm({
  form,
  setForm,
  onSubmit,
  isPending,
  error,
  success,
  isEditing,
  onCancel,
}: RoleFormProps) {
  /** Auto-generate a slug key from the role name */
  const handleNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      key:
        isEditing || prev._keyTouched
          ? prev.key
          : value.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""),
    }));
  };

  const handleKeyChange = (value: string) => {
    if (isEditing) return;
    setForm((prev) => ({
      ...prev,
      key: value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
      _keyTouched: true,
    }));
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{isEditing ? "Edit security policy" : "New security policy"}</h2>
          <p className="mt-1 text-xs text-slate-500">Define permissions and landing targets for a group of users.</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-slate-700">Policy name</label>
            <input
              type="text"
              placeholder="e.g. Regional Manager"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-slate-700">Technical identifier</label>
            <input
              type="text"
              placeholder="e.g. regional_manager"
              value={form.key}
              onChange={(e) => handleKeyChange(e.target.value)}
              required
              disabled={isEditing}
              className={`w-full rounded-md border border-slate-300 px-3 py-1.5 font-mono text-sm outline-none transition ${isEditing ? "bg-slate-50 text-slate-400" : "bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"}`}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] font-bold text-slate-700">Global landing target</label>
          <input
            type="text"
            placeholder="e.g. /dashboard/overview"
            value={form.redirectUrl}
            onChange={(e) => setForm((prev) => ({ ...prev, redirectUrl: e.target.value }))}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          />
          <p className="text-[11px] text-slate-400">Where users are routed immediately after successful authentication.</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] font-bold text-slate-700">Internal description</label>
          <textarea
            placeholder="Describe the scope of this policy..."
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        <div className="flex items-center gap-3 py-1">
          <input
            type="checkbox"
            id="is_system"
            checked={form.isSystem}
            onChange={(e) => setForm((prev) => ({ ...prev, isSystem: e.target.checked }))}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
          />
          <label htmlFor="is_system" className="text-[13px] font-medium text-slate-700 cursor-pointer">
            Mark as protected system resource
          </label>
        </div>

        {error && <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700">{error}</div>}
        {success && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-700">{success}</div>}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-slate-300 bg-white px-4 py-1.5 text-[12px] font-bold text-slate-700 hover:bg-slate-50"
            >
              Discard
            </button>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-1.5 text-[12px] font-bold text-white shadow-sm transition hover:bg-black disabled:opacity-50"
          >
            {isPending ? "Saving..." : isEditing ? "Update policy" : "Save policy"}
          </button>
        </div>
      </form>
    </div>
  );
}
