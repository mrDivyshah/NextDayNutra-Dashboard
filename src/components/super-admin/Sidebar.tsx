"use client";

import Link from "next/link";
import { ChevronRight, LayoutDashboard, Users, FolderOpen, Settings, BarChart3, FormInput, Bell, Mail, MessageSquare, Activity, FileText, Bug, Zap, ShieldCheck, HelpCircle, Palette } from "lucide-react";
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
      { label: "Branding", view: "branding" as SuperAdminView, href: "/super-admin/branding", icon: Palette },
    ],
  },
  {
    title: "Insights",
    items: [
      {
        label: "Analytics",
        view: "analytics" as SuperAdminView,
        href: "/super-admin/analytics",
        icon: BarChart3,
        children: [
          { label: "System Logs", view: "analytics-logs" as SuperAdminView, href: "/super-admin/analytics/logs" },
          { label: "Active Users", view: "analytics-active" as SuperAdminView, href: "/super-admin/analytics/active" },
          { label: "Trending Slugs", view: "analytics-slugs" as SuperAdminView, href: "/super-admin/analytics/slugs" },
          { label: "Error Logs", view: "analytics-errors" as SuperAdminView, href: "/super-admin/analytics/errors" },
        ],
      },
    ],
  },
  {
    title: "Communications",
    items: [
      { label: "Forms", view: "forms" as SuperAdminView, href: "/super-admin/forms", icon: FormInput },
      {
        label: "Notifications",
        view: "notifications" as SuperAdminView,
        href: "/super-admin/notifications",
        icon: Bell,
        children: [
          { label: "Email Campaigns", view: "notifications-emails" as SuperAdminView, href: "/super-admin/notifications/emails" },
          { label: "SMS Alerts", view: "notifications-sms" as SuperAdminView, href: "/super-admin/notifications/sms" },
        ],
      },
    ],
  },
  {
    title: "System & Security",
    items: [
      { label: "Security", view: "security" as SuperAdminView, href: "/super-admin/security", icon: ShieldCheck },
      { label: "Support", view: "support" as SuperAdminView, href: "/super-admin/support", icon: HelpCircle },
      { label: "Settings", view: "settings" as SuperAdminView, href: "/super-admin/settings", icon: Settings },
    ],
  },
];

const sidebarItems = menuGroups.flatMap((group) => group.items);

export function Sidebar({ view, isSidebarExpanded, setIsSidebarExpanded }: SidebarProps) {
  const isChildActive = (item: (typeof menuGroups)[0]["items"][0]) => {
    if (item.view === view) return true;
    if (item.children?.some((c) => c.view === view)) return true;
    return false;
  };

  return (
    <aside
      className={`relative hidden h-full shrink-0 overflow-hidden border-r border-black/5 bg-[#F1EAE8] transition-[width] duration-300 ease-out lg:flex ${
        isSidebarExpanded ? "w-[240px]" : "w-[64px]"
      }`}
    >
      <div
        className={`absolute inset-0 flex flex-col pt-4 transition-opacity duration-200 ${
          isSidebarExpanded ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="flex-1 space-y-6 overflow-y-auto px-3 custom-scrollbar">
          {menuGroups.map((group) => (
            <div key={group.title}>
              <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">{group.title}</div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = isChildActive(item);

                  return (
                    <div key={item.label}>
                      <Link
                        className={`group flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all ${
                          isActive 
                            ? "bg-white text-slate-900 shadow-sm" 
                            : "text-slate-600 hover:bg-black/5 hover:text-slate-900"
                        }`}
                        href={item.href}
                      >
                        <item.icon className={`h-4.5 w-4.5 transition ${isActive ? "text-emerald-600" : ""}`} />
                        <span className="flex-1">{item.label}</span>
                        {item.children && <ChevronRight className={`h-3.5 w-3.5 transition ${isActive ? "rotate-90" : ""}`} />}
                      </Link>

                      {item.children && isActive && (
                        <div className="mt-1 space-y-0.5 pl-4 animate-in slide-in-from-top-2 duration-200">
                          {item.children.map((child) => (
                            <Link
                              key={child.label}
                              href={child.href}
                              className={`block rounded-md px-3 py-1 text-[12px] font-medium transition ${
                                child.view === view 
                                  ? "bg-white/60 text-emerald-700 font-bold" 
                                  : "text-slate-500 hover:bg-black/5 hover:text-slate-900"
                              }`}
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

        {/* Sidebar Footer */}
        <div className="border-t border-black/5 p-4">
           <button 
             onClick={() => setIsSidebarExpanded(false)}
             className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-slate-500 hover:bg-black/5"
           >
              <ChevronRight className="h-4 w-4 rotate-180" />
              <span className="text-xs font-bold">Collapse</span>
           </button>
        </div>
      </div>

      {/* Collapsed State */}
      <div
        className={`flex w-full flex-col items-center pt-6 transition-opacity duration-200 ${
          isSidebarExpanded ? "pointer-events-none opacity-0" : "pointer-events-auto opacity-100"
        }`}
      >
        <div className="space-y-2">
          {sidebarItems.map((item) => (
            <Link
              key={item.label}
              title={item.label}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition ${
                isChildActive(item)
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-slate-500 hover:bg-black/5 hover:text-slate-700"
              }`}
              href={item.href}
            >
              <item.icon className="h-5 w-5" />
            </Link>
          ))}
          
          <button 
             onClick={() => setIsSidebarExpanded(true)}
             className="mt-4 flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-black/5"
           >
              <ChevronRight className="h-4 w-4" />
           </button>
        </div>
      </div>
    </aside>
  );
}
