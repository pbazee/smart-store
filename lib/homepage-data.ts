import { unstable_cache } from "next/cache";
import { getProducts } from "@/lib/data-service";
import { DEFAULT_BLOG_POST_SEEDS, createBlogSeed } from "@/lib/default-blog-posts";
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
const HOMEPAGE_SECTION_POOL_LIMIT = HOMEPAGE_PRODUCT_LIMIT * 2;
const HOMEPAGE_RECOMMENDATION_POOL_LIMIT = HOMEPAGE_PRODUCT_LIMIT * 6;
const HOMEPAGE_FALLBACK_POOL_LIMIT = HOMEPAGE_PRODUCT_LIMIT * 8;
const HOMEPAGE_BLOG_POST_LIMIT = 4;
const HOMEPAGE_REVIEW_LIMIT = 6;
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

function getFallbackBlogPosts() {
  return DEFAULT_BLOG_POST_SEEDS.slice(0, HOMEPAGE_BLOG_POST_LIMIT).map((seed) => createBlogSeed(seed));
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

function mergeHomepageProductPools(...collections: Product[][]) {
  const productsById = new Map<string, Product>();

  for (const collection of collections) {
    for (const product of collection) {
      if (!product?.id || productsById.has(product.id)) {
        continue;
      }

      productsById.set(product.id, product);
    }
  }

  return Array.from(productsById.values());
}

function selectHomepageSectionProducts(
  primaryProducts: Product[],
  fallbackProducts: Product[],
  take: number
) {
  const mergedProducts = mergeHomepageProductPools(primaryProducts, fallbackProducts);
  return mergedProducts.slice(0, take);
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

async function resolveHomepageHeroSlides(): Promise<HeroSlide[]> {
  if (shouldUseBuildFallbackData()) {
    return getDefaultHeroSlides();
  }

  return safeQuery(
    async () => await getActiveHeroSlides(),
    () => getDefaultHeroSlides()
  );
}

async function resolveHomepageCategories(): Promise<HomepageCategory[]> {
  if (shouldUseBuildFallbackData()) {
    return getFallbackHomepageCategories();
  }

  return safeQuery(
    async () => await getActiveHomepageCategories(),
    () => getFallbackHomepageCategories()
  );
}

async function resolveHomepageBlogPosts(): Promise<BlogPost[]> {
  if (shouldUseBuildFallbackData()) {
    return getFallbackBlogPosts();
  }

  return safeQuery(
    async () => {
      const posts = (await prisma.blog.findMany({
        where: { isPublished: true },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: HOMEPAGE_BLOG_POST_LIMIT,
      })) as BlogPost[];

      return posts.length > 0 ? posts : getFallbackBlogPosts();
    },
    () => getFallbackBlogPosts()
  );
}

async function resolveHomepageLatestReviews() {
  if (shouldUseBuildFallbackData()) {
    return [];
  }

  return safeQuery(
    async () => await getLatestApprovedReviews(HOMEPAGE_REVIEW_LIMIT),
    () => []
  );
}

async function resolveHomepageProductSectionsData(): Promise<HomepageProductSectionsData> {
  if (shouldUseBuildFallbackData()) {
    return getEmptyHomepageProductSectionsData();
  }

  const [
    popularPool,
    trendingPool,
    newArrivalsPool,
    recommendationPool,
    fallbackPool,
    popularOverrides,
    trendingOverrides,
    newArrivalOverrides,
    recommendedOverrides,
  ] = await Promise.all([
    getProducts(
      { isPopular: true, take: HOMEPAGE_SECTION_POOL_LIMIT },
      {
        syncReservations: false,
        cacheKey: "homepage:popular",
      }
    ),
    getProducts(
      { isTrending: true, take: HOMEPAGE_SECTION_POOL_LIMIT },
      {
        syncReservations: false,
        cacheKey: "homepage:trending",
      }
    ),
    getProducts(
      { isNew: true, take: HOMEPAGE_SECTION_POOL_LIMIT },
      {
        syncReservations: false,
        cacheKey: "homepage:new-arrivals",
      }
    ),
    getProducts(
      { take: HOMEPAGE_RECOMMENDATION_POOL_LIMIT },
      {
        syncReservations: false,
        cacheKey: "homepage:recommendation-pool",
      }
    ),
    getProducts(
      { take: HOMEPAGE_FALLBACK_POOL_LIMIT },
      {
        syncReservations: false,
        cacheKey: "homepage:fallback-pool",
      }
    ),
    getActiveLandingOverrides("popular", HOMEPAGE_PRODUCT_LIMIT),
    getActiveLandingOverrides("trending", HOMEPAGE_PRODUCT_LIMIT),
    getActiveLandingOverrides("new_arrivals", HOMEPAGE_PRODUCT_LIMIT),
    getActiveLandingOverrides("recommended", HOMEPAGE_PRODUCT_LIMIT),
  ]);

  const popularFallbackPool = fallbackPool.filter(
    (product) => product.isFeatured || product.isTrending || product.isNew
  );
  const featuredAuto = selectHomepageSectionProducts(
    popularPool,
    popularFallbackPool.length > 0 ? popularFallbackPool : fallbackPool,
    HOMEPAGE_PRODUCT_LIMIT
  );
  const featured = mergeOverridesWithAuto(popularOverrides, featuredAuto, HOMEPAGE_PRODUCT_LIMIT);

  const trendingFallbackPool = fallbackPool.filter(
    (product) => product.tags.includes("trending") || product.isPopular || product.isFeatured
  );
  const trendingAuto = selectHomepageSectionProducts(
    trendingPool,
    trendingFallbackPool.length > 0 ? trendingFallbackPool : fallbackPool,
    HOMEPAGE_PRODUCT_LIMIT
  );
  const trending = mergeOverridesWithAuto(trendingOverrides, trendingAuto, HOMEPAGE_PRODUCT_LIMIT);

  const newArrivalsAuto = selectHomepageSectionProducts(
    newArrivalsPool,
    fallbackPool,
    HOMEPAGE_PRODUCT_LIMIT
  );
  const newArrivals = mergeOverridesWithAuto(newArrivalOverrides, newArrivalsAuto, HOMEPAGE_PRODUCT_LIMIT);

  const recommendationCandidates = mergeHomepageProductPools(
    popularPool,
    trendingPool,
    newArrivalsPool,
    recommendationPool,
    fallbackPool
  );
  const referenceProduct = featured[0] ?? recommendationCandidates[0] ?? null;
  const recommendedAuto = referenceProduct
    ? getCustomersAlsoBought(
        recommendationCandidates,
        referenceProduct,
        HOMEPAGE_PRODUCT_LIMIT
      )
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
      getCityInspiredProducts(
        recommendationCandidates,
        "Nairobi",
        HOMEPAGE_PRODUCT_LIMIT
      )
    ),
  };
}

