import { unstable_noStore as noStore } from "next/cache";
import { AnnouncementBarClient } from "@/components/layout/announcement-bar-client";
import { getActiveAnnouncementMessages } from "@/lib/announcement-service";
import type { AnnouncementMessage } from "@/types";

export async function AnnouncementBar({
  announcements: providedAnnouncements,
}: {
  announcements?: AnnouncementMessage[];
}) {
  let announcements = providedAnnouncements;

  if (!announcements) {
    noStore();
    announcements = await getActiveAnnouncementMessages();
  }

  if (announcements.length === 0) {
    return null;
  }

  return <AnnouncementBarClient announcements={announcements} />;
}
