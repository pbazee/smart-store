import { unstable_noStore as noStore } from "next/cache";
import { AnnouncementBarClient } from "@/components/layout/announcement-bar-client";
import { getActiveAnnouncementMessages } from "@/lib/announcement-service";

export async function AnnouncementBar() {
  noStore();

  const announcements = await getActiveAnnouncementMessages();

  if (announcements.length === 0) {
    return null;
  }

  return <AnnouncementBarClient announcements={announcements} />;
}
