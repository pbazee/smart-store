import { unstable_cache } from "next/cache";
import { getDefaultPromoBanners, DEFAULT_PROMO_BANNER_SEEDS } from "@/lib/default-promo-banners";
import { shouldUseMockData } from "@/lib/live-data-mode";
import { prisma } from "@/lib/prisma";
import { ensurePromoBannerStorage } from "@/lib/runtime-schema-repair";
import type { PromoBanner } from "@/types";

type PromoBannerQueryOptions = {
  activeOnly?: boolean;
  seedIfEmpty?: boolean;
};

type PromoBannerRecord = {
  id: string;
  badge_text: string | null;
  title: string;
  subtitle: string | null;
  cta_text: string | null;
  cta_link: string | null;
  background_image_url: string | null;
  background_color: string | null;
  position: number;
  is_active: boolean;
  created_at: Date;
};

type PromoBannerRecordInput = {
  badgeText: string | null;
  title: string;
  subtitle: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  backgroundImageUrl: string | null;
  backgroundColor: string | null;
  position: number;
  isActive: boolean;
};

const PROMO_BANNER_REVALIDATE_SECONDS = 60;

let demoPromoBannersState: PromoBanner[] = getDefaultPromoBanners();

function normalizeOptionalText(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

function normalizePromoBannerRecord(record: PromoBannerRecord): PromoBanner {
  return {
    id: record.id,
    badgeText: record.badge_text,
    title: record.title,
    subtitle: record.subtitle,
    ctaText: record.cta_text,
    ctaLink: record.cta_link,
    backgroundImageUrl: record.background_image_url,
    backgroundColor: record.background_color,
    position: record.position,
    isActive: record.is_active,
    createdAt: record.created_at,
  };
}

function sortPromoBanners(banners: PromoBanner[]) {
  return [...banners].sort(
    (left, right) =>
      left.position - right.position ||
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  );
}

function clonePromoBanner(banner: PromoBanner): PromoBanner {
  return {
    ...banner,
    createdAt: banner.createdAt instanceof Date ? new Date(banner.createdAt) : banner.createdAt,
  };
}

function getDemoPromoBanners() {
  return sortPromoBanners(demoPromoBannersState).map(clonePromoBanner);
}

function setDemoPromoBanners(nextBanners: PromoBanner[]) {
  demoPromoBannersState = sortPromoBanners(nextBanners).map(clonePromoBanner);
  return getDemoPromoBanners();
}

function normalizeInput(input: PromoBannerRecordInput): PromoBannerRecordInput {
  return {
    badgeText: normalizeOptionalText(input.badgeText),
    title: input.title.trim(),
    subtitle: normalizeOptionalText(input.subtitle),
    ctaText: normalizeOptionalText(input.ctaText),
    ctaLink: normalizeOptionalText(input.ctaLink),
    backgroundImageUrl: normalizeOptionalText(input.backgroundImageUrl),
    backgroundColor: normalizeOptionalText(input.backgroundColor),
    position: input.position,
    isActive: input.isActive,
  };
}

async function queryPromoBanners(activeOnly: boolean) {
  if (activeOnly) {
    return prisma.$queryRaw<PromoBannerRecord[]>`
      SELECT
        id::text,
        badge_text,
        title,
        subtitle,
        cta_text,
        cta_link,
        background_image_url,
        background_color,
        position,
        is_active,
        created_at
      FROM "promo_banners"
      WHERE is_active = TRUE
      ORDER BY position ASC, created_at ASC
    `;
  }

  return prisma.$queryRaw<PromoBannerRecord[]>`
    SELECT
      id::text,
      badge_text,
      title,
      subtitle,
      cta_text,
      cta_link,
      background_image_url,
      background_color,
      position,
      is_active,
      created_at
    FROM "promo_banners"
    ORDER BY position ASC, created_at ASC
  `;
}

async function seedPromoBannersIfEmpty() {
  const existingCountRows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM "promo_banners"
  `;
  const existingCount = Number(existingCountRows[0]?.count ?? 0);

  if (existingCount > 0) {
    return;
  }

  for (const banner of DEFAULT_PROMO_BANNER_SEEDS) {
    await prisma.$executeRaw`
      INSERT INTO "promo_banners" (
        badge_text,
        title,
        subtitle,
        cta_text,
        cta_link,
        background_image_url,
        background_color,
        position,
        is_active
      )
      VALUES (
        ${banner.badgeText},
        ${banner.title},
        ${banner.subtitle},
        ${banner.ctaText},
        ${banner.ctaLink},
        ${banner.backgroundImageUrl},
        ${banner.backgroundColor},
        ${banner.position},
        ${banner.isActive}
      )
    `;
  }
}

async function loadPromoBanners(options: PromoBannerQueryOptions = {}): Promise<PromoBanner[]> {
  const { activeOnly = false, seedIfEmpty = false } = options;

  if (shouldUseMockData()) {
    const banners = getDemoPromoBanners();
    return activeOnly ? banners.filter((banner) => banner.isActive) : banners;
  }

  await ensurePromoBannerStorage();

  if (seedIfEmpty) {
    await seedPromoBannersIfEmpty();
  }

  const rows = await queryPromoBanners(activeOnly);

  if (rows.length === 0 && seedIfEmpty) {
    await seedPromoBannersIfEmpty();
    return (await queryPromoBanners(activeOnly)).map(normalizePromoBannerRecord);
  }

  return rows.map(normalizePromoBannerRecord);
}

const getCachedActivePromoBanners = unstable_cache(
  () => loadPromoBanners({ activeOnly: true, seedIfEmpty: false }),
  ["promo-banners", "active"],
  {
    revalidate: PROMO_BANNER_REVALIDATE_SECONDS,
    tags: ["homepage", "promo-banners"],
  }
);

export async function getPromoBanners(options: PromoBannerQueryOptions = {}) {
  const { activeOnly = false, seedIfEmpty = false } = options;

  if (activeOnly) {
    return getCachedActivePromoBanners();
  }

  return loadPromoBanners({ activeOnly, seedIfEmpty });
}

export async function getActivePromoBanners() {
  return getPromoBanners({ activeOnly: true, seedIfEmpty: false });
}

export async function createPromoBanner(input: PromoBannerRecordInput) {
  const normalized = normalizeInput(input);

  if (shouldUseMockData()) {
    const banner: PromoBanner = {
      id: crypto.randomUUID(),
      ...normalized,
      createdAt: new Date(),
    };
    setDemoPromoBanners([...demoPromoBannersState, banner]);
    return banner;
  }

  await ensurePromoBannerStorage();
  const rows = await prisma.$queryRaw<PromoBannerRecord[]>`
    INSERT INTO "promo_banners" (
      badge_text,
      title,
      subtitle,
      cta_text,
      cta_link,
      background_image_url,
      background_color,
      position,
      is_active
    )
    VALUES (
      ${normalized.badgeText},
      ${normalized.title},
      ${normalized.subtitle},
      ${normalized.ctaText},
      ${normalized.ctaLink},
      ${normalized.backgroundImageUrl},
      ${normalized.backgroundColor},
      ${normalized.position},
      ${normalized.isActive}
    )
    RETURNING
      id::text,
      badge_text,
      title,
      subtitle,
      cta_text,
      cta_link,
      background_image_url,
      background_color,
      position,
      is_active,
      created_at
  `;

  return normalizePromoBannerRecord(rows[0]);
}

export async function updatePromoBanner(id: string, input: PromoBannerRecordInput) {
  const normalized = normalizeInput(input);

  if (shouldUseMockData()) {
    const current = demoPromoBannersState.find((banner) => banner.id === id);
    if (!current) {
      throw new Error("Promotional banner not found.");
    }

    const nextBanner: PromoBanner = {
      ...current,
      ...normalized,
    };
    setDemoPromoBanners(
      demoPromoBannersState.map((banner) => (banner.id === id ? nextBanner : banner))
    );
    return nextBanner;
  }

  await ensurePromoBannerStorage();
  const rows = await prisma.$queryRaw<PromoBannerRecord[]>`
    UPDATE "promo_banners"
    SET
      badge_text = ${normalized.badgeText},
      title = ${normalized.title},
      subtitle = ${normalized.subtitle},
      cta_text = ${normalized.ctaText},
      cta_link = ${normalized.ctaLink},
      background_image_url = ${normalized.backgroundImageUrl},
      background_color = ${normalized.backgroundColor},
      position = ${normalized.position},
      is_active = ${normalized.isActive}
    WHERE id = ${id}::uuid
    RETURNING
      id::text,
      badge_text,
      title,
      subtitle,
      cta_text,
      cta_link,
      background_image_url,
      background_color,
      position,
      is_active,
      created_at
  `;

  if (!rows[0]) {
    throw new Error("Promotional banner not found.");
  }

  return normalizePromoBannerRecord(rows[0]);
}

export async function deletePromoBanner(id: string) {
  if (shouldUseMockData()) {
    const current = demoPromoBannersState.find((banner) => banner.id === id);
    if (!current) {
      throw new Error("Promotional banner not found.");
    }

    setDemoPromoBanners(demoPromoBannersState.filter((banner) => banner.id !== id));
    return current;
  }

  await ensurePromoBannerStorage();
  const rows = await prisma.$queryRaw<PromoBannerRecord[]>`
    DELETE FROM "promo_banners"
    WHERE id = ${id}::uuid
    RETURNING
      id::text,
      badge_text,
      title,
      subtitle,
      cta_text,
      cta_link,
      background_image_url,
      background_color,
      position,
      is_active,
      created_at
  `;

  if (!rows[0]) {
    throw new Error("Promotional banner not found.");
  }

  return normalizePromoBannerRecord(rows[0]);
}

export async function savePromoBannerOrder(input: Array<{ id: string; position: number }>) {
  const normalizedOrder = input
    .map((item) => ({ id: item.id, position: item.position }))
    .sort((left, right) => left.position - right.position);

  if (shouldUseMockData()) {
    const nextById = new Map(normalizedOrder.map((item) => [item.id, item.position]));
    setDemoPromoBanners(
      demoPromoBannersState.map((banner) => ({
        ...banner,
        position: nextById.get(banner.id) ?? banner.position,
      }))
    );
    return getDemoPromoBanners();
  }

  await ensurePromoBannerStorage();
  await prisma.$transaction(
    normalizedOrder.map((item) =>
      prisma.$executeRaw`
        UPDATE "promo_banners"
        SET position = ${item.position}
        WHERE id = ${item.id}::uuid
      `
    )
  );

  return getPromoBanners({ seedIfEmpty: true });
}
