import { shouldUseMockData } from "@/lib/live-data-mode";
import { prisma } from "@/lib/prisma";
import type { Popup } from "@/types";

let demoPopupsState: Popup[] = [];

function clonePopup(popup: Popup): Popup {
  return {
    ...popup,
    expiresAt: popup.expiresAt instanceof Date ? new Date(popup.expiresAt) : popup.expiresAt,
    createdAt: popup.createdAt instanceof Date ? new Date(popup.createdAt) : popup.createdAt,
    updatedAt: popup.updatedAt instanceof Date ? new Date(popup.updatedAt) : popup.updatedAt,
  };
}

function sortPopups(popups: Popup[]) {
  return [...popups].sort((left, right) => {
    const leftDate = new Date(left.createdAt).getTime();
    const rightDate = new Date(right.createdAt).getTime();
    return rightDate - leftDate;
  });
}

function isPopupActive(popup: Popup, now = new Date()) {
  if (!popup.isActive) {
    return false;
  }

  if (!popup.expiresAt) {
    return true;
  }

  return new Date(popup.expiresAt).getTime() >= now.getTime();
}

export function getDemoPopups() {
  return sortPopups(demoPopupsState).map(clonePopup);
}

export function createDemoPopup(input: Omit<Popup, "createdAt" | "updatedAt">) {
  const now = new Date();
  const nextPopup: Popup = {
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  demoPopupsState = sortPopups([nextPopup, ...demoPopupsState]);
  return clonePopup(nextPopup);
}

export function updateDemoPopup(popupId: string, input: Omit<Popup, "createdAt" | "updatedAt">) {
  const currentPopup = demoPopupsState.find((popup) => popup.id === popupId);
  if (!currentPopup) {
    throw new Error("Popup not found");
  }

  const nextPopup: Popup = {
    ...input,
    createdAt: currentPopup.createdAt,
    updatedAt: new Date(),
  };

  demoPopupsState = sortPopups(
    demoPopupsState.map((popup) => (popup.id === popupId ? nextPopup : popup))
  );

  return clonePopup(nextPopup);
}

export function deleteDemoPopup(popupId: string) {
  demoPopupsState = demoPopupsState.filter((popup) => popup.id !== popupId);
}

export async function getPopups() {
  if (shouldUseMockData()) {
    return getDemoPopups();
  }

  const popups = await prisma.popup.findMany({
    orderBy: { createdAt: "desc" },
  });

  return popups as Popup[];
}

export async function getActivePopups() {
  if (shouldUseMockData()) {
    return getDemoPopups().filter((popup) => isPopupActive(popup));
  }

  const popups = await prisma.popup.findMany({
    where: {
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
    },
    orderBy: { createdAt: "desc" },
  });

  return popups as Popup[];
}
