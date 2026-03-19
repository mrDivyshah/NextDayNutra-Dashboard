"use client";

import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import type { AppRole, RoleRecord } from "@/lib/roles";
import { formatRoleName } from "./utils";
import { brand } from "./brand";
import type { ManagedUser, AdminUsersResponse, CreateUserForm, CreateRoleForm } from "./types";

const initialCreateForm: CreateUserForm = {
  name: "",
  email: "",
  password: "",
  role: "customer" as AppRole,
  isActive: true,
  redirectUrl: "",
  additionalAccess: "",
};

const initialCreateRoleForm: CreateRoleForm = {
  name: "",
  key: "",
  description: "",
  isSystem: false,
  redirectUrl: "",
  _keyTouched: false,
};

export function useSuperAdminDashboard() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [roleOptions, setRoleOptions] = useState<Partial<RoleRecord>[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalRoles, setTotalRoles] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [rolePage, setRolePage] = useState(1);
  const [userLimit, setUserLimit] = useState(50);
  const [roleLimit, setRoleLimit] = useState(50);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createForm, setCreateForm] = useState<CreateUserForm>(initialCreateForm);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editPassword, setEditPassword] = useState("");
  const [search, setSearch] = useState("");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const deferredSearch = useDeferredValue(search);
  const [isPending, startTransition] = useTransition();
  const [createRoleForm, setCreateRoleForm] = useState<CreateRoleForm>(initialCreateRoleForm);
  const [roleFormError, setRoleFormError] = useState("");
  const [roleFormSuccess, setRoleFormSuccess] = useState("");
  const [isRolePending, startRoleTransition] = useTransition();

  const [isAddingRole, setIsAddingRole] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleRecord | null>(null);

  const loadUsers = async ({ setLoading = true, upage, rpage, ulimit, rlimit }: { setLoading?: boolean; upage?: number; rpage?: number; ulimit?: number; rlimit?: number } = {}) => {
    if (setLoading) {
      setIsLoading(true);
    }

    const up = upage ?? userPage;
    const rp = rpage ?? rolePage;
    const ul = ulimit ?? userLimit;
    const rl = rlimit ?? roleLimit;

    setError("");
    const response = await fetch(`/api/admin/users?userPage=${up}&userLimit=${ul}&rolePage=${rp}&roleLimit=${rl}`, { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as any;

    if (!response.ok) {
      setError(data.error || "Unable to load users.");
      if (setLoading) {
        setIsLoading(false);
      }
      return;
    }

    setUsers(Array.isArray(data.users) ? data.users : []);
    setRoles(Array.isArray(data.roles) ? data.roles : []);
    setRoleOptions(Array.isArray(data.roleOptions) ? data.roleOptions : []);
    setTotalUsers(data.totalUsers || 0);
    setTotalRoles(data.totalRoles || 0);

    if (setLoading) {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, [userPage, rolePage, userLimit, roleLimit]);

  const filteredUsers = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase();
    if (!term) return users;

    return users.filter((user) => {
      const roleName = formatRoleName(roles.find((role) => role.key === user.role), user.role).toLowerCase();
      return [user.name, user.email, roleName].some((value) => value.toLowerCase().includes(term));
    });
  }, [users, deferredSearch, roles]);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((user) => user.isActive).length;
    const inactive = total - active;
    const superAdmins = users.filter((user) => user.role === "super_admin").length;
    const managers = users.filter((user) => user.role.includes("manager")).length;

    return { total, active, inactive, superAdmins, managers };
  }, [users]);

  const createRoleOptions =
    roleOptions.length > 0
      ? roleOptions
      : [{ id: 0, key: "customer", name: "Customer", description: null, isSystem: true } as any];

  const roleMix = useMemo(() => {
    return roles
      .map((role) => ({
        ...role,
        count: users.filter((user) => user.role === role.key).length,
      }))
      .filter((role) => role.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [roles, users]);

  const chartBars = useMemo(() => {
    const topRoles = roleMix.length > 0 ? roleMix.slice(0, 5) : [];
    const fallback = [
      { name: "Users", count: stats.total },
      { name: "Active", count: stats.active },
      { name: "Managers", count: stats.managers },
      { name: "Super", count: stats.superAdmins },
      { name: "Inactive", count: stats.inactive },
    ];

    const source = topRoles.length > 0 ? topRoles.map((role) => ({ name: role.name, count: role.count })) : fallback;
    const max = Math.max(...source.map((item) => item.count), 1);

    return source.map((item, index) => ({
      ...item,
      height: `${Math.max(18, Math.round((item.count / max) * 100))}%`,
      accent: index % 2 === 0 ? brand.navy : brand.orange,
    }));
  }, [roleMix, stats]);

  const newestUsers = useMemo(() => {
    return [...users]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4);
  }, [users]);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error || "Unable to create user.");
      return;
    }

    setCreateForm({
      ...initialCreateForm,
      role: createRoleOptions[0]?.key || "customer",
    });
    setSuccess("User created successfully.");
    startTransition(() => {
      void loadUsers({ setLoading: false });
    });
  };

  const handleInlineUpdate = async (user: ManagedUser, updates: Partial<ManagedUser> & { password?: string }) => {
    setError("");
    setSuccess("");

    const response = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data.error || "Unable to update user.");
      return;
    }

    setEditingUserId(null);
    setEditPassword("");
    setSuccess("User updated successfully.");
    startTransition(() => {
      void loadUsers({ setLoading: false });
    });
  };

  const handleCreateRole = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRoleFormError("");
    setRoleFormSuccess("");

    const isEditing = !!editingRole;
    const url = isEditing ? `/api/admin/roles/${editingRole.id}` : "/api/admin/roles";
    const method = isEditing ? "PATCH" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: isEditing ? undefined : createRoleForm.key,
        name: createRoleForm.name,
        description: createRoleForm.description || null,
        isSystem: createRoleForm.isSystem,
        redirectUrl: createRoleForm.redirectUrl || null,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setRoleFormError(data.error || `Unable to ${isEditing ? "update" : "create"} role.`);
      return;
    }

    setCreateRoleForm(initialCreateRoleForm);
    setEditingRole(null);
    setIsAddingRole(false);
    setRoleFormSuccess(`Role ${isEditing ? "updated" : "created"} successfully.`);
    startRoleTransition(() => {
      void loadUsers({ setLoading: false });
    });
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!confirm("Are you sure you want to delete this role? This action cannot be undone.")) return;
    
    setRoleFormError("");
    const response = await fetch(`/api/admin/roles/${roleId}`, {
      method: "DELETE",
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setRoleFormError(data.error || "Unable to delete role.");
      return;
    }

    startRoleTransition(() => {
      void loadUsers({ setLoading: false });
    });
  };

  const startEditingRole = (role: RoleRecord) => {
    const form: CreateRoleForm = {
      name: role.name,
      key: role.key,
      description: role.description || "",
      isSystem: role.isSystem,
      redirectUrl: role.redirectUrl || "",
      _keyTouched: true,
    };
    setCreateRoleForm(form);
    setEditingRole(role);
    setIsAddingRole(false);
    setRoleFormError("");
    setRoleFormSuccess("");
  };

  return {
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
    // Role form
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
  };
}
