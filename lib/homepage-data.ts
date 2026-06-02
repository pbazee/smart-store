import "server-only";

import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { shouldSkipLiveDataDuringBuild } from "@/lib/live-data-mode";
import { prisma } from "@/lib/prisma";
import { getActiveCategories } from "@/lib/category-service";
import { getActiveHomepageCategories } from "@/lib/homepage-category-service";
import { getPublishedBlogPosts } from "@/lib/blog-service";
import { getActiveHeroSlides } from "@/lib/hero-slide-service";
import { getPromoBanners } from "@/lib/promo-banner-service";
import { getStoreSettings as getPersistedStoreSettings } from "@/lib/store-settings";
import { getWhatsAppSettings as getPersistedWhatsAppSettings } from "@/lib/whatsapp-service";
import { getSocialLinks as getPersistedSocialLinks } from "@/lib/social-link-service";
import { isPrismaConnectionError } from "@/lib/prisma-error-utils";
import type {
  AnnouncementMessage,
  Category,
  HeroSlide,
  Popup,
  Product,
  SocialLink,
  StoreSettings,
  WhatsAppSettings,
} from "@/types";

export const HOMEPAGE_CACHE_TAG = "homepage";
const STATIC_STORE_DATA_REVALIDATE_SECONDS = 900;
const SHELL_MEMORY_CACHE_MS = 15_000;

export type HomepageShellData = {
  announcements: AnnouncementMessage[];
  popups: Popup[];
  socialLinks: SocialLink[];
  whatsAppSettings: WhatsAppSettings | null;
  storeSettings: StoreSettings | null;
  navigationCategories: Category[];
};

const globalForHomepageData = globalThis as typeof globalThis & {
  _homepageShellData?: {
    expiresAt: number;
    data: HomepageShellData;
  };
  _pendingHomepageShellData?: Promise<HomepageShellData>;
};

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
  variantImageUrl: true,
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

const HOMEPAGE_BLOG_POST_SELECT = {
  id: true,
  title: true,
  slug: true,
  content: true,
  imageUrl: true,
  isPublished: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.BlogSelect;

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

function emptyCriticalProducts(): HomepageCriticalProductSectionsData {
  return {
    featured: [],
    trending: [],
  };
}

function emptyDeferredProducts(): HomepageDeferredProductSectionsData {
  return {
    newArrivals: [],
    alsoBought: [],
    cityInspired: [],
  };
}

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

  try {
    const products = await prisma.product.findMany({
      // NOTE: Do NOT filter by categoryId here — products without a linked category
      // should still appear on the homepage as long as they are flagged (isFeatured, etc.).
      where,
      orderBy,
      take,
      select: HOMEPAGE_PRODUCT_SELECT,
    });

    console.log(`[HomepageProducts] Query returned ${products.length} products for filter:`, JSON.stringify(where));
    return products.map(toHomepageProduct);
  } catch (error) {
    console.error("[HomepageProducts] queryHomepageProducts failed:", error, { filter: JSON.stringify(where) });
    throw error;
  }
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
      revalidate: 120,
      tags: [HOMEPAGE_CACHE_TAG, "products", `homepage-products:${key}`],
    }
  );

export async function getHomepageCollectionProducts(key: HomepageCollectionKey) {
  return getCachedHomepageCollectionProducts(key)();
}

export const getCachedHeroSlides = unstable_cache(
  async (): Promise<HeroSlide[]> => {
    try {
      if (shouldSkipLiveDataDuringBuild()) {
        return [];
      }
      return await getActiveHeroSlides();
    } catch (error) {
      console.error("[HeroSlides] DB error, returning empty fallback:", error);
      return [];
    }
  },
  ["hero-slides"],
  { revalidate: 60, tags: ["hero-slides", HOMEPAGE_CACHE_TAG] }
);

