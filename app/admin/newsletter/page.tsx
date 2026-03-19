import { redirect } from "next/navigation";
import { NewsletterManager } from "@/app/admin/newsletter/newsletter-manager";
import { fetchAdminNewsletterSubscribers } from "@/app/admin/newsletter/actions";
import { requireAdminAuth } from "@/lib/auth-utils";
import { isResendConfigured } from "@/lib/newsletter-service";

export default async function AdminNewsletterPage() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    redirect("/sign-in?redirect_url=%2Fadmin%2Fnewsletter");
  }

  const subscribers = await fetchAdminNewsletterSubscribers();
  const resendConfigured = isResendConfigured();

  return (
    <NewsletterManager
      initialSubscribers={subscribers}
      resendConfigured={resendConfigured}
    />
  );
}

