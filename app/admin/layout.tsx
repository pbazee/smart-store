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
    redirect("/sign-in?redirect_url=%2Fadmin%2Fdashboard");
  }

  if (sessionUser.role !== "admin") {
    redirect("/");
  }

  let subscriberCount = 0;
  let storeSettings = null;
  try {
    subscriberCount = await getNewsletterSubscriberCount();
  } catch (error) {
    console.error("[AdminLayout] Failed to load subscriber count:", error);
  }

  try {
    storeSettings = await getStoreBranding();
  } catch (error) {
    console.error("[AdminLayout] Failed to load store branding:", error);
  }

  return (
    <AdminShell subscriberCount={subscriberCount} initialStoreSettings={storeSettings}>
      {children}
    </AdminShell>
  );
}
