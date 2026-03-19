"use client";

import { FolderOpen, Package } from "lucide-react";
import { brand } from "./brand";

export function AssetsView() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Inventory ingestion workspace</h2>
              <p className="mt-1 text-xs text-slate-500">Govern your upload folder inventory and asset tracking policies.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Tracked folders", value: "0", note: "No active sources" },
              { label: "Pending imports", value: "0", note: "Idle state" },
              { label: "Storage rules", value: "3", note: "System default" },
            ].map((item) => (
              <div key={item.label} className="rounded-md border border-slate-100 bg-slate-50/50 p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</div>
                <div className="mt-2 text-2xl font-black text-slate-900">{item.value}</div>
                <div className="mt-1 text-[11px] text-slate-500">{item.note}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
               <FolderOpen className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-[13px] font-bold text-slate-900">No assets tracked yet</h3>
            <p className="mt-1 text-[12px] text-slate-500">Add an external folder or storage source to begin indexing file metadata.</p>
            <button className="mt-4 rounded-md bg-slate-900 px-4 py-1.5 text-[12px] font-bold text-white hover:bg-black">
              Connect first source
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-[13px] font-bold text-slate-900">Workspace summary</h2>
          <div className="mt-5 space-y-4">
             <div className="flex justify-between border-b border-slate-50 pb-2 text-[12px]">
               <span className="text-slate-500">Processing load</span>
               <span className="font-medium text-slate-900">Optimal</span>
             </div>
             <div className="flex justify-between border-b border-slate-50 pb-2 text-[12px]">
               <span className="text-slate-500">Indexing queue</span>
               <span className="font-medium text-slate-900">Empty</span>
             </div>
             <div className="flex justify-between text-[12px]">
               <span className="text-slate-500">Next sync</span>
               <span className="font-medium text-slate-900">Idle</span>
             </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-[13px] font-bold text-slate-900">Asset governance</h2>
          <div className="mt-5 space-y-3">
            <button className="flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-[12px] font-bold text-white hover:bg-black">
              <Package className="h-4 w-4" />
              Ingest new source
            </button>
            <button className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-[12px] font-bold text-slate-700 hover:bg-slate-50 transition-colors">
              Review history
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
