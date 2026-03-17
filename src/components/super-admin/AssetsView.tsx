"use client";

import { FolderOpen, Package } from "lucide-react";
import { brand } from "./brand";

export function AssetsView() {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_360px]">
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Asset workspace</div>
            <h2 className="mt-2 text-2xl font-black text-slate-900">Upload folder data</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">Use this page for upload folder inventory, ingestion status, and asset governance.</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: brand.orangeSoft, color: brand.orange }}>
            <FolderOpen className="h-6 w-6" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Tracked folders", value: "0", note: "Connect a folder source" },
            { label: "Pending imports", value: "0", note: "Waiting for processing" },
            { label: "Storage rules", value: "3", note: "Retention and naming policies" },
          ].map((item) => (
            <div key={item.label} className="rounded-[20px] border border-slate-200 p-5">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{item.label}</div>
              <div className="mt-3 text-3xl font-black text-slate-900">{item.value}</div>
              <div className="mt-2 text-sm text-slate-500">{item.note}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Quick actions</div>
        <h2 className="mt-2 text-2xl font-black text-slate-900">Asset controls</h2>
        <div className="mt-5 space-y-3">
          <button type="button" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-white" style={{ backgroundColor: brand.navy }}>
            <Package className="h-4 w-4" />
            Add asset source
          </button>
          <button type="button" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold" style={{ borderColor: "#D9E3EF", color: brand.navy }}>
            Review import queue
          </button>
        </div>
      </section>
    </div>
  );
}
