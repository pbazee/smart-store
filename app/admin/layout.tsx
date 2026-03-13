import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getNewsletterSubscribers } from "@/lib/newsletter-service";
import { getSessionUser } from "@/lib/session-user";

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

  const subscribers = await getNewsletterSubscribers();

  return <AdminShell subscriberCount={subscribers.length}>{children}</AdminShell>;
}
