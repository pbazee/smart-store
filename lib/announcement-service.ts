import { createFallbackAnnouncementMessage } from "@/lib/default-announcements";
import { prisma } from "@/lib/prisma";
import type { AnnouncementMessage } from "@/types";

type AnnouncementQueryOptions = {
  activeOnly?: boolean;
  fallbackOnError?: boolean;
  seedIfEmpty?: boolean;
};

export async function getAnnouncementMessages(
  options: AnnouncementQueryOptions = {}
): Promise<AnnouncementMessage[]> {
  const { activeOnly = false, fallbackOnError = false, seedIfEmpty = false } = options;

  try {
    const messages = await prisma.announcementMessage.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    if (process.env.NODE_ENV === "development" && process.env.DEBUG_ANNOUNCEMENTS === "true") {
      console.log(`[Announcements] Loaded ${messages.length} announcements from database${activeOnly ? " (active only)" : ""}`);
    }
    return messages as AnnouncementMessage[];
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Announcements] Database query failed:", errorMsg, {
      dbUrl: process.env.DATABASE_URL ? "set" : "NOT SET",
      fallbackOnError,
      seedIfEmpty,
    });

    if (fallbackOnError) {
      return [createFallbackAnnouncementMessage()];
    }

    return [];
  }
}

export async function getActiveAnnouncementMessages() {
  return getAnnouncementMessages({
    activeOnly: true,
    fallbackOnError: true,
    seedIfEmpty: false,
  });
}
