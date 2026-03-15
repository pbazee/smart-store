import {
  DEFAULT_ANNOUNCEMENT_MESSAGE_SEEDS,
  createFallbackAnnouncementMessage,
} from "@/lib/default-announcements";
import { shouldUseMockData } from "@/lib/live-data-mode";
import { prisma } from "@/lib/prisma";
import type { AnnouncementMessage } from "@/types";

type AnnouncementQueryOptions = {
  activeOnly?: boolean;
  fallbackOnError?: boolean;
  seedIfEmpty?: boolean;
};

let demoAnnouncementsState: AnnouncementMessage[] = DEFAULT_ANNOUNCEMENT_MESSAGE_SEEDS.map(
  (seed, index) => ({
    ...seed,
    createdAt: new Date(`2026-01-0${index + 1}T09:00:00.000Z`),
    updatedAt: new Date(`2026-01-0${index + 1}T09:00:00.000Z`),
  })
);

function cloneAnnouncement(message: AnnouncementMessage): AnnouncementMessage {
  return {
    ...message,
    createdAt:
      message.createdAt instanceof Date ? new Date(message.createdAt) : message.createdAt,
    updatedAt:
      message.updatedAt instanceof Date ? new Date(message.updatedAt) : message.updatedAt,
  };
}

function sortAnnouncements(messages: AnnouncementMessage[]) {
  return [...messages].sort((left, right) => {
    const orderDifference = left.order - right.order;
    if (orderDifference !== 0) {
      return orderDifference;
    }

    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  });
}

export function getDemoAnnouncementMessages(options: AnnouncementQueryOptions = {}) {
  const { activeOnly = false } = options;
  const messages = activeOnly
    ? demoAnnouncementsState.filter((message) => message.isActive)
    : demoAnnouncementsState;

  return sortAnnouncements(messages).map(cloneAnnouncement);
}

export function createDemoAnnouncement(
  input: Omit<AnnouncementMessage, "createdAt" | "updatedAt">
) {
  const now = new Date();
  const nextMessage: AnnouncementMessage = {
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  demoAnnouncementsState = sortAnnouncements([nextMessage, ...demoAnnouncementsState]);
  return cloneAnnouncement(nextMessage);
}

export function updateDemoAnnouncement(
  announcementId: string,
  input: Omit<AnnouncementMessage, "createdAt" | "updatedAt">
) {
  const currentMessage = demoAnnouncementsState.find((message) => message.id === announcementId);
  if (!currentMessage) {
    throw new Error("Announcement not found");
  }

  const nextMessage: AnnouncementMessage = {
    ...input,
    createdAt: currentMessage.createdAt,
    updatedAt: new Date(),
  };

  demoAnnouncementsState = sortAnnouncements(
    demoAnnouncementsState.map((message) =>
      message.id === announcementId ? nextMessage : message
    )
  );

  return cloneAnnouncement(nextMessage);
}

export function deleteDemoAnnouncement(announcementId: string) {
  demoAnnouncementsState = demoAnnouncementsState.filter(
    (message) => message.id !== announcementId
  );
}

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

  if (shouldUseMockData()) {
    console.log("[Announcements] Using mock data mode");
    return getDemoAnnouncementMessages({ activeOnly });
  }

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
