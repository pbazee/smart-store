import { cache } from "react";
import { getSessionUser } from "@/lib/session-user";

/**
 * React `cache()` deduplicates calls within the same server request.
 * Any number of server components / layouts calling `getCachedSessionUser()`
 * in the same request will share a single DB round-trip.
 */
export const getCachedSessionUser = cache(async () => {
  return getSessionUser();
});

/**
 * Cached admin check — returns the session user if they are an admin, null otherwise.
 * Safe to call from multiple server components; only hits the DB once per request.
 */
export const getCachedAdminUser = cache(async () => {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return null;
  return user;
});
