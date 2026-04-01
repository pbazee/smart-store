import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getNewsletterSubscriberCount } from "@/lib/newsletter-service";
import { getSessionUser } from "@/lib/session-user";

export const dynamic = "force-dynamic";

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
  try {
    subscriberCount = await getNewsletterSubscriberCount();
  } catch (error) {
    console.error("[AdminLayout] Failed to load subscriber count:", error);
  }

  return <AdminShell subscriberCount={subscriberCount}>{children}</AdminShell>;
}
