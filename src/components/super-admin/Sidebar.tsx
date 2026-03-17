"use client";

import Link from "next/link";
import { ChevronRight, LayoutDashboard, Users, FolderOpen, Settings } from "lucide-react";
import { NdnMark } from "./NdnMark";
import { brand } from "./brand";
import type { SuperAdminView } from "./types";

export interface SidebarProps {
  view: SuperAdminView;
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: (expanded: boolean) => void;
}

const menuGroups = [
  {
    title: "Control center",
    items: [
      { label: "Dashboard", view: "dashboard" as SuperAdminView, href: "/super-admin", icon: LayoutDashboard },
      {
        label: "Users",
        view: "users" as SuperAdminView,
        href: "/super-admin/users",
        icon: Users,
        children: [
          { label: "All users", view: "users" as SuperAdminView, href: "/super-admin/users" },
          { label: "Add user", view: "users-add" as SuperAdminView, href: "/super-admin/users/add" },
          { label: "All roles", view: "roles" as SuperAdminView, href: "/super-admin/roles" },
          { label: "Add role", view: "roles-add" as SuperAdminView, href: "/super-admin/roles/add" },
        ],
      },
      { label: "Assets", view: "assets" as SuperAdminView, href: "/super-admin/assets", icon: FolderOpen, description: "Upload folder data" },
      { label: "Settings", view: "settings" as SuperAdminView, href: "/super-admin/settings", icon: Settings },
    ],
  },
];

const sidebarItems = menuGroups.flatMap((group) => group.items);

export function Sidebar({ view, isSidebarExpanded, setIsSidebarExpanded }: SidebarProps) {
  const isUsersView = (v: SuperAdminView) =>
    v === "users" || v === "users-add" || v === "roles" || v === "roles-add";

  return (
    <aside
      className={`relative hidden h-full shrink-0 overflow-hidden rounded-tr-[6px] rounded-br-[6px] rounded-tl-none rounded-bl-none bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition-[width] duration-300 ease-out lg:flex ${
        isSidebarExpanded ? "w-[290px]" : "w-[82px]"
      }`}
    >
      <div
        className={`absolute inset-0 flex flex-col p-5 transition-opacity duration-200 ${
          isSidebarExpanded ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <NdnMark />
            <div>
              <div className="text-lg font-black text-slate-900">Next Day Nutra</div>
              <div className="text-xs font-medium uppercase tracking-[0.28em] text-slate-400">Super Admin</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarExpanded(false)}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Collapse sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-7">
          {menuGroups.map((group) => (
            <div key={group.title}>
              <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.26em] text-slate-400">{group.title}</div>
              <div className="space-y-1.5">
                {group.items.map((item) => {
                  const isActive = item.children ? isUsersView(view) : item.view === view;

                  return (
                    <div key={item.label}>
                      <Link
                        className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                          isActive ? "" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                        style={isActive ? { backgroundColor: brand.tealSoft, color: brand.teal } : undefined}
                        href={item.href}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1">{item.label}</span>
                        {item.children && <ChevronRight className={`h-4 w-4 transition ${isActive ? "rotate-90" : ""}`} />}
                      </Link>

                      {item.children && isActive && (
                        <div className="ml-6 mt-2 space-y-1 border-l border-slate-200 pl-4">
                          {item.children.map((child) => (
                            <Link
                              key={child.label}
                              href={child.href}
                              className={`block rounded-xl px-3 py-2 text-sm font-medium transition ${
                                child.view === view ? "" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                              }`}
                              style={child.view === view ? { backgroundColor: brand.orangeSoft, color: brand.orange } : undefined}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>



        <div className="mt-8 flex items-center gap-3 rounded-[22px] border border-slate-200 px-4 py-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: brand.orangeSoft, color: brand.orange }}>SA</div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-bold text-slate-900">Super Admin</div>
            <div className="truncate text-sm text-slate-500">Security and workspace owner</div>
          </div>
        </div>
      </div>

      <div
        className={`flex w-full flex-col items-center justify-between px-3 py-5 transition-opacity duration-200 ${
          isSidebarExpanded ? "pointer-events-none opacity-0" : "pointer-events-auto opacity-100"
        }`}
      >
        <div className="space-y-5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsSidebarExpanded(true)}
                className="rounded-2xl transition"
                aria-label="Expand sidebar"
              >
                <NdnMark compact />
              </button>
            </div>
            <div className="rounded-2xl bg-[#f7faf7] px-2 py-3">
              <div className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">M</div>
              <div className="space-y-2">
                {sidebarItems.map((item) => (
                  <Link
                    key={item.label}
                    title={item.label}
                    onClick={() => setIsSidebarExpanded(true)}
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl transition ${
                      item.view === view
                        ? ""
                        : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    }`}
                    style={item.view === view ? { backgroundColor: brand.tealSoft, color: brand.teal } : undefined}
                    href={item.href}
                  >
                    <item.icon className="h-5 w-5" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: `linear-gradient(135deg, ${brand.navy}, ${brand.orange})` }}>
          SA
        </div>
      </div>
    </aside>
  );
}
