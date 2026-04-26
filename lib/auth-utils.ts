import { getCachedSessionUser } from "@/lib/auth-cache";

/**
 * All helpers here use getCachedSessionUser which deduplicates the DB call
 * via React cache() — any number of callers within the same server request
 * share a single DB round-trip.
 */

/**
 * Check if current user is authenticated
 */
export async function isAuthenticated() {
  const user = await getCachedSessionUser();
  return !!user;
}

/**
 * Get current user ID
 */
export async function getCurrentUserId() {
  const user = await getCachedSessionUser();
  return user?.id ?? null;
}

/**
 * Check if user is admin (can be extended with role claims)
 * Returns true if admin, false otherwise
 */
export async function isAdminUser() {
  const user = await getCachedSessionUser();
  return user?.role === "admin";
}

/**
 * Protect a server function - throws error if not authenticated
 */
export async function requireAuth() {
  const user = await getCachedSessionUser();
  if (!user) {
    throw new Error("Unauthorized: User must be logged in");
  }
  return user.id;
}

/**
 * Check if user is admin and authenticated.
 * Returns true if admin, false otherwise (handles both unauthenticated and non-admin).
 */
export async function requireAdminAuth() {
  const user = await getCachedSessionUser();
  if (!user) {
    return false;
  }
  return user.role === "admin";
}
