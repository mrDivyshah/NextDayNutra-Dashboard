"use client";

import type { SuperAdminView } from "./types";
import { Sidebar } from "./Sidebar";
import { DashboardOverview } from "./DashboardOverview";
import { UserRegistry } from "./UserRegistry";
import { UserForm } from "./UserForm";
import { RoleForm } from "./RoleForm";
import { RolesRegistry } from "./RolesRegistry";
import { AssetsView } from "./AssetsView";
import { SettingsView } from "./SettingsView";
import { DashboardHeader } from "./DashboardHeader";
import { NdnMark } from "./NdnMark";
import { useState, useMemo, useTransition, useDeferredValue } from "react";
import { 
  BarChart3, FormInput, Bell, Search, KeyRound, LayoutDashboard, Users, 
  FolderOpen, Settings, UserPlus, Plus, Palette, ShieldCheck, HelpCircle 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSuperAdminDashboard } from "./hooks";

export default function SuperAdminDashboard({ view = "dashboard" }: { view?: SuperAdminView }) {
  const {
    users,
    roles,
    isLoading,
    error,
    success,
    createForm,
    setCreateForm,
    editingUserId,
    setEditingUserId,
    editPassword,
    setEditPassword,
    search,
    setSearch,
    isSidebarExpanded,
    setIsSidebarExpanded,
    isPending,
    filteredUsers,
    stats,
    createRoleOptions,
    roleMix,
    chartBars,
    newestUsers,
    handleCreate,
    handleInlineUpdate,
    createRoleForm,
    setCreateRoleForm,
    roleFormError,
    roleFormSuccess,
    isRolePending,
    handleCreateRole,
    handleDeleteRole,
    isAddingRole,
    setIsAddingRole,
    editingRole,
    setEditingRole,
    startEditingRole,
    // Pagination
    userPage,
    setUserPage,
    rolePage,
    setRolePage,
    totalUsers,
    totalRoles,
    userLimit,
    setUserLimit,
    roleLimit,
    setRoleLimit,
    roleOptions,
  } = useSuperAdminDashboard();

  const pageMeta: Record<SuperAdminView, { eyebrow: string; title: string; description: string }> = {
    dashboard: {
      eyebrow: "Super Admin Control",
      title: "Dashboard",
      description: "Monitor account health, manage database-backed roles, and provision access from a separate modern control surface.",
    },
    users: {
      eyebrow: "User Management",
      title: "Users",
      description: "Create accounts, search users, update roles, and handle activation directly from one place.",
    },
    "users-add": {
      eyebrow: "User Management",
      title: "Add user",
      description: "Create a new user account with role, password, and activation status.",
    },
    roles: {
      eyebrow: "Access Control",
      title: "Roles",
      description: "View all roles available for user assignment across the system.",
    },
    "roles-add": {
      eyebrow: "Access Control",
      title: "Add role",
      description: "Define a new system role with custom redirect rules and default permissions.",
    },
    branding: {
      eyebrow: "Branding",
      title: "Brand Elements",
      description: "Manage system-wide colors, logos, and UI tokens for consistent UX.",
    },
    security: {
      eyebrow: "System & Security",
      title: "Security Settings",
      description: "Administer platform-level security protocols, authentication keys, and session control.",
    },
    support: {
      eyebrow: "System & Security",
      title: "Support & Help",
      description: "Direct access to documentation, platform support, and system health status.",
    },
    analytics: {
      eyebrow: "Platform Insights",
      title: "Analytics Overview",
      description: "Aggregated performance data, user trends, and system health metrics.",
    },
    "analytics-logs": {
      eyebrow: "Insights > Analytics",
      title: "System Logs",
      description: "Comprehensive audit trail of system events and administrative actions.",
    },
    "analytics-active": {
      eyebrow: "Insights > Analytics",
      title: "Current Active Users",
      description: "Real-time monitoring of users currently engaged with the platform.",
    },
    "analytics-slugs": {
      eyebrow: "Insights > Analytics",
      title: "Trending Slugs",
      description: "Analysis of the most frequently accessed content and navigation paths.",
    },
    "analytics-errors": {
      eyebrow: "Insights > Analytics",
      title: "Bugs & Error Logs",
      description: "Identification and tracking of application exceptions and runtime issues.",
    },
    forms: {
      eyebrow: "Communications",
      title: "Forms Management",
      description: "Configure and monitor interactive user forms and data collection points.",
    },
    notifications: {
      eyebrow: "Communications",
      title: "Notifications Center",
      description: "Central hub for managing multi-channel user alerts and messages.",
    },
    "notifications-emails": {
      eyebrow: "Communications > Notifications",
      title: "Email Campaigns",
      description: "Design and track bulk email communications and automated sequences.",
    },
    "notifications-sms": {
      eyebrow: "Communications > Notifications",
      title: "SMS Alerts",
      description: "Manage direct short-message alerts for time-sensitive updates.",
    },
    assets: {
      eyebrow: "Asset Center",
      title: "Upload Folder Data",
      description: "Manage asset folders, upload pipelines, and file governance for operational content.",
    },
    settings: {
      eyebrow: "Platform Settings",
      title: "Settings",
      description: "Control workspace defaults, security preferences, and super admin configuration.",
    },
  };

  const currentPage = pageMeta[view];

  return (
    <main className="fixed inset-0 flex flex-col overflow-hidden bg-[#ebebeb] font-sans text-slate-900">
      {/* Global Top Banner - Shopify Style */}
      <header className="z-50 flex h-14 w-full shrink-0 border-b border-black/10 bg-[#140036] px-4">
        <div className="flex w-[240px] shrink-0 items-center gap-2">
          <NdnMark compact />
          <span className="text-sm font-bold tracking-tight text-white uppercase">Next Day Nutra</span>
        </div>
        
        <div className="flex flex-1 items-center justify-between px-4">
          <div className="relative w-full max-w-md m-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search anything..." 
              className="h-8 w-full rounded-md border-0 bg-white/10 pl-10 pr-4 text-[13px] text-white outline-none transition focus:bg-white focus:text-slate-900"
            />
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1 text-[11px] font-bold text-white hover:bg-white/20">
              <KeyRound className="h-3.5 w-3.5" />
              View as
            </button>
            <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-[11px] font-black text-white shadow-sm ring-2 ring-white/10">SA</div>
          </div>
        </div>
      </header>

      {/* Main Work Surface */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          view={view}
          isSidebarExpanded={isSidebarExpanded}
          setIsSidebarExpanded={setIsSidebarExpanded}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          <section className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden px-3  custom-scrollbar bg-[#F1EAE8]/30">
            {/* Inner Dashboard Header - Now outside the card container and transparent */}
            <DashboardHeader
              title={currentPage.title}
              description={currentPage.description}
              icon={
                view === "dashboard" ? LayoutDashboard :
                view.startsWith("users") ? Users :
                view.startsWith("roles") ? KeyRound :
                view === "assets" ? FolderOpen :
                view.startsWith("analytics") ? BarChart3 :
                view === "forms" ? FormInput :
                view.startsWith("notifications") ? Bell :
                view === "settings" ? Settings :
                view === "branding" ? Palette :
                view === "security" ? ShieldCheck :
                view === "support" ? HelpCircle :
                undefined
              }
              actions={
                view === "users" ? [
                  { label: "Add user", variant: "primary", onClick: () => window.location.href = "/super-admin/users/add" }
                ] : view === "roles" ? [
                  { label: "Add role", variant: "primary", onClick: () => window.location.href = "/super-admin/roles/add" }
                ] : []
              }
            />

            <div className="flex flex-col gap-2 rounded-xl font-sans p-0">
              {view === "assets" ? (
                <AssetsView />
              ) : view === "settings" ? (
                <SettingsView />
              ) : view === "dashboard" ? (
                <DashboardOverview
                  stats={stats}
                  chartBars={chartBars}
                  roleMix={roleMix}
                  newestUsers={newestUsers}
                  roles={roles}
                  users={users}
                />
              ) : view === "users" ? (
                <UserRegistry
                  roles={roles}
                  isLoading={isLoading}
                  search={search}
                  setSearch={setSearch}
                  filteredUsers={filteredUsers}
                  editingUserId={editingUserId}
                  setEditingUserId={setEditingUserId}
                  editPassword={editPassword}
                  setEditPassword={setEditPassword}
                  handleInlineUpdate={handleInlineUpdate}
                  currentPage={userPage}
                  totalItems={totalUsers}
                  itemsPerPage={userLimit}
                  onPageChange={setUserPage}
                  onLimitChange={setUserLimit}
                />
              ) : view === "users-add" ? (
                <div className="max-w-2xl">
                  <UserForm
                    createForm={createForm}
                    setCreateForm={setCreateForm}
                    createRoleOptions={createRoleOptions}
                    handleCreate={handleCreate}
                    isPending={isPending}
                    error={error}
                    success={success}
                  />
                </div>
              ) : view === "roles" ? (
                <div className="space-y-6">
                  <RolesRegistry
                    roles={roles}
                    isLoading={isLoading}
                    onAddClick={() => setIsAddingRole(true)}
                    onEditClick={startEditingRole}
                    onDeleteClick={handleDeleteRole}
                    isActionPending={isRolePending}
                    currentPage={rolePage}
                    totalItems={totalRoles}
                    itemsPerPage={roleLimit}
                    onPageChange={setRolePage}
                    onLimitChange={setRoleLimit}
                  />
                </div>
              ) : view.startsWith("analytics") ? (
                <div className="rounded-3xl border border-dashed border-slate-200 py-32 text-center">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                    <BarChart3 className="h-8 w-8" />
                  </div>
                  <h3 className="mt-6 text-xl font-black text-slate-900">{currentPage.title}</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                    This module is currently under development. Detailed data feeds and interactive visualizations will be available soon.
                  </p>
                </div>
              ) : view === "forms" ? (
                <div className="rounded-3xl border border-dashed border-slate-200 py-32 text-center">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                    <FormInput className="h-8 w-8" />
                  </div>
                  <h3 className="mt-6 text-xl font-black text-slate-900">Forms Management</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                    Custom form builder and data collection interface is pending implementation.
                  </p>
                </div>
              ) : view.startsWith("notifications") ? (
                <div className="rounded-3xl border border-dashed border-slate-200 py-32 text-center">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                    <Bell className="h-8 w-8" />
                  </div>
                  <h3 className="mt-6 text-xl font-black text-slate-900">{currentPage.title}</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                    Gateway configuration for multi-channel notifications will be managed here.
                  </p>
                </div>
              ) : view === "roles-add" ? (
                <div className="max-w-2xl">
                  <RoleForm
                    form={createRoleForm}
                    setForm={setCreateRoleForm}
                    onSubmit={handleCreateRole}
                    isPending={isRolePending}
                    error={roleFormError}
                    success={roleFormSuccess}
                    isEditing={false}
                    onCancel={() => window.history.back()}
                  />
                </div>
              ) : view === "branding" ? (
                <div className="rounded-3xl border border-dashed border-slate-200 py-32 text-center">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                    <NdnMark />
                  </div>
                  <h3 className="mt-6 text-xl font-black text-slate-900">Brand Configuration</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                    Fine-tune colors and upload site logos. This will affect all client-facing surfaces.
                  </p>
                </div>
              ) : view === "security" ? (
                <div className="rounded-3xl border border-dashed border-slate-200 py-32 text-center">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                    <KeyRound className="h-8 w-8" />
                  </div>
                  <h3 className="mt-6 text-xl font-black text-slate-900">Security & Keys</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                    Platform-wide security settings and API credentials configuration.
                  </p>
                </div>
              ) : view === "support" ? (
                <div className="rounded-3xl border border-dashed border-slate-200 py-32 text-center">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                    <Bell className="h-8 w-8" />
                  </div>
                  <h3 className="mt-6 text-xl font-black text-slate-900">Support Center</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                    System health status and technical documentation for super admin tools.
                  </p>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>

      {/* Modal Overlay for Role Form */}
      {(isAddingRole || !!editingRole) && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => {
              setIsAddingRole(false);
              setEditingRole(null);
            }}
          />
          
          {/* Modal Content */}
          <div className="relative z-10000 w-full max-w-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <RoleForm
              form={createRoleForm}
              setForm={setCreateRoleForm}
              onSubmit={handleCreateRole}
              isPending={isRolePending}
              error={roleFormError}
              success={roleFormSuccess}
              isEditing={!!editingRole}
              onCancel={() => {
                setIsAddingRole(false);
                setEditingRole(null);
              }}
            />
          </div>
        </div>
      )}
    </main>
  );
}