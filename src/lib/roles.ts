export type AppRole = string;

export type RoleRecord = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  redirectUrl?: string | null;
  createdAt?: Date | string;
};

export function isSuperAdminRole(role: string | undefined | null) {
  return role === "super_admin";
}
