import "server-only";

import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { DEFAULT_STORE_SETTINGS } from "@/lib/default-store-settings";
import { DEFAULT_SOCIAL_LINK_SEEDS, createSocialLinkSeed } from "@/lib/default-social-links";
import { getStoreSettingsFallback } from "@/lib/store-settings";
import { shouldSkipLiveDataDuringBuild } from "@/lib/live-data-mode";
import { prisma, withPrismaRetry } from "@/lib/prisma";
import { getPromoBanners } from "@/lib/promo-banner-service";
import { getWhatsAppSettingsFallback } from "@/lib/whatsapp-service";
import type { HeroSlide, Product } from "@/types";

export const HOMEPAGE_CACHE_TAG = "homepage";

export type HomepageProductSectionsData = {
  featured: Product[];
  trending: Product[];
  newArrivals: Product[];
  popular: Product[];
  alsoBought: Product[];
  cityInspired: Product[];
};

export type HomepageCriticalProductSectionsData = Pick<
  HomepageProductSectionsData,
  "featured" | "trending"
>;

export type HomepageDeferredProductSectionsData = Pick<
  HomepageProductSectionsData,
  "newArrivals" | "alsoBought" | "cityInspired"
>;

const HOMEPAGE_PRODUCT_VARIANT_SELECT = {
  id: true,
  color: true,
  colorHex: true,
  size: true,
  stock: true,
  price: true,
} satisfies Prisma.VariantSelect;

const HOMEPAGE_PRODUCT_SELECT = {
  id: true,
  name: true,
  slug: true,
  category: true,
  subcategory: true,
  categoryId: true,
  gender: true,
  tags: true,
  basePrice: true,
  images: true,
  rating: true,
  reviewCount: true,
  isFeatured: true,
  isNew: true,
  isPopular: true,
  isTrending: true,
  isRecommended: true,
  createdAt: true,
  updatedAt: true,
  variants: {
    select: HOMEPAGE_PRODUCT_VARIANT_SELECT,
    orderBy: [{ stock: "desc" }, { price: "asc" }],
    take: 6,
  },
} satisfies Prisma.ProductSelect;

type HomepageProductRow = Prisma.ProductGetPayload<{
  select: typeof HOMEPAGE_PRODUCT_SELECT;
}>;

type HomepageCollectionKey =
  | "featured"
  | "trending"
  | "new-arrivals"
  | "popular"
  | "recommended"
  | "city-inspired";

function toHomepageProduct(product: HomepageProductRow): Product {
  return {
    ...product,
    gender: product.gender as Product["gender"],
    description: "",
  };
}

async function queryHomepageProducts(
  where: Prisma.ProductWhereInput,
  orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] = [
    { updatedAt: "desc" },
    { createdAt: "desc" },
  ],
  take: number = 8
) {
  if (shouldSkipLiveDataDuringBuild()) {
    return [];
  }

  const products = await withPrismaRetry("queryHomepageProducts", () =>
    prisma.product.findMany({
      where: {
        categoryId: { not: null },
        ...where,
      },
      orderBy,
      take,
      select: HOMEPAGE_PRODUCT_SELECT,
    })
  );

  return products.map(toHomepageProduct);
}

function buildHomepageCollectionQuery(key: HomepageCollectionKey) {
  switch (key) {
    case "featured":
      return {
        where: { isFeatured: true },
      };
    case "trending":
      return {
        where: { isTrending: true },
      };
    case "new-arrivals":
      return {
        where: { isNew: true },
        orderBy: [{ createdAt: "desc" }] satisfies Prisma.ProductOrderByWithRelationInput[],
      };
    case "popular":
      return {
        where: { isPopular: true },
      };
    case "recommended":
      return {
        where: { isRecommended: true },
      };
    case "city-inspired":
      return {
        where: { isPopular: true },
        orderBy: [{ rating: "desc" }, { reviewCount: "desc" }, { updatedAt: "desc" }] satisfies Prisma.ProductOrderByWithRelationInput[],
      };
  }
}

const getCachedHomepageCollectionProducts = (key: HomepageCollectionKey) =>
  unstable_cache(
    async () => {
      const query = buildHomepageCollectionQuery(key);
      return queryHomepageProducts(query.where, query.orderBy);
    },
    ["homepage-products", key],
    {
      revalidate: 300,
      tags: [HOMEPAGE_CACHE_TAG, "products", `homepage-products:${key}`],
    }
  );

export async function getHomepageCollectionProducts(key: HomepageCollectionKey) {
  return getCachedHomepageCollectionProducts(key)();
}