export const getCachedAnnouncements = unstable_cache(
  async () => {
    try {
      if (shouldSkipLiveDataDuringBuild()) {
        return [];
      }

      return await prisma.announcementMessage.findMany({
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
      });
    } catch (error) {
      console.error("[Announcements] DB error, returning empty fallback:", error);
      return [];
    }
  },
  ["announcements"],
  { revalidate: 60, tags: ["announcements", HOMEPAGE_CACHE_TAG] }
);

export const getCachedPromoBanners = unstable_cache(
  async () => {
    try {
      return await getPromoBanners({ activeOnly: true, seedIfEmpty: false });
    } catch (error) {
      console.error("[PromoBanners] DB error, returning empty fallback:", error);
      return [];
    }
  },
  ["promo-banners"],
  { revalidate: 300, tags: ["promo-banners", HOMEPAGE_CACHE_TAG] }
);

export const getCachedHomepageCriticalProducts = unstable_cache(
  async (): Promise<HomepageCriticalProductSectionsData> => {
    try {
      const featured = await getHomepageCollectionProducts("popular");
      const trending = await getHomepageCollectionProducts("trending");
      console.log(`[HomepageProducts] Critical: popular=${featured.length}, trending=${trending.length}`);
      return { featured, trending };
    } catch (error) {
      console.error("[HomepageProducts] Critical product lookup failed:", error);
      return emptyCriticalProducts();
    }
  },
  ["homepage-products", "critical"],
  { revalidate: 120, tags: [HOMEPAGE_CACHE_TAG, "products", "homepage-products"] }
);

export const getCachedHomepageDeferredProducts = unstable_cache(
  async (): Promise<HomepageDeferredProductSectionsData> => {
    try {
      const newArrivals = await getHomepageCollectionProducts("new-arrivals");
      const alsoBought = await getHomepageCollectionProducts("recommended");
      const cityInspired = await getHomepageCollectionProducts("city-inspired");
      console.log(`[HomepageProducts] Deferred: newArrivals=${newArrivals.length}, alsoBought=${alsoBought.length}, cityInspired=${cityInspired.length}`);
      return { newArrivals, alsoBought, cityInspired };
    } catch (error) {
      console.error("[HomepageProducts] Deferred product lookup failed:", error);
      return emptyDeferredProducts();
    }
  },
  ["homepage-products", "deferred"],
  { revalidate: 120, tags: [HOMEPAGE_CACHE_TAG, "products", "homepage-products"] }
);

export const getCachedHomepageProducts = unstable_cache(
  async (): Promise<HomepageProductSectionsData> => {
    try {
      const critical = await getCachedHomepageCriticalProducts();
      const deferred = await getCachedHomepageDeferredProducts();

      return {
        ...critical,
        ...deferred,
        popular: critical.featured,
      };
    } catch (error) {
      console.error("[HomepageProducts] DB error, not caching fallback:", error);
      if (isPrismaConnectionError(error)) {
        return {
          ...emptyCriticalProducts(),
          ...emptyDeferredProducts(),
          popular: [],
        };
      }
      throw error;
    }
  },
  ["homepage-products", "all"],
  { revalidate: 120, tags: [HOMEPAGE_CACHE_TAG, "products", "homepage-products"] }
);

export const getCachedHomepageCategories = unstable_cache(
  async () => {
    try {
      return await getActiveHomepageCategories();
    } catch (error) {
      console.error("[HomepageCategories] DB error, returning empty fallback:", error);
      return [];
    }
  },
  ["homepage-categories"],
  { revalidate: 600, tags: ["homepage-categories", HOMEPAGE_CACHE_TAG] }
);

export const getCachedStoreSettings = unstable_cache(
  async () => {
    try {
      if (shouldSkipLiveDataDuringBuild()) {
        return await getPersistedStoreSettings({
          seedIfEmpty: false,
          fallbackOnError: false,
        });
      }

      return await getPersistedStoreSettings({
        seedIfEmpty: false,
        fallbackOnError: false,
      });
    } catch (error) {
      console.error("[StoreSettings] DB error, not caching fallback:", error);
      if (isPrismaConnectionError(error)) {
        return null;
      }
      throw error;
    }
  },
  ["store-settings"],
  { revalidate: STATIC_STORE_DATA_REVALIDATE_SECONDS, tags: ["store-settings", HOMEPAGE_CACHE_TAG] }
);

