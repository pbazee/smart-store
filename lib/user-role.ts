import type { UserRole } from "@/types";

export const DEMO_AUTH_COOKIE = "ske_demo_auth";

export function normalizeUserRole(role?: string | null): UserRole {
  const normalizedRole = role?.trim().toLowerCase();

  if (normalizedRole === "admin") {
    return "admin";
  }

  if (normalizedRole === "customer") {
    return "customer";
  }

  return "guest";
}

export function parseDemoAuthCookie(value?: string | null) {
  if (!value) {
    return null;
  }

  const [role, label] = value.split(":");
  const normalizedRole = normalizeUserRole(role);
  if (normalizedRole === "guest") {
    return null;
  }

  return {
    role: normalizedRole,
    label: label || (normalizedRole === "admin" ? "Demo Admin" : "Demo Customer"),
  };
}

export function serializeDemoAuthCookie(input: {
  role: Exclude<UserRole, "guest">;
  label: string;
}) {
  return `${input.role}:${input.label.replace(/[:;]/g, "")}`;
}
