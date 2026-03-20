import { redirect } from "next/navigation";
import { fetchAdminStoreSettings } from "@/app/admin/settings/actions";
import { StoreSettingsForm } from "@/app/admin/settings/store-settings-form";
import { FAQManager } from "@/app/admin/settings/faq-manager";
import { fetchAdminFAQs } from "@/app/admin/settings/faq-actions";
import { requireAdminAuth } from "@/lib/auth-utils";

export default async function AdminSettingsPage() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    redirect("/sign-in?redirect_url=%2Fadmin%2Fsettings");
  }

  const [settings, faqs] = await Promise.all([
    fetchAdminStoreSettings(),
    fetchAdminFAQs(),
  ]);

  return (
    <div className="space-y-10">
      <StoreSettingsForm initialSettings={settings} />
      <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950 p-6">
        <FAQManager initialFAQs={faqs} />
      </div>
    </div>
  );
}
