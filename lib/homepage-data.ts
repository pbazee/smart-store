import { unstable_cache } from "next/cache";
import { getDemoAnnouncementMessages } from "@/lib/announcement-service";
import { getDemoBlogPosts } from "@/lib/blog-service";
import { getProducts } from "@/lib/data-service";
import { createFallbackAnnouncementMessage } from "@/lib/default-announcements";
import { DEFAULT_WHATSAPP_SETTINGS, createDefaultWhatsAppSettings } from "@/lib/default-whatsapp-settings";
import { getActiveHeroSlides, getDemoHeroSlides } from "@/lib/hero-slide-service";
import { getActiveHomepageCategories } from "@/lib/homepage-category-service";
import { getLatestApprovedReviews } from "@/lib/reviews-service";
import { shouldUseMockData } from "@/lib/live-data-mode";
import { getActiveLandingOverrides, mergeOverridesWithAuto } from "@/lib/landing-section-overrides";
import { getDemoPopups } from "@/lib/popup-service";
import { prisma } from "@/lib/prisma";
import { getCityInspiredProducts, getCustomersAlsoBought } from "@/lib/recommendations";
import { getDemoSocialLinks } from "@/lib/social-link-service";
import { getDemoWhatsAppSettings } from "@/lib/whatsapp-service";
import { getStoreSettings } from "@/lib/store-settings";
import type {
  AnnouncementMessage,
  BlogPost,
  Category,
  HeroSlide,
  HomepageCategory,
  Popup,
  Product,
  SocialLink,
  StoreSettings,
  WhatsAppSettings,
} from "@/types";

export const HOMEPAGE_CACHE_TAG = "homepage";

const HOMEPAGE_REVALIDATE_SECONDS = 3600;
const HOMEPAGE_PRODUCT_LIMIT = 8;

export type HomepageShellData = {
  announcements: AnnouncementMessage[];
  popups: Popup[];
  socialLinks: SocialLink[];
  whatsAppSettings: WhatsAppSettings | null;
  storeSettings: StoreSettings | null;
};

export type HomepageProductSectionsData = {
  featured: Product[];
  trending: Product[];
  newArrivals: Product[];
  alsoBought: Product[];
  cityInspired: Product[];
};

export type HomepagePageData = {
  heroSlides: HeroSlide[];
  categories: HomepageCategory[];
  blogPosts: BlogPost[];
  productSections: HomepageProductSectionsData;
  latestReviews: any[];
};

export type HomepageData = HomepageShellData & HomepagePageData;

function shouldUseProductionCache() {
  return process.env.NODE_ENV === "production";
}

