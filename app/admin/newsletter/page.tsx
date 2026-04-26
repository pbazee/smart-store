import { redirect } from "next/navigation";
import { NewsletterManager } from "@/app/admin/newsletter/newsletter-manager";
import { requireAdminAuth } from "@/lib/auth-utils";
import { getNewsletterSubscribers, isResendConfigured } from "@/lib/newsletter-service";

// Removed force-dynamic for better navigation speed

export default async function AdminNewsletterPage() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    redirect("/sign-in?redirect_url=%2Fadmin%2Fnewsletter");
  }

  let subscribers: Awaited<ReturnType<typeof getNewsletterSubscribers>> = [];
  try {
    subscribers = await getNewsletterSubscribers();
  } catch (error) {
    console.error("[AdminNewsletterPage] Failed to load subscribers:", error);
  }

  const resendConfigured = isResendConfigured();

  return (
    <NewsletterManager
      initialSubscribers={subscribers}
      resendConfigured={resendConfigured}
    />
  );
}

