import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminAuth } from "@/lib/auth-utils";
import { getNewsletterSubscribers } from "@/lib/newsletter-service";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdmin = await requireAdminAuth();

  if (!isAdmin) {
    redirect("/login?redirect_url=%2Fadmin");
  }

  const subscribers = await getNewsletterSubscribers();

  return <AdminShell subscriberCount={subscribers.length}>{children}</AdminShell>;
}
