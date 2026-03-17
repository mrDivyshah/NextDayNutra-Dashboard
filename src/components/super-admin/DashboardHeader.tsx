"use client";

import Link from "next/link";
import { brand } from "./brand";

export interface DashboardHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function DashboardHeader({ eyebrow, title, description }: DashboardHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <div className="text-sm font-semibold" style={{ color: brand.teal }}>{eyebrow}</div>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500 md:text-base">
          {description}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" style={{ backgroundColor: brand.mist, color: brand.navy }}>Time period: Live snapshot</div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition hover:bg-slate-50"
          style={{ borderColor: "#D9E3EF", color: brand.navy }}
        >
          Back to operations
        </Link>
      </div>
    </div>
  );
}
