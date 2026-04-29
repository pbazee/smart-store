import { unstable_cache } from "next/cache";
import { shouldUseMockData } from "@/lib/live-data-mode";
import { prisma } from "@/lib/prisma";
import type { LandingSection, LandingSectionOverride, Product } from "@/types";

export const LANDING_SECTIONS: LandingSection[] = [
  "popular",
  "trending",
  "new_arrivals",
  "recommended",
];

export const LANDING_OVERRIDES_CACHE_TAG = "landing-overrides";

type OverrideInput = {
  id?: number;
  section: LandingSection;
  productId: string;
  priority?: number;
  activeFrom?: string | Date | null;
  activeUntil?: string | Date | null;
};

const demoOverrides: LandingSectionOverride[] = [];

function normalizeDate(value?: string | Date | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isActive(override: LandingSectionOverride, now = new Date()) {
  const start = override.activeFrom ? new Date(override.activeFrom) : null;
  const end = override.activeUntil ? new Date(override.activeUntil) : null;

  if (start && start.getTime() > now.getTime()) return false;
  if (end && end.getTime() < now.getTime()) return false;
  return true;
}

async function loadActiveLandingOverrides(
  section: string,
  take?: number
): Promise<LandingSectionOverride[]> {
  const now = new Date();
  const overrides = await prisma.landingSectionOverride.findMany({
    where: {
      section,
      AND: [
        { OR: [{ activeFrom: null }, { activeFrom: { lte: now } }] },
        { OR: [{ activeUntil: null }, { activeUntil: { gte: now } }] },
      ],
    },
    include: {
      product: {
        include: { variants: true },
      },
    },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    take,
  });

  return overrides as unknown as LandingSectionOverride[];
}

export async function getActiveLandingOverrides(
  section: LandingSection,
  take?: number
): Promise<LandingSectionOverride[]> {
  if (shouldUseMockData()) {
    return demoOverrides
      .filter((override) => override.section === section)
      .filter((override) => isActive(override))
      .sort((a, b) => a.priority - b.priority)
      .slice(0, take);
  }

  return unstable_cache(
    () => loadActiveLandingOverrides(section, take),
    ["landing-overrides", section, String(take ?? "all")],
    { revalidate: 300, tags: [LANDING_OVERRIDES_CACHE_TAG, "homepage"] }
  )();
}

export async function listLandingOverrides(): Promise<LandingSectionOverride[]> {
  if (shouldUseMockData()) {
    return demoOverrides;
  }

  const overrides = await prisma.landingSectionOverride.findMany({
    include: {
      product: {
        include: { variants: true },
      },
    },
    orderBy: [{ section: "asc" }, { priority: "asc" }, { createdAt: "asc" }],
  });

  return overrides as unknown as LandingSectionOverride[];
}

export async function upsertLandingSectionOverride(
  input: OverrideInput
): Promise<LandingSectionOverride> {
  if (shouldUseMockData()) {
    const now = new Date();
    const existingIndex = demoOverrides.findIndex(
      (override) =>
        override.section === input.section &&
        (override.id === input.id || override.productId === input.productId)
    );
    const base: LandingSectionOverride = {
      id: input.id ?? Date.now(),
      section: input.section,
      productId: input.productId,
      product: (input as any).product ?? ({} as Product),
      priority: input.priority ?? 0,
      activeFrom: normalizeDate(input.activeFrom),
      activeUntil: normalizeDate(input.activeUntil),
      createdAt: now,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      demoOverrides[existingIndex] = base;
      return demoOverrides[existingIndex];
    }

    demoOverrides.push(base);
    return base;
  }

  const activeFrom = normalizeDate(input.activeFrom);
  const activeUntil = normalizeDate(input.activeUntil);
  const priority = input.priority ?? 0;

  const where = input.id
    ? { id: input.id }
    : { section_productId: { section: input.section, productId: input.productId } };

  const override = await prisma.landingSectionOverride.upsert({
    where,
    update: {
      priority,
      activeFrom,
      activeUntil,
      productId: input.productId,
      section: input.section,
    },
    create: {
      section: input.section,
      productId: input.productId,
      priority,
      activeFrom,
      activeUntil,
    },
    include: {
      product: {
        include: { variants: true },
      },
    },
  });

  return override as unknown as LandingSectionOverride;
}

export async function deleteLandingSectionOverride(id: number) {
  if (shouldUseMockData()) {
    const index = demoOverrides.findIndex((o) => o.id === id);
    if (index >= 0) {
      demoOverrides.splice(index, 1);
    }
    return;
  }

  await prisma.landingSectionOverride.delete({ where: { id } });
}

export async function reorderLandingOverrides(section: LandingSection, orderedIds: number[]) {
  if (shouldUseMockData()) {
    const sorted = demoOverrides
      .filter((o) => o.section === section)
      .sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id));
    sorted.forEach((override, index) => {
      override.priority = index;
      override.updatedAt = new Date();
    });
    return;
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.landingSectionOverride.update({
        where: { id },
        data: { priority: index },
      })
    )
  );
}

export function mergeOverridesWithAuto(
  overrides: LandingSectionOverride[],
  autoProducts: Product[],
  take: number
) {
  const overrideProducts = overrides.map((item) => item.product);
  const seen = new Set(overrideProducts.map((product) => product.id));
  const remainingAuto = autoProducts.filter((product) => !seen.has(product.id));

  return [...overrideProducts, ...remainingAuto].slice(0, take);
}
