import { getSessionUser } from "@/lib/session-user";

/**
 * Check if current user is authenticated
 */
export async function isAuthenticated() {
  const user = await getSessionUser();
  return !!user;
}

/**
 * Get current user ID
 */
export async function getCurrentUserId() {
  const user = await getSessionUser();
  return user?.id ?? null;
}

/**
 * Check if user is admin (can be extended with role claims)
 * Returns true if admin, false otherwise
 */
export async function isAdminUser() {
  const user = await getSessionUser();
  return user?.role === "admin";
}

/**
 * Protect a server function - throws error if not authenticated
 */
export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized: User must be logged in");
  }
  return user.id;
}

/**
 * Check if user is admin and authenticated
 * Returns true if admin, false otherwise (handles both unauthenticated and non-admin)
 */
export async function requireAdminAuth() {
  const user = await getSessionUser();
  if (!user) {
    return false;
  }

  return user.role === "admin";
}