async function safeQuery<T>(
  query: () => Promise<T>,
  fallback: () => T | Promise<T>
): Promise<T> {
  try {
    return await query();
  } catch {
    return await fallback();
  }
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

async function resolveHomepageShellData(): Promise<HomepageShellData> {
  if (shouldUseMockData()) {
    return {
      announcements: getDemoAnnouncementMessages({ activeOnly: true }),
      popups: getDemoPopups().filter((popup) => isPopupActive(popup)),
      socialLinks: getDemoSocialLinks(),
      whatsAppSettings: getDemoWhatsAppSettings(),
      storeSettings: await getStoreSettings({ seedIfEmpty: true }),
    };
  }

  const now = new Date();
  const [announcements, popups, socialLinks, whatsAppSettings, storeSettings] =
    await Promise.all([
      safeQuery(
        async () => (await prisma.announcementMessage.findMany({
          where: { isActive: true },
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        })) as AnnouncementMessage[],
        () => [createFallbackAnnouncementMessage()]
      ),
      safeQuery(
        async () => (await prisma.popup.findMany({
          where: {
            isActive: true,
            OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
          },
          orderBy: { createdAt: "desc" },
        })) as Popup[],
        () => []
      ),
      safeQuery(
        async () => (await prisma.socialLink.findMany({
          orderBy: { createdAt: "asc" },
        })) as SocialLink[],
        () => getDemoSocialLinks()
      ),
      safeQuery(
        async () =>
          ((await prisma.whatsAppSettings.findUnique({
            where: { id: DEFAULT_WHATSAPP_SETTINGS.id },
          })) as WhatsAppSettings | null) ?? createDefaultWhatsAppSettings(),
        () => createDefaultWhatsAppSettings()
      ),
      safeQuery(
        async () => (await getStoreSettings({ seedIfEmpty: true })) as StoreSettings | null,
        () => getStoreSettings({ seedIfEmpty: true })
      ),
    ]);

  return {
    announcements,
    popups,
    socialLinks,
    whatsAppSettings,
    storeSettings,
  };
}

async function resolveHomepageProductSectionsData(): Promise<HomepageProductSectionsData> {
  const [allProducts, popularOverrides, trendingOverrides, newArrivalOverrides, recommendedOverrides] =
    await Promise.all([
      getProducts(undefined, {
        syncReservations: false,
        cacheKey: "homepage:products",
      }),
      getActiveLandingOverrides("popular", HOMEPAGE_PRODUCT_LIMIT),
      getActiveLandingOverrides("trending", HOMEPAGE_PRODUCT_LIMIT),
      getActiveLandingOverrides("new_arrivals", HOMEPAGE_PRODUCT_LIMIT),
      getActiveLandingOverrides("recommended", HOMEPAGE_PRODUCT_LIMIT),
    ]);

  const featuredAuto = allProducts.filter((product) => product.isFeatured).slice(0, HOMEPAGE_PRODUCT_LIMIT);
  const featured = mergeOverridesWithAuto(popularOverrides, featuredAuto, HOMEPAGE_PRODUCT_LIMIT);

  const trendingAuto = allProducts
    .filter((product) => product.tags.includes("trending"))
    .slice(0, HOMEPAGE_PRODUCT_LIMIT);
  const trending = mergeOverridesWithAuto(trendingOverrides, trendingAuto, HOMEPAGE_PRODUCT_LIMIT);

  const newArrivalsAuto = allProducts.filter((product) => product.isNew).slice(0, HOMEPAGE_PRODUCT_LIMIT);
  const newArrivals = mergeOverridesWithAuto(newArrivalOverrides, newArrivalsAuto, HOMEPAGE_PRODUCT_LIMIT);

  const referenceProduct = featured[0] ?? allProducts[0] ?? null;
  const recommendedAuto = referenceProduct
    ? getCustomersAlsoBought(allProducts, referenceProduct, HOMEPAGE_PRODUCT_LIMIT)
    : [];
  const alsoBought = mergeOverridesWithAuto(
    recommendedOverrides,
    recommendedAuto,
    HOMEPAGE_PRODUCT_LIMIT
  );

  return {
    featured,
    trending,
    newArrivals,
    alsoBought,
    cityInspired: getCityInspiredProducts(allProducts, "Nairobi", HOMEPAGE_PRODUCT_LIMIT),
  };
}

async function resolveHomepagePageData(): Promise<HomepagePageData> {
  const [heroSlides, categories, blogPosts, productSections, latestReviews] = await Promise.all([
    shouldUseMockData()
      ? Promise.resolve(getDemoHeroSlides({ activeOnly: true }))
      : getActiveHeroSlides(),
    getActiveHomepageCategories(),
    shouldUseMockData()
      ? Promise.resolve(getDemoBlogPosts({ publishedOnly: true, take: 4 }))
      : safeQuery(
        async () =>
          (await prisma.blog.findMany({
            where: { isPublished: true },
            orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
            take: 4,
          })) as BlogPost[],
        () => getDemoBlogPosts({ publishedOnly: true, take: 4 })
      ),
    getCachedHomepageProductSectionsData(),
    getLatestApprovedReviews(6),
  ]);

  return {
    heroSlides,
    categories,
    blogPosts,
    productSections,
    latestReviews,
  };
}

async function resolveHomepageData(): Promise<HomepageData> {
  const [shell, pageData] = await Promise.all([
    getCachedHomepageShellData(),
    getCachedHomepagePageData(),
  ]);

  return {
    ...shell,
    ...pageData,
  };
}

const getHomepageShellDataForDev = resolveHomepageShellData;
const getHomepageProductSectionsDataForDev = resolveHomepageProductSectionsData;
const getHomepagePageDataForDev = resolveHomepagePageData;
const getHomepageDataForDev = resolveHomepageData;

const getHomepageShellDataForProd = unstable_cache(resolveHomepageShellData, ["homepage-shell"], {
  revalidate: HOMEPAGE_REVALIDATE_SECONDS,
  tags: [HOMEPAGE_CACHE_TAG],
});

const getHomepageProductSectionsDataForProd = unstable_cache(
  resolveHomepageProductSectionsData,
  ["homepage-product-sections"],
  {
    revalidate: HOMEPAGE_REVALIDATE_SECONDS,
    tags: [HOMEPAGE_CACHE_TAG],
  }
);

const getHomepagePageDataForProd = unstable_cache(resolveHomepagePageData, ["homepage-page"], {
  revalidate: HOMEPAGE_REVALIDATE_SECONDS,
  tags: [HOMEPAGE_CACHE_TAG],
});

const getHomepageDataForProd = unstable_cache(resolveHomepageData, ["homepage-data"], {
  revalidate: HOMEPAGE_REVALIDATE_SECONDS,
  tags: [HOMEPAGE_CACHE_TAG],
});

function getCachedHomepageShellData() {
  return shouldUseProductionCache() ? getHomepageShellDataForProd() : getHomepageShellDataForDev();
}

function getCachedHomepageProductSectionsData() {
  return shouldUseProductionCache()
    ? getHomepageProductSectionsDataForProd()
    : getHomepageProductSectionsDataForDev();
}

function getCachedHomepagePageData() {
  return shouldUseProductionCache() ? getHomepagePageDataForProd() : getHomepagePageDataForDev();
}

export async function getHomepageShellData() {
  return getCachedHomepageShellData();
}

export async function getHomepageProductSectionsData() {
  return getCachedHomepageProductSectionsData();
}

export async function getHomepagePageData() {
  return getCachedHomepagePageData();
}

export async function getHomepageData() {
  return shouldUseProductionCache() ? getHomepageDataForProd() : getHomepageDataForDev();
}
