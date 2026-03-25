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
    console.log(`[Announcements] Database has ${existingCount} existing announcements, skipping seed`);
    return;
  }

  console.log("[Announcements] Database is empty, seeding default announcements...");
  await prisma.announcementMessage.createMany({
    data: DEFAULT_ANNOUNCEMENT_MESSAGE_SEEDS,
    skipDuplicates: true,
  });
  console.log(`[Announcements] Seeded ${DEFAULT_ANNOUNCEMENT_MESSAGE_SEEDS.length} announcements`);
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

    console.log(`[Announcements] Loaded ${messages.length} announcements from database${activeOnly ? " (active only)" : ""}`);
    return messages as AnnouncementMessage[];
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Announcements] Database query failed:", errorMsg, {
      dbUrl: process.env.DATABASE_URL ? "set" : "NOT SET",
      fallbackOnError,
      seedIfEmpty,
    });

    if (fallbackOnError) {
      console.warn("[Announcements] Falling back to single fallback announcement");
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
