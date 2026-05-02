import {
  DEFAULT_ANNOUNCEMENT_MESSAGE_SEEDS,
  createFallbackAnnouncementMessage,
} from "@/lib/default-announcements";
import { prisma } from "@/lib/prisma";
import type { AnnouncementMessage } from "@/types";

type AnnouncementQueryOptions = {
  activeOnly?: boolean;
  fallbackOnError?: boolean;
  seedIfEmpty?: boolean;
};

async function ensureAnnouncementMessagesSeeded() {
  const existingCount = await prisma.announcementMessage.count();
  if (existingCount > 0) {
    if (process.env.NODE_ENV === "development" && process.env.DEBUG_ANNOUNCEMENTS === "true") {
      console.log(`[Announcements] Database has ${existingCount} existing announcements, skipping seed`);
    }
    return;
  }

  await prisma.announcementMessage.createMany({
    data: DEFAULT_ANNOUNCEMENT_MESSAGE_SEEDS,
    skipDuplicates: true,
  });
}

export async function getAnnouncementMessages(
  options: AnnouncementQueryOptions = {}
): Promise<AnnouncementMessage[]> {
  const { activeOnly = false, fallbackOnError = false, seedIfEmpty = false } = options;

  try {
    if (seedIfEmpty) {
      await ensureAnnouncementMessagesSeeded();
    }

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
    seedIfEmpty: true,
  });
}