export const getCachedPopups = unstable_cache(
  async () => {
    try {
      if (shouldSkipLiveDataDuringBuild()) {
        return [];
      }

      return await prisma.popup.findMany({
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
      });
    } catch (error) {
      console.error("[Popups] DB error, not caching fallback:", error);
      if (isPrismaConnectionError(error)) {
        return [];
      }
      throw error;
    }
  },
  ["popups"],
  { revalidate: STATIC_STORE_DATA_REVALIDATE_SECONDS, tags: ["popups", HOMEPAGE_CACHE_TAG] }
);

export const getCachedWhatsAppSettings = unstable_cache(
  async () => {
    try {
      if (shouldSkipLiveDataDuringBuild()) {
        return await getPersistedWhatsAppSettings({
          seedIfEmpty: false,
          fallbackOnError: false,
        });
      }

      return await getPersistedWhatsAppSettings({
        seedIfEmpty: false,
        fallbackOnError: false,
      });
    } catch (error) {
      console.error("[WhatsAppSettings] DB error, not caching fallback:", error);
      if (isPrismaConnectionError(error)) {
        return null;
      }
      throw error;
    }
  },
  ["whatsapp-settings"],
  { revalidate: STATIC_STORE_DATA_REVALIDATE_SECONDS, tags: ["whatsapp-settings", HOMEPAGE_CACHE_TAG] }
);

export const getCachedSocialLinks = unstable_cache(
  async () => {
    try {
      return await getPersistedSocialLinks({ seedIfEmpty: false, fallbackOnError: false });
    } catch (error) {
      console.error("[SocialLinks] DB error, not caching fallback:", error);
      if (isPrismaConnectionError(error)) {
        return [];
      }
      throw error;
    }
  },
  ["social-links"],
  { revalidate: STATIC_STORE_DATA_REVALIDATE_SECONDS, tags: ["social-links", HOMEPAGE_CACHE_TAG] }
);

export const getCachedHomepageBlogPosts = unstable_cache(
  async () => {
    try {
      if (shouldSkipLiveDataDuringBuild()) {
        return await getPublishedBlogPosts(4);
      }

      return await getPublishedBlogPosts(4);
    } catch (error) {
      console.error("[HomepageBlogPosts] DB error, not caching fallback:", error);
      if (isPrismaConnectionError(error)) {
        return [];
      }
      throw error;
    }
  },
  ["homepage-blog-posts"],
  { revalidate: 600, tags: ["blogs", HOMEPAGE_CACHE_TAG] }
);

export const getCachedHomepageLatestReviews = unstable_cache(
  async () => {
    try {
      if (shouldSkipLiveDataDuringBuild()) {
        return [];
      }

      return await prisma.review.findMany({
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
      });
    } catch (error) {
      console.error("[HomepageLatestReviews] DB error, returning empty fallback:", error);
      return [];
    }
  },
  ["homepage-latest-reviews"],
  { revalidate: 120, tags: ["reviews", HOMEPAGE_CACHE_TAG] }
);

async function loadHomepageShellData(): Promise<HomepageShellData> {
  const announcements = await getCachedAnnouncements().catch((error) => {
    console.error("[HomepageShell] Failed to load announcements:", error);
    return [];
  });
  const popups = await getCachedPopups().catch((error) => {
    console.error("[HomepageShell] Failed to load popups:", error);
    return [];
  });
  const socialLinks = await getCachedSocialLinks().catch((error) => {
    console.error("[HomepageShell] Failed to load social links:", error);
    return [];
  });
  const whatsAppSettings = await getCachedWhatsAppSettings().catch((error) => {
    console.error("[HomepageShell] Failed to load WhatsApp settings:", error);
    return null;
  });
  const storeSettings = await getCachedStoreSettings().catch((error) => {
    console.error("[HomepageShell] Failed to load store settings:", error);
    return null;
  });
  const navigationCategories = shouldSkipLiveDataDuringBuild()
    ? []
    : await getActiveCategories().catch((error) => {
        console.error("[HomepageShell] Failed to load navigation categories:", error);
        return [];
      });

  return { announcements, popups, socialLinks, whatsAppSettings, storeSettings, navigationCategories };
}

