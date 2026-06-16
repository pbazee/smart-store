import "server-only";
import { cache } from "react";

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
export const HOMEPAGE_PRODUCTS_CACHE_TAG = "homepage-products";
const STATIC_STORE_DATA_REVALIDATE_SECONDS = 900;
const HOMEPAGE_PRODUCTS_REVALIDATE_SECONDS = 3600;

export type HomepageShellData = {
  announcements: AnnouncementMessage[];
  popups: Popup[];
  socialLinks: SocialLink[];
  whatsAppSettings: WhatsAppSettings | null;
  storeSettings: StoreSettings | null;
  navigationCategories: Category[];
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
  // Only take the first image to keep cache payload small (< 2MB limit).
  // Full image gallery is loaded on the product detail page.
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
    orderBy: [{ stock: "desc" }, { price: "asc" }] as const,
    take: 6,
  },
} satisfies Prisma.ProductSelect;

const HOMEPAGE_BLOG_POST_SELECT = {
  id: true,
  title: true,
  slug: true,
  imageUrl: true,
  authorName: true,
  category: true,
  tags: true,
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
    images: (() => {
      const realImage = product.images.find(img => !img.startsWith("data:image/"));
      if (realImage) return [realImage];
      const variantImg = product.variants.find(v => v.variantImageUrl)?.variantImageUrl;
      return variantImg ? [variantImg] : [];
    })(),
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
      revalidate: HOMEPAGE_PRODUCTS_REVALIDATE_SECONDS,
      tags: [HOMEPAGE_CACHE_TAG, "products", HOMEPAGE_PRODUCTS_CACHE_TAG, `homepage-products:${key}`],
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
    return await getActiveHeroSlides();
  },
  ["hero-slides"],
  { revalidate: 60, tags: ["hero-slides", HOMEPAGE_CACHE_TAG] }
);

export const getCachedAnnouncements = unstable_cache(
  async () => {
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
  },
  ["announcements"],
  { revalidate: 60, tags: ["announcements", HOMEPAGE_CACHE_TAG] }
);

export const getCachedPromoBanners = unstable_cache(
  async () => {
    return await getPromoBanners({ activeOnly: true, seedIfEmpty: false });
  },
  ["promo-banners"],
  { revalidate: 300, tags: ["promo-banners", HOMEPAGE_CACHE_TAG] }
);

export async function getCachedHomepageCriticalProducts(): Promise<HomepageCriticalProductSectionsData> {
  try {
    const featured = await getHomepageCollectionProducts("popular");
    const trending = await getHomepageCollectionProducts("trending");
    console.log(`[HomepageProducts] Critical: popular=${featured.length}, trending=${trending.length}`);
    return { featured, trending };
  } catch (error) {
    console.error("[HomepageProducts] Critical product lookup failed:", error);
    return emptyCriticalProducts();
  }
}

export async function getCachedHomepageDeferredProducts(): Promise<HomepageDeferredProductSectionsData> {
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
}

export async function getCachedHomepageProducts(): Promise<HomepageProductSectionsData> {
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
}

export const getCachedHomepageCategories = unstable_cache(
  async () => {
    return await getActiveHomepageCategories();
  },
  ["homepage-categories"],
  { revalidate: 600, tags: ["homepage-categories", HOMEPAGE_CACHE_TAG] }
);

export const getCachedStoreSettings = unstable_cache(
  async () => {
    if (shouldSkipLiveDataDuringBuild()) {
      return await getPersistedStoreSettings({ seedIfEmpty: false, fallbackOnError: false });
    }
    return await getPersistedStoreSettings({ seedIfEmpty: false, fallbackOnError: false });
  },
  ["store-settings"],
  { revalidate: STATIC_STORE_DATA_REVALIDATE_SECONDS, tags: ["store-settings", HOMEPAGE_CACHE_TAG] }
);

export const getCachedPopups = unstable_cache(
  async () => {
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
  },
  ["popups"],
  { revalidate: STATIC_STORE_DATA_REVALIDATE_SECONDS, tags: ["popups", HOMEPAGE_CACHE_TAG] }
);

export const getCachedWhatsAppSettings = unstable_cache(
  async () => {
    if (shouldSkipLiveDataDuringBuild()) {
      return await getPersistedWhatsAppSettings({ seedIfEmpty: false, fallbackOnError: false });
    }
    return await getPersistedWhatsAppSettings({ seedIfEmpty: false, fallbackOnError: false });
  },
  ["whatsapp-settings"],
  { revalidate: STATIC_STORE_DATA_REVALIDATE_SECONDS, tags: ["whatsapp-settings", HOMEPAGE_CACHE_TAG] }
);

