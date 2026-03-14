import { redirect } from "next/navigation";
import { fetchAdminStoreSettings } from "@/app/admin/settings/actions";
import { StoreSettingsForm } from "@/app/admin/settings/store-settings-form";
import { requireAdminAuth } from "@/lib/auth-utils";

export default async function AdminSettingsPage() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    redirect("/sign-in?redirect_url=%2Fadmin%2Fsettings");
  }

  const settings = await fetchAdminStoreSettings();

  return <StoreSettingsForm initialSettings={settings} />;
}
