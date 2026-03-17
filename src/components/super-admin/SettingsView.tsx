"use client";

import { Settings } from "lucide-react";
import { brand } from "./brand";

export function SettingsView() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {[
        ["Workspace defaults", "Set naming conventions, role defaults, and environment behavior for super admin operations."],
        ["Security controls", "Manage activation policy, password practices, and future audit settings."],
        ["Notifications", "Prepare alert settings for account changes, file imports, and access events."],
        ["Brand preferences", "Keep the super admin interface aligned with Next Day Nutra visual standards."],
      ].map(([title, copy]) => (
        <section key={title} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: brand.orangeSoft, color: brand.orange }}>
            <Settings className="h-5 w-5" />
          </div>
          <h2 className="mt-5 text-2xl font-black text-slate-900">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">{copy}</p>
        </section>
      ))}
    </div>
  );
}
