import { unstable_cache } from "next/cache";
import { getProducts } from "@/lib/data-service";
import { createHomepageCategorySeed, DEFAULT_HOMEPAGE_CATEGORY_SEEDS } from "@/lib/default-homepage-categories";
import { createFallbackAnnouncementMessage } from "@/lib/default-announcements";
import { getDefaultHeroSlides } from "@/lib/default-hero-slides";
import { createSocialLinkSeed, DEFAULT_SOCIAL_LINK_SEEDS } from "@/lib/default-social-links";
import { DEFAULT_STORE_SETTINGS } from "@/lib/default-store-settings";
import { getActiveHeroSlides } from "@/lib/hero-slide-service";
import { getActiveHomepageCategories } from "@/lib/homepage-category-service";
import { shouldSkipLiveDataDuringBuild } from "@/lib/live-data-mode";
import { getLatestApprovedReviews } from "@/lib/reviews-service";
import { getActiveLandingOverrides, mergeOverridesWithAuto } from "@/lib/landing-section-overrides";
import { prisma } from "@/lib/prisma";
import { getCityInspiredProducts, getCustomersAlsoBought } from "@/lib/recommendations";
import { createDefaultWhatsAppSettings } from "@/lib/default-whatsapp-settings";
import { getSocialLinks } from "@/lib/social-link-service";
import { getWhatsAppSettings, getWhatsAppSettingsFallback } from "@/lib/whatsapp-service";
import { getStoreSettings, getStoreSettingsFallback } from "@/lib/store-settings";
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
const HOMEPAGE_CACHE_VERSION =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.VERCEL_DEPLOYMENT_ID ||
  process.env.GITHUB_SHA ||
  "local";

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

function shouldUseBuildFallbackData() {
  return shouldSkipLiveDataDuringBuild();
}

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

function getEmptyHomepageProductSectionsData(): HomepageProductSectionsData {
  return {
    featured: [],
    trending: [],
    newArrivals: [],
    alsoBought: [],
    cityInspired: [],
  };
}

function getFallbackHomepageCategories(): HomepageCategory[] {
  return DEFAULT_HOMEPAGE_CATEGORY_SEEDS.map((seed) => createHomepageCategorySeed(seed));
}

function getFallbackSocialLinks(): SocialLink[] {
  return DEFAULT_SOCIAL_LINK_SEEDS.map((seed) => createSocialLinkSeed(seed));
}

function compactHomepageProduct(product: Product): Product {
  return {
    ...product,
    description:
      product.description.length > 240
        ? `${product.description.slice(0, 237)}...`
        : product.description,
    images: product.images.slice(0, 1),
  };
}

function compactHomepageProducts(products: Product[]) {
  return products.map((product) => compactHomepageProduct(product));
}