export const getCachedSocialLinks = unstable_cache(
  async () => {
    return await getPersistedSocialLinks({ seedIfEmpty: false, fallbackOnError: false });
  },
  ["social-links"],
  { revalidate: STATIC_STORE_DATA_REVALIDATE_SECONDS, tags: ["social-links", HOMEPAGE_CACHE_TAG] }
);

export const getCachedHomepageBlogPosts = unstable_cache(
  async () => {
    if (shouldSkipLiveDataDuringBuild()) {
      return [];
    }

    return await getPublishedBlogPosts(4);
  },
  ["homepage-blog-posts"],
  { revalidate: 600, tags: ["blogs", HOMEPAGE_CACHE_TAG] }
);

export const getCachedHomepageLatestReviews = unstable_cache(
  async () => {
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
  },
  ["homepage-latest-reviews"],
  { revalidate: 120, tags: ["reviews", HOMEPAGE_CACHE_TAG] }
);

async function loadHomepageShellData(): Promise<HomepageShellData> {
  const [
    announcements,
    popups,
    socialLinks,
    whatsAppSettings,
    storeSettings,
    navigationCategories,
  ] = await Promise.all([
    getCachedAnnouncements().catch((error) => {
      console.error("[HomepageShell] Failed to load announcements:", error);
      return [] as Awaited<ReturnType<typeof getCachedAnnouncements>>;
    }),
    getCachedPopups().catch((error) => {
      console.error("[HomepageShell] Failed to load popups:", error);
      return [] as Awaited<ReturnType<typeof getCachedPopups>>;
    }),
    getCachedSocialLinks().catch((error) => {
      console.error("[HomepageShell] Failed to load social links:", error);
      return [] as Awaited<ReturnType<typeof getCachedSocialLinks>>;
    }),
    getCachedWhatsAppSettings().catch((error) => {
      console.error("[HomepageShell] Failed to load WhatsApp settings:", error);
      return null;
    }),
    getCachedStoreSettings().catch((error) => {
      console.error("[HomepageShell] Failed to load store settings:", error);
      return null;
    }),
    shouldSkipLiveDataDuringBuild()
      ? Promise.resolve([] as Awaited<ReturnType<typeof getActiveCategories>>)
      : getActiveCategories().catch((error) => {
          console.error("[HomepageShell] Failed to load navigation categories:", error);
          return [] as Awaited<ReturnType<typeof getActiveCategories>>;
        }),
  ]);

  return { announcements, popups, socialLinks, whatsAppSettings, storeSettings, navigationCategories };
}

export const getHomepageShellData = cache(loadHomepageShellData);

export const getHomepagePageData = cache(async () => {
  const [
    heroSlides,
    categories,
    criticalProducts,
    deferredProducts,
    latestReviews,
    blogPosts,
  ] = await Promise.all([
    getCachedHeroSlides().catch((error) => {
      console.error("[Homepage] ❌ heroSlides fetch failed:", error);
      return [] as Awaited<ReturnType<typeof getCachedHeroSlides>>;
    }),
    getCachedHomepageCategories().catch((error) => {
      console.error("[Homepage] ❌ categories fetch failed:", error);
      return [] as Awaited<ReturnType<typeof getCachedHomepageCategories>>;
    }),
    getCachedHomepageCriticalProducts().catch((error) => {
      console.error("[Homepage] ❌ criticalProducts fetch failed:", error);
      return emptyCriticalProducts();
    }),
    getCachedHomepageDeferredProducts().catch((error) => {
      console.error("[Homepage] ❌ deferredProducts fetch failed:", error);
      return emptyDeferredProducts();
    }),
    getCachedHomepageLatestReviews().catch((error) => {
      console.error("[Homepage] ❌ latestReviews fetch failed:", error);
      return [] as Awaited<ReturnType<typeof getCachedHomepageLatestReviews>>;
    }),
    getCachedHomepageBlogPosts().catch((error) => {
      console.error("[Homepage] ❌ blogPosts fetch failed:", error);
      return [] as Awaited<ReturnType<typeof getCachedHomepageBlogPosts>>;
    }),
  ]);

  return {
    heroSlides,
    categories,
    criticalProducts,
    deferredProducts,
    latestReviews,
    blogPosts,
  };
});

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
