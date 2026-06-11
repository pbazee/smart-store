import { redirect } from "next/navigation";

/**
 * /order-confirmation/[id] — this route is no longer used.
 * Post-payment flow now redirects to /track-order which shows all orders.
 * Redirect any old bookmarks or external links to track-order.
 */
export default function OrderConfirmationPage() {
  redirect("/track-order");
}