export const getCachedHeroSlides = unstable_cache(
  async (): Promise<HeroSlide[]> => {
    if (shouldSkipLiveDataDuringBuild()) {
      return [];
    }

    const slides = await withPrismaRetry("getCachedHeroSlides", () =>
      prisma.heroSlide.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          subtitle: true,
          imageUrl: true,
          ctaText: true,
          ctaLink: true,
          moodTags: true,
          locationBadge: true,
          order: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    );

    return slides as HeroSlide[];
  },
  ["hero-slides"],
  { revalidate: 120, tags: ["hero-slides", HOMEPAGE_CACHE_TAG] }
);

export const getCachedAnnouncements = unstable_cache(
  async () => {
    if (shouldSkipLiveDataDuringBuild()) {
      return [];
    }

    return withPrismaRetry("getCachedAnnouncements", () =>
      prisma.announcementMessage.findMany({
        where: { isActive: true },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          text: true,
          icon: true,
          link: true,
          bgColor: true,
          textColor: true,
          isActive: true,
          order: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    );
  },
  ["announcements"],
  { revalidate: 300, tags: ["announcements", HOMEPAGE_CACHE_TAG] }
);

export const getCachedPromoBanners = unstable_cache(
  async () => getPromoBanners({ activeOnly: true, seedIfEmpty: false }),
  ["promo-banners"],
  { revalidate: 300, tags: ["promo-banners", HOMEPAGE_CACHE_TAG] }
);

export const getCachedHomepageCriticalProducts = unstable_cache(
  async (): Promise<HomepageCriticalProductSectionsData> => {
    const [featured, trending] = await Promise.all([
      getHomepageCollectionProducts("featured"),
      getHomepageCollectionProducts("trending"),
    ]);

    return { featured, trending };
  },
  ["homepage-products", "critical"],
  { revalidate: 300, tags: [HOMEPAGE_CACHE_TAG, "products", "homepage-products"] }
);

export const getCachedHomepageDeferredProducts = unstable_cache(
  async (): Promise<HomepageDeferredProductSectionsData> => {
    const [newArrivals, alsoBought, cityInspired] = await Promise.all([
      getHomepageCollectionProducts("new-arrivals"),
      getHomepageCollectionProducts("recommended"),
      getHomepageCollectionProducts("city-inspired"),
    ]);

    return { newArrivals, alsoBought, cityInspired };
  },
  ["homepage-products", "deferred"],
  { revalidate: 300, tags: [HOMEPAGE_CACHE_TAG, "products", "homepage-products"] }
);

export const getCachedHomepageProducts = unstable_cache(
  async (): Promise<HomepageProductSectionsData> => {
    const [critical, deferred] = await Promise.all([
      getCachedHomepageCriticalProducts(),
      getCachedHomepageDeferredProducts(),
    ]);

    return {
      ...critical,
      ...deferred,
      popular: critical.featured,
    };
  },
  ["homepage-products", "all"],
  { revalidate: 300, tags: [HOMEPAGE_CACHE_TAG, "products", "homepage-products"] }
);

export const getCachedHomepageCategories = unstable_cache(
  async () => {
    if (shouldSkipLiveDataDuringBuild()) {
      return [];
    }

    return withPrismaRetry("getCachedHomepageCategories", () =>
      prisma.homepageCategory.findMany({
        where: { isActive: true },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          title: true,
          subtitle: true,
          imageUrl: true,
          link: true,
          parentCategoryId: true,
          order: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    );
  },
  ["homepage-categories"],
  { revalidate: 600, tags: ["homepage-categories", HOMEPAGE_CACHE_TAG] }
);

export const getStoreSettings = async () => {
  if (shouldSkipLiveDataDuringBuild()) {
    return DEFAULT_STORE_SETTINGS;
  }

  return withPrismaRetry("getStoreSettings", () =>
    prisma.storeSettings.findFirst({
      orderBy: { id: "asc" },
      select: {
        id: true,
        storeName: true,
        storeTagline: true,
        logoUrl: true,
        logoDarkUrl: true,
        faviconUrl: true,
        supportEmail: true,
        supportPhone: true,
        adminNotificationEmail: true,
        contactPhone: true,
        footerContactPhone: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  );
};

export const getCachedStoreSettings = getStoreSettings;

export const getCachedPopups = unstable_cache(
  async () => {
    if (shouldSkipLiveDataDuringBuild()) {
      return [];
    }

    return withPrismaRetry("getCachedPopups", () =>
      prisma.popup.findMany({
        where: {
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          message: true,
          imageUrl: true,
          ctaText: true,
          ctaLink: true,
          showOn: true,
          delaySeconds: true,
          isActive: true,
          expiresAt: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    );
  },
  ["popups"],
  { revalidate: 300, tags: ["popups", HOMEPAGE_CACHE_TAG] }
);

export const getCachedWhatsAppSettings = unstable_cache(
  async () => {
    if (shouldSkipLiveDataDuringBuild()) {
      return null;
    }

    return withPrismaRetry("getCachedWhatsAppSettings", () =>
      prisma.whatsAppSettings.findFirst({
        select: {
          id: true,
          phoneNumber: true,
          defaultMessage: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    );
  },
  ["whatsapp-settings"],
  { revalidate: 3600, tags: ["whatsapp-settings"] }
);

export const getCachedSocialLinks = unstable_cache(
  async () => {
    if (shouldSkipLiveDataDuringBuild()) {
      return [];
    }

    return withPrismaRetry("getCachedSocialLinks", () =>
      prisma.socialLink.findMany({
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          platform: true,
          url: true,
          icon: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    );
  },
  ["social-links"],
  { revalidate: 3600, tags: ["social-links"] }
);

export const getCachedHomepageBlogPosts = unstable_cache(
  async () => {
    if (shouldSkipLiveDataDuringBuild()) {
      return [];
    }

    return withPrismaRetry("getCachedHomepageBlogPosts", () =>
      prisma.blog.findMany({
        where: { isPublished: true },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: 4,
        select: {
          id: true,
          title: true,
          slug: true,
          content: true,
          imageUrl: true,
          isPublished: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    );
  },
  ["homepage-blog-posts"],
  { revalidate: 600, tags: ["blogs", HOMEPAGE_CACHE_TAG] }
);

export const getCachedHomepageLatestReviews = unstable_cache(
  async () => {
    if (shouldSkipLiveDataDuringBuild()) {
      return [];
    }

    return withPrismaRetry("getCachedHomepageLatestReviews", () =>
      prisma.review.findMany({
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          authorName: true,
          authorCity: true,
          rating: true,
          title: true,
          content: true,
          createdAt: true,
          product: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      })
    );
  },
  ["homepage-latest-reviews"],
  { revalidate: 300, tags: ["reviews", HOMEPAGE_CACHE_TAG] }
);

export async function getHomepageShellData() {
  return getCachedHomepageShellData();
}

const getCachedHomepageShellData = unstable_cache(
  async () => {
    const [
      announcements,
      popups,
      socialLinks,
      whatsAppSettings,
      storeSettings,
    ] = await Promise.all([
      getCachedAnnouncements().catch((error) => {
        console.error("[HomepageShellData] Failed to load announcements:", error);
        return [] as Awaited<ReturnType<typeof getCachedAnnouncements>>;
      }),
      getCachedPopups().catch((error) => {
        console.error("[HomepageShellData] Failed to load popups:", error);
        return [] as Awaited<ReturnType<typeof getCachedPopups>>;
      }),
      getCachedSocialLinks().catch((error) => {
        console.error("[HomepageShellData] Failed to load social links:", error);
        return DEFAULT_SOCIAL_LINK_SEEDS.map((seed) => createSocialLinkSeed(seed));
      }),
      getCachedWhatsAppSettings().catch((error) => {
        console.error("[HomepageShellData] Failed to load WhatsApp settings:", error);
        return getWhatsAppSettingsFallback();
      }),
      getCachedStoreSettings().catch((error) => {
        console.error("[HomepageShellData] Failed to load store settings:", error);
        return getStoreSettingsFallback() ?? DEFAULT_STORE_SETTINGS;
      }),
    ]);

    return { announcements, popups, socialLinks, whatsAppSettings, storeSettings };
  },
  ["homepage-shell-data"],
  { revalidate: 300, tags: [HOMEPAGE_CACHE_TAG, "announcements", "popups", "social-links", "whatsapp-settings", "store-settings"] }
);

export const getHomepageHeroSlides = getCachedHeroSlides;
export const getHomepageCategories = getCachedHomepageCategories;
export const getHomepageCriticalProductSectionsData = getCachedHomepageCriticalProducts;
export const getHomepageDeferredProductSectionsData = getCachedHomepageDeferredProducts;
export const getHomepageProductSectionsData = getCachedHomepageProducts;
export const getHomepageBlogPosts = getCachedHomepageBlogPosts;
export const getHomepageLatestReviews = getCachedHomepageLatestReviews;
// export const getStoreSettings = getCachedStoreSettings;
export const getWhatsAppSettings = getCachedWhatsAppSettings;
export const getSocialLinks = getCachedSocialLinks;
