import { redirect } from "next/navigation";
import { PopupsManager } from "@/app/admin/popups/popups-manager";
import { fetchAdminPopups } from "@/app/admin/popups/actions";
import { requireAdminAuth } from "@/lib/auth-utils";

export default async function AdminPopupsPage() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    redirect("/sign-in?redirect_url=%2Fadmin%2Fpopups");
  }

  const popups = await fetchAdminPopups();

  return <PopupsManager initialPopups={popups} />;
}
