import type { AppRole, RoleRecord } from "@/lib/roles";

export type SuperAdminView = "dashboard" | "users" | "users-add" | "roles" | "roles-add" | "assets" | "settings";

export type ManagedUser = {
  id: number;
  name: string;
  email: string;
  role: AppRole;
  isActive: boolean;
  redirectUrl?: string | null;
  additionalAccess?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type AdminUsersResponse = {
  users: ManagedUser[];
  roles: RoleRecord[];
  error?: string;
};

export type DashboardStats = {
  total: number;
  active: number;
  inactive: number;
  superAdmins: number;
  managers: number;
};

export type ChartBar = {
  name: string;
  count: number;
  height: string;
  accent: string;
};

export type RoleMix = RoleRecord & {
  count: number;
};

export type CreateUserForm = {
  name: string;
  email: string;
  password: string;
  role: AppRole;
  isActive: boolean;
  redirectUrl: string;
  additionalAccess: string;
};

export type CreateRoleForm = {
  name: string;
  key: string;
  description: string;
  isSystem: boolean;
  /** Internal flag: true once the user has manually edited the key */
  _keyTouched: boolean;
};
