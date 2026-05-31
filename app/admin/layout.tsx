import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getNewsletterSubscriberCount } from "@/lib/newsletter-service";
import { getStoreBranding } from "@/lib/store-branding";
import { getSessionUser } from "@/lib/session-user";

// Removed force-dynamic to allow Next.js to optimize layout segments.
// The layout remains dynamic due to session checks, but this allows for better
// client-side caching of the layout structure.

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/sign-in?callbackUrl=%2Fadmin%2Fdashboard");
  }

  if (sessionUser.role !== "admin") {
    redirect("/");
  }

  const [subscriberCountResult, storeSettingsResult] = await Promise.allSettled([
    getNewsletterSubscriberCount(),
    getStoreBranding(),
  ]);

  if (subscriberCountResult.status === "rejected") {
    console.error("[AdminLayout] Failed to load subscriber count:", subscriberCountResult.reason);
  }

  if (storeSettingsResult.status === "rejected") {
    console.error("[AdminLayout] Failed to load store branding:", storeSettingsResult.reason);
  }

  const subscriberCount =
    subscriberCountResult.status === "fulfilled" ? subscriberCountResult.value : 0;
  const storeSettings =
    storeSettingsResult.status === "fulfilled" ? storeSettingsResult.value : null;

  return (
    <AdminShell subscriberCount={subscriberCount} initialStoreSettings={storeSettings}>
      {children}
    </AdminShell>
  );
}
