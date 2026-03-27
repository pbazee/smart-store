import type { AnnouncementMessage } from "@/types";

export type AnnouncementSeed = Omit<AnnouncementMessage, "createdAt" | "updatedAt">;

export const DEFAULT_ANNOUNCEMENT_MESSAGE_SEEDS: AnnouncementSeed[] = [
  {
    id: "seed-announcement-delivery",
    text: "Free same-day delivery in Nairobi for orders over KSh 2,000",
    icon: "\u{1F680}",
    link: "/shop",
    bgColor: "#120804",
    textColor: "#FFF7ED",
    isActive: true,
    order: 0,
  },
  {
    id: "seed-announcement-payments",
    text: "Pay with M-Pesa, Card or Cash on Delivery \u2014 instant & secure",
    icon: "\u{1F4B3}",
    link: "/checkout",
    bgColor: "#111827",
    textColor: "#F8FAFC",
    isActive: true,
    order: 1,
  },
  {
    id: "seed-announcement-sale",
    text: "This week only: Up to 30% off new summer streetwear",
    icon: "\u{1F525}",
    link: "/shop?collection=new-arrivals",
    bgColor: "#2A120B",
    textColor: "#FFEDD5",
    isActive: true,
    order: 2,
  },
  {
    id: "seed-announcement-trust",
    text: "Trusted by 2,300+ Kenyans \u2014 4.9/5 average rating",
    icon: "\u2B50",
    link: "/about",
    bgColor: "#18181B",
    textColor: "#FAFAFA",
    isActive: true,
    order: 3,
  },
];

export function createAnnouncementSeedMessage(seed: AnnouncementSeed): AnnouncementMessage {
  const timestamp = new Date("2026-01-01T00:00:00.000Z");

  return {
    ...seed,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createFallbackAnnouncementMessage() {
  return createAnnouncementSeedMessage(DEFAULT_ANNOUNCEMENT_MESSAGE_SEEDS[0]);
}
