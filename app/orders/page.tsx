import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session-user";

/**
 * /orders — redirect to /track-order which already shows the full
 * order list for the logged-in user with thumbnails, status timeline, etc.
 *
 * Previously this page had its own data-fetching using an API route that
 * queried by userId, which failed silently for many orders that were only
 * linked by customerEmail (e.g. guest-checkout orders later signed in).
 * The track-order page uses email-based lookup which is always correct.
 */
export default async function OrdersPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/sign-in?callbackUrl=/track-order");
  }

  redirect("/track-order");
}