async function resolveHomepageShellData(options: {
  allowRuntimeFallbacks?: boolean;
} = {}): Promise<HomepageShellData> {
  const { allowRuntimeFallbacks = true } = options;

  if (shouldUseBuildFallbackData()) {
    return {
      announcements: [createFallbackAnnouncementMessage()],
      popups: [],
      socialLinks: getFallbackSocialLinks(),
      whatsAppSettings: createDefaultWhatsAppSettings(),
      storeSettings: DEFAULT_STORE_SETTINGS,
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
      allowRuntimeFallbacks
        ? safeQuery(
            async () => await getSocialLinks({ seedIfEmpty: true }),
            () => getFallbackSocialLinks()
          )
        : getSocialLinks({ seedIfEmpty: true }),
      allowRuntimeFallbacks
        ? safeQuery(
            async () =>
              (await getWhatsAppSettings({
                seedIfEmpty: true,
                fallbackOnError: true,
              })) ?? getWhatsAppSettingsFallback(),
            () => getWhatsAppSettingsFallback()
          )
        : getWhatsAppSettings({
            seedIfEmpty: true,
            fallbackOnError: false,
          }),
      allowRuntimeFallbacks
        ? safeQuery(
            async () =>
              (await getStoreSettings({
                seedIfEmpty: true,
                fallbackOnError: true,
              })) as StoreSettings | null,
            () => getStoreSettingsFallback()
          )
        : getStoreSettings({
            seedIfEmpty: true,
            fallbackOnError: false,
          }) as Promise<StoreSettings | null>,
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
  if (shouldUseBuildFallbackData()) {
    return getEmptyHomepageProductSectionsData();
  }

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
    featured: compactHomepageProducts(featured),
    trending: compactHomepageProducts(trending),
    newArrivals: compactHomepageProducts(newArrivals),
    alsoBought: compactHomepageProducts(alsoBought),
    cityInspired: compactHomepageProducts(
      getCityInspiredProducts(allProducts, "Nairobi", HOMEPAGE_PRODUCT_LIMIT)
    ),
  };
}

async function resolveHomepagePageData(): Promise<HomepagePageData> {
  if (shouldUseBuildFallbackData()) {
    return {
      heroSlides: getDefaultHeroSlides(),
      categories: getFallbackHomepageCategories(),
      blogPosts: [],
      productSections: getEmptyHomepageProductSectionsData(),
      latestReviews: [],
    };
  }

  const [heroSlides, categories, blogPosts, productSections, latestReviews] = await Promise.all([
    safeQuery(
      async () => await getActiveHeroSlides(),
      () => getDefaultHeroSlides()
    ),
    safeQuery(
      async () => await getActiveHomepageCategories(),
      () => getFallbackHomepageCategories()
    ),
    safeQuery(
      async () =>
        (await prisma.blog.findMany({
          where: { isPublished: true },
          orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
          take: 4,
        })) as BlogPost[],
      () => []
    ),
    safeQuery(
      async () => await getCachedHomepageProductSectionsData(),
      () => getEmptyHomepageProductSectionsData()
    ),
    safeQuery(
      async () => await getLatestApprovedReviews(6),
      () => []
    ),
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

const getHomepageShellDataForDev = () => resolveHomepageShellData({ allowRuntimeFallbacks: true });
const getHomepageProductSectionsDataForDev = resolveHomepageProductSectionsData;
const getHomepagePageDataForDev = resolveHomepagePageData;
const getHomepageDataForDev = resolveHomepageData;

const getHomepageShellDataForProd = unstable_cache(
  () => resolveHomepageShellData({ allowRuntimeFallbacks: false }),
  ["homepage-shell", HOMEPAGE_CACHE_VERSION],
  {
  revalidate: HOMEPAGE_REVALIDATE_SECONDS,
  tags: [HOMEPAGE_CACHE_TAG],
  }
);

const getHomepageProductSectionsDataForProd = unstable_cache(
  resolveHomepageProductSectionsData,
  ["homepage-product-sections", HOMEPAGE_CACHE_VERSION],
  {
    revalidate: HOMEPAGE_REVALIDATE_SECONDS,
    tags: [HOMEPAGE_CACHE_TAG],
  }
);

const getHomepagePageDataForProd = unstable_cache(
  resolveHomepagePageData,
  ["homepage-page", HOMEPAGE_CACHE_VERSION],
  {
  revalidate: HOMEPAGE_REVALIDATE_SECONDS,
  tags: [HOMEPAGE_CACHE_TAG],
  }
);

const getHomepageDataForProd = unstable_cache(
  resolveHomepageData,
  ["homepage-data", HOMEPAGE_CACHE_VERSION],
  {
  revalidate: HOMEPAGE_REVALIDATE_SECONDS,
  tags: [HOMEPAGE_CACHE_TAG],
  }
);

function getCachedHomepageShellData() {
  if (shouldUseBuildFallbackData()) {
    return getHomepageShellDataForDev();
  }

  return shouldUseProductionCache() ? getHomepageShellDataForProd() : getHomepageShellDataForDev();
}

function getCachedHomepageProductSectionsData() {
  if (shouldUseBuildFallbackData()) {
    return getHomepageProductSectionsDataForDev();
  }

  return shouldUseProductionCache()
    ? getHomepageProductSectionsDataForProd()
    : getHomepageProductSectionsDataForDev();
}

function getCachedHomepagePageData() {
  if (shouldUseBuildFallbackData()) {
    return getHomepagePageDataForDev();
  }

  return shouldUseProductionCache() ? getHomepagePageDataForProd() : getHomepagePageDataForDev();
}

export async function getHomepageShellData() {
  try {
    return await getCachedHomepageShellData();
  } catch (error) {
    console.error("[Homepage] Failed to resolve cached shell data, retrying uncached:", error);
    return resolveHomepageShellData({ allowRuntimeFallbacks: true });
  }
}

export async function getHomepageProductSectionsData() {
  return getCachedHomepageProductSectionsData();
}

export async function getHomepagePageData() {
  return getCachedHomepagePageData();
}

export async function getHomepageData() {
  if (shouldUseBuildFallbackData()) {
    return getHomepageDataForDev();
  }

  return shouldUseProductionCache() ? getHomepageDataForProd() : getHomepageDataForDev();
}
