import { redirect } from "next/navigation";
import { WhatsAppSettingsForm } from "@/app/admin/whatsapp-settings/whatsapp-settings-form";
import { fetchAdminWhatsAppSettings } from "@/app/admin/whatsapp-settings/actions";
import { requireAdminAuth } from "@/lib/auth-utils";

export default async function AdminWhatsAppSettingsPage() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    redirect("/login?redirect_url=%2Fadmin%2Fwhatsapp-settings");
  }

  const settings = await fetchAdminWhatsAppSettings();

  return <WhatsAppSettingsForm initialSettings={settings} />;
}
