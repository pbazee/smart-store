import { redirect } from "next/navigation";
import { AnnouncementsManager } from "@/app/admin/announcements/announcements-manager";
import { fetchAdminAnnouncements } from "@/app/admin/announcements/actions";
import { requireAdminAuth } from "@/lib/auth-utils";

export default async function AdminAnnouncementsPage() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    redirect("/login?redirect_url=%2Fadmin%2Fannouncements");
  }

  const announcements = await fetchAdminAnnouncements();

  return <AnnouncementsManager initialAnnouncements={announcements} />;
}
