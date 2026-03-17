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
      description: "Define a new reusable role key that can be assigned to users and used for permission control.",
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
    <main className="h-screen overflow-hidden bg-[#f5f7f4] text-slate-900">
      <div className="flex h-screen w-full rounded-[30px] bg-[#eef2ee] shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <Sidebar
          view={view}
          isSidebarExpanded={isSidebarExpanded}
          setIsSidebarExpanded={setIsSidebarExpanded}
        />

        <section className="min-w-0 flex-1 overflow-y-auto rounded-[6px] bg-white px-5 py-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:px-6 lg:px-7">
          <DashboardHeader
            eyebrow={currentPage.eyebrow}
            title={currentPage.title}
            description={currentPage.description}
          />

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
          ) : view === "roles-add" ? (
            <div className="max-w-2xl">
              <RoleForm
                form={createRoleForm}
                setForm={setCreateRoleForm}
                onSubmit={handleCreateRole}
                isPending={isRolePending}
                error={roleFormError}
                success={roleFormSuccess}
              />
            </div>
          ) : view === "roles" ? (
            <RolesRegistry roles={roles} isLoading={isLoading} />
          ) : null}
        </section>
      </div>
    </main>
  );
}