import { normalizeUserRole } from "@/lib/user-role";

const PROTECTED_ADMIN_EMAILS = new Set(["peterkinuthia726@gmail.com"]);

export function normalizeEmailAddress(email?: string | null) {
  return email?.trim().toLowerCase() ?? null;
}

export function isProtectedAdminEmail(email?: string | null) {
  const normalizedEmail = normalizeEmailAddress(email);
  return normalizedEmail ? PROTECTED_ADMIN_EMAILS.has(normalizedEmail) : false;
}

export function resolveAuthenticatedRole(input: {
  email?: string | null;
  role?: string | null;
}): "admin" | "customer" {
  return isProtectedAdminEmail(input.email) || normalizeUserRole(input.role) === "admin"
    ? "admin"
    : "customer";
}

export function resolveDatabaseUserRole(input: {
  email?: string | null;
  role?: string | null;
}): "ADMIN" | "CUSTOMER" {
  return resolveAuthenticatedRole(input) === "admin" ? "ADMIN" : "CUSTOMER";
}
