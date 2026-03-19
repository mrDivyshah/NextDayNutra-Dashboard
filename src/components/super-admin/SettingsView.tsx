"use client";

import { Settings } from "lucide-react";
import { brand } from "./brand";

export function SettingsView() {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {[
        { title: "Workspace defaults", copy: "Set naming conventions, role defaults, and environment behavior for super admin operations.", icon: <Settings className="h-4 w-4" /> },
        { title: "Security controls", copy: "Manage activation policy, password practices, and future audit settings.", icon: <Settings className="h-4 w-4" /> },
        { title: "Notifications", copy: "Prepare alert settings for account changes, file imports, and access events.", icon: <Settings className="h-4 w-4" /> },
        { title: "Brand preferences", copy: "Keep the super admin interface aligned with Next Day Nutra visual standards.", icon: <Settings className="h-4 w-4" /> },
      ].map((item) => (
        <section key={item.title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-500">
            {item.icon}
          </div>
          <h2 className="mt-4 text-[13px] font-bold text-slate-900">{item.title}</h2>
          <p className="mt-1 text-[12px] leading-relaxed text-slate-500">{item.copy}</p>
          <button className="mt-4 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline">
            Manage settings
          </button>
        </section>
      ))}
    </div>
  );
}
