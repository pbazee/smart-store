import { redirect } from "next/navigation";
import { NewsletterManager } from "@/app/admin/newsletter/newsletter-manager";
import { fetchAdminNewsletterSubscribers } from "@/app/admin/newsletter/actions";
import { requireAdminAuth } from "@/lib/auth-utils";

export default async function AdminNewsletterPage() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    redirect("/login?redirect_url=%2Fadmin%2Fnewsletter");
  }

  const subscribers = await fetchAdminNewsletterSubscribers();

  return <NewsletterManager initialSubscribers={subscribers} />;
}
