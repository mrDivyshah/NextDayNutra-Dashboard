import { Shield, ShieldCheck, Lock, Plus, Edit2, Trash2, Loader2, KeyRound, ExternalLink } from "lucide-react";
import { brand } from "./brand";
import type { RoleRecord } from "@/lib/roles";
import { Pagination } from "./Pagination";

export interface RolesRegistryProps {
  roles: RoleRecord[];
  isLoading: boolean;
  onAddClick: () => void;
  onEditClick: (role: RoleRecord) => void;
  onDeleteClick: (roleId: number) => Promise<void>;
  isActionPending?: boolean;
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function RolesRegistry({
  roles,
  isLoading,
  onAddClick,
  onEditClick,
  onDeleteClick,
  isActionPending,
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onLimitChange,
}: RolesRegistryProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
         <h2 className="text-sm font-bold text-slate-900">Platform role definitions</h2>
         <button
            onClick={onAddClick}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-1.5 text-[12px] font-bold text-white shadow-sm transition hover:bg-black"
          >
            <Plus className="h-3.5 w-3.5" />
            Create role
          </button>
      </div>

      {isLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            <span className="text-[12px] font-bold text-slate-400">Loading roles...</span>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Schema</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Redirect policy</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Type</th>
                  <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">Governance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {roles.map((role) => (
                  <tr key={role.id} className="group transition-colors hover:bg-slate-50/30">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                          {role.isSystem ? <Lock className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13px] font-bold text-slate-900">{role.name}</div>
                          <div className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-tight">{role.key}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      {role.redirectUrl ? (
                        <div className="flex items-center gap-2">
                          <ExternalLink className="h-3 w-3 text-emerald-600" />
                          <span className="text-[12px] font-medium text-slate-600 truncate max-w-[150px]" title={role.redirectUrl}>
                            {role.redirectUrl}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400 italic">Default</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                          role.isSystem
                            ? "bg-slate-100 text-slate-600"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {role.isSystem ? "System" : "Custom"}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 transition group-hover:opacity-100">
                        <button
                          onClick={() => onEditClick(role)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                          title="Edit role"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        {!role.isSystem && (
                          <button
                            onClick={() => onDeleteClick(role.id)}
                            disabled={isActionPending}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                            title="Delete role"
                          >
                            {isActionPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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
