import { prisma } from "@/lib/prisma";
import type { Popup } from "@/types";

function isPopupActive(popup: Popup, now = new Date()) {
  if (!popup.isActive) {
    return false;
  }

  if (!popup.expiresAt) {
    return true;
  }

  return new Date(popup.expiresAt).getTime() >= now.getTime();
}

export async function getPopups() {
  const popups = await prisma.popup.findMany({
    orderBy: { createdAt: "desc" },
  });

  return popups as Popup[];
}

export async function getActivePopups() {
  const popups = await prisma.popup.findMany({
    where: {
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
    },
    orderBy: { createdAt: "desc" },
  });

  return popups as Popup[];
}