async function resolveHomepagePageData(): Promise<HomepagePageData> {
  if (shouldUseBuildFallbackData()) {
    return {
      heroSlides: await resolveHomepageHeroSlides(),
      categories: await resolveHomepageCategories(),
      blogPosts: [],
      productSections: getEmptyHomepageProductSectionsData(),
      latestReviews: [],
    };
  }

  const [heroSlides, categories, blogPosts, productSections, latestReviews] = await Promise.all([
    getCachedHomepageHeroSlides(),
    getCachedHomepageCategories(),
    getCachedHomepageBlogPosts(),
    getCachedHomepageProductSectionsData(),
    getCachedHomepageLatestReviews(),
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
const getHomepageHeroSlidesForDev = resolveHomepageHeroSlides;
const getHomepageCategoriesForDev = resolveHomepageCategories;
const getHomepageBlogPostsForDev = resolveHomepageBlogPosts;
const getHomepageProductSectionsDataForDev = resolveHomepageProductSectionsData;
const getHomepageLatestReviewsForDev = resolveHomepageLatestReviews;
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

const getHomepageHeroSlidesForProd = unstable_cache(
  resolveHomepageHeroSlides,
  ["homepage-hero-slides", HOMEPAGE_CACHE_VERSION],
  {
    revalidate: HOMEPAGE_REVALIDATE_SECONDS,
    tags: [HOMEPAGE_CACHE_TAG],
  }
);

const getHomepageCategoriesForProd = unstable_cache(
  resolveHomepageCategories,
  ["homepage-categories", HOMEPAGE_CACHE_VERSION],
  {
    revalidate: HOMEPAGE_REVALIDATE_SECONDS,
    tags: [HOMEPAGE_CACHE_TAG],
  }
);

const getHomepageBlogPostsForProd = unstable_cache(
  resolveHomepageBlogPosts,
  ["homepage-blog-posts", HOMEPAGE_CACHE_VERSION],
  {
    revalidate: HOMEPAGE_REVALIDATE_SECONDS,
    tags: [HOMEPAGE_CACHE_TAG],
  }
);

const getHomepageLatestReviewsForProd = unstable_cache(
  resolveHomepageLatestReviews,
  ["homepage-latest-reviews", HOMEPAGE_CACHE_VERSION],
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

function getCachedHomepageHeroSlides() {
  if (shouldUseBuildFallbackData()) {
    return getHomepageHeroSlidesForDev();
  }

  return shouldUseProductionCache()
    ? getHomepageHeroSlidesForProd()
    : getHomepageHeroSlidesForDev();
}

function getCachedHomepageCategories() {
  if (shouldUseBuildFallbackData()) {
    return getHomepageCategoriesForDev();
  }

  return shouldUseProductionCache()
    ? getHomepageCategoriesForProd()
    : getHomepageCategoriesForDev();
}

function getCachedHomepageBlogPosts() {
  if (shouldUseBuildFallbackData()) {
    return getHomepageBlogPostsForDev();
  }

  return shouldUseProductionCache()
    ? getHomepageBlogPostsForProd()
    : getHomepageBlogPostsForDev();
}

function getCachedHomepageLatestReviews() {
  if (shouldUseBuildFallbackData()) {
    return getHomepageLatestReviewsForDev();
  }

  return shouldUseProductionCache()
    ? getHomepageLatestReviewsForProd()
    : getHomepageLatestReviewsForDev();
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

export async function getHomepageHeroSlides() {
  return getCachedHomepageHeroSlides();
}

export async function getHomepageCategories() {
  return getCachedHomepageCategories();
}

export async function getHomepageBlogPosts() {
  return getCachedHomepageBlogPosts();
}

export async function getHomepageLatestReviews() {
  return getCachedHomepageLatestReviews();
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
