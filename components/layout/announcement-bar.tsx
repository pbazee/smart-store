import { AnnouncementBarClient } from "@/components/layout/announcement-bar-client";
import { getHomepageShellData } from "@/lib/homepage-data";
import type { AnnouncementMessage } from "@/types";

export async function AnnouncementBar({
  announcements: providedAnnouncements,
}: {
  announcements?: AnnouncementMessage[];
}) {
  let announcements = providedAnnouncements;

  if (!announcements) {
    announcements = (await getHomepageShellData()).announcements;
  }

  if (announcements.length === 0) {
    return null;
  }

  return <AnnouncementBarClient announcements={announcements} />;
}