export async function getHomepageShellData() {
  const cached = globalForHomepageData._homepageShellData;

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  if (globalForHomepageData._pendingHomepageShellData) {
    return globalForHomepageData._pendingHomepageShellData;
  }

  const request = loadHomepageShellData()
    .then((data) => {
      globalForHomepageData._homepageShellData = {
        data,
        expiresAt: Date.now() + SHELL_MEMORY_CACHE_MS,
      };
      return data;
    })
    .finally(() => {
      globalForHomepageData._pendingHomepageShellData = undefined;
    });

  globalForHomepageData._pendingHomepageShellData = request;

  return request;
}

export async function getHomepagePageData() {
  console.log("[Homepage] getHomepagePageData: starting all section fetches...");

  const heroSlides = await getCachedHeroSlides().catch((error) => {
    console.error("[Homepage] ❌ heroSlides fetch failed:", error);
    return [] as Awaited<ReturnType<typeof getCachedHeroSlides>>;
  });

  const categories = await getCachedHomepageCategories().catch((error) => {
    console.error("[Homepage] ❌ categories fetch failed:", error);
    return [] as Awaited<ReturnType<typeof getCachedHomepageCategories>>;
  });

  const criticalProducts = await getCachedHomepageCriticalProducts().catch((error) => {
    console.error("[Homepage] ❌ criticalProducts fetch failed:", error);
    return emptyCriticalProducts();
  });

  const deferredProducts = await getCachedHomepageDeferredProducts().catch((error) => {
    console.error("[Homepage] ❌ deferredProducts fetch failed:", error);
    return emptyDeferredProducts();
  });

  const latestReviews = await getCachedHomepageLatestReviews().catch((error) => {
    console.error("[Homepage] ❌ latestReviews fetch failed:", error);
    return [] as Awaited<ReturnType<typeof getCachedHomepageLatestReviews>>;
  });

  const blogPosts = await getCachedHomepageBlogPosts().catch((error) => {
    console.error("[Homepage] ❌ blogPosts fetch failed:", error);
    return [] as Awaited<ReturnType<typeof getCachedHomepageBlogPosts>>;
  });

  console.log("[Homepage] Section fetch results:", {
    heroSlides: heroSlides.length,
    categories: categories.length,
    featuredProducts: criticalProducts.featured.length,
    trendingProducts: criticalProducts.trending.length,
    newArrivals: deferredProducts.newArrivals.length,
    alsoBought: deferredProducts.alsoBought.length,
    cityInspired: deferredProducts.cityInspired.length,
    latestReviews: latestReviews.length,
    blogPosts: blogPosts.length,
  });

  return {
    heroSlides,
    categories,
    criticalProducts,
    deferredProducts,
    latestReviews,
    blogPosts,
  };
}

export const getHomepageHeroSlides = getCachedHeroSlides;
export const getHomepageCategories = getCachedHomepageCategories;
export const getHomepageCriticalProductSectionsData = getCachedHomepageCriticalProducts;
export const getHomepageDeferredProductSectionsData = getCachedHomepageDeferredProducts;
export const getHomepageProductSectionsData = getCachedHomepageProducts;
export const getHomepageBlogPosts = getCachedHomepageBlogPosts;
export const getHomepageLatestReviews = getCachedHomepageLatestReviews;
export const getStoreSettings = getCachedStoreSettings;
export const getWhatsAppSettings = getCachedWhatsAppSettings;
export const getSocialLinks = getCachedSocialLinks;
