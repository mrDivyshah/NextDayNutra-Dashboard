import type { RoleRecord } from "@/lib/roles";

export function formatRoleName(role: RoleRecord | undefined, fallback: string) {
  return role?.name || fallback.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}
