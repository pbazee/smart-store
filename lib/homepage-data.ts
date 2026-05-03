import "server-only";

import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { shouldSkipLiveDataDuringBuild } from "@/lib/live-data-mode";
import { prisma } from "@/lib/prisma";
import { getActiveCategories } from "@/lib/category-service";
import { getActiveHomepageCategories } from "@/lib/homepage-category-service";
import { getPromoBanners } from "@/lib/promo-banner-service";
import { getStoreSettings as getPersistedStoreSettings } from "@/lib/store-settings";
import { getWhatsAppSettings as getPersistedWhatsAppSettings } from "@/lib/whatsapp-service";
import { getSocialLinks as getPersistedSocialLinks } from "@/lib/social-link-service";
import type { HeroSlide, Product } from "@/types";

export const HOMEPAGE_CACHE_TAG = "homepage";
const STATIC_STORE_DATA_REVALIDATE_SECONDS = 900;

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

  const products = await prisma.product.findMany({
    where: {
      categoryId: { not: null },
      ...where,
    },
    orderBy,
    take,
    select: HOMEPAGE_PRODUCT_SELECT,
  });

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
    try {
      if (shouldSkipLiveDataDuringBuild()) {
        return [];
      }

      const slides = await prisma.heroSlide.findMany({
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
      });

      return slides as HeroSlide[];
    } catch (error) {
      console.error("[HeroSlides] DB error, using fallback:", error);
      return [];
    }
  },
  ["hero-slides"],
  { revalidate: 120, tags: ["hero-slides", HOMEPAGE_CACHE_TAG] }
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
      console.error("[Announcements] DB error, using fallback:", error);
      return [];
    }
  },
  ["announcements"],
  { revalidate: 300, tags: ["announcements", HOMEPAGE_CACHE_TAG] }
);

export const getCachedPromoBanners = unstable_cache(
  async () => {
    try {
      return await getPromoBanners({ activeOnly: true, seedIfEmpty: false });
    } catch (error) {
      console.error("[PromoBanners] DB error, using fallback:", error);
      return [];
    }
  },
  ["promo-banners"],
  { revalidate: 300, tags: ["promo-banners", HOMEPAGE_CACHE_TAG] }
);

export const getCachedHomepageCriticalProducts = unstable_cache(
  async (): Promise<HomepageCriticalProductSectionsData> => {
    const featured = await getHomepageCollectionProducts("popular");
    const trending = await getHomepageCollectionProducts("trending");

    return { featured, trending };
  },
  ["homepage-products", "critical"],
  { revalidate: 300, tags: [HOMEPAGE_CACHE_TAG, "products", "homepage-products"] }
);

export const getCachedHomepageDeferredProducts = unstable_cache(
  async (): Promise<HomepageDeferredProductSectionsData> => {
    const newArrivals = await getHomepageCollectionProducts("new-arrivals");
    const alsoBought = await getHomepageCollectionProducts("recommended");
    const cityInspired = await getHomepageCollectionProducts("city-inspired");

    return { newArrivals, alsoBought, cityInspired };
  },
  ["homepage-products", "deferred"],
  { revalidate: 300, tags: [HOMEPAGE_CACHE_TAG, "products", "homepage-products"] }
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
      console.error("[HomepageProducts] DB error, using fallback:", error);
      return {
        featured: [],
        trending: [],
        newArrivals: [],
        popular: [],
        alsoBought: [],
        cityInspired: [],
      };
    }
  },
  ["homepage-products", "all"],
  { revalidate: 300, tags: [HOMEPAGE_CACHE_TAG, "products", "homepage-products"] }
);

export const getCachedHomepageCategories = unstable_cache(
  async () => {
    try {
      return await getActiveHomepageCategories();
    } catch (error) {
      console.error("[HomepageCategories] DB error, using fallback:", error);
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
        return null;
      }

      return await getPersistedStoreSettings({
        seedIfEmpty: true,
        fallbackOnError: false,
      });
    } catch (error) {
      console.error("[StoreSettings] DB error, returning null:", error);
      return null;
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
      console.error("[Popups] DB error, using fallback:", error);
      return [];
    }
  },
  ["popups"],
  { revalidate: STATIC_STORE_DATA_REVALIDATE_SECONDS, tags: ["popups", HOMEPAGE_CACHE_TAG] }
);

export const getCachedWhatsAppSettings = unstable_cache(
  async () => {
    try {
      if (shouldSkipLiveDataDuringBuild()) {
        return null;
      }

      return await getPersistedWhatsAppSettings({
        seedIfEmpty: true,
        fallbackOnError: false,
      });
    } catch (error) {
      console.error("[WhatsAppSettings] DB error, returning null:", error);
      return null;
    }
  },
  ["whatsapp-settings"],
  { revalidate: STATIC_STORE_DATA_REVALIDATE_SECONDS, tags: ["whatsapp-settings", HOMEPAGE_CACHE_TAG] }
);

export const getCachedSocialLinks = unstable_cache(
  async () => {
    try {
      if (shouldSkipLiveDataDuringBuild()) {
        return [];
      }

      return await getPersistedSocialLinks({
        seedIfEmpty: true,
      });
    } catch (error) {
      console.error("[SocialLinks] DB error, returning empty list:", error);
      return [];
    }
  },
  ["social-links"],
  { revalidate: STATIC_STORE_DATA_REVALIDATE_SECONDS, tags: ["social-links", HOMEPAGE_CACHE_TAG] }
);

export const getCachedHomepageBlogPosts = unstable_cache(
  async () => {
    try {
      if (shouldSkipLiveDataDuringBuild()) {
        return [];
      }

      return await prisma.blog.findMany({
        where: { isPublished: true },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: 4,
        select: HOMEPAGE_BLOG_POST_SELECT,
      });
    } catch (error) {
      console.error("[HomepageBlogPosts] DB error, using fallback:", error);
      return [];
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
      console.error("[HomepageLatestReviews] DB error, using fallback:", error);
      return [];
    }
  },
  ["homepage-latest-reviews"],
  { revalidate: 300, tags: ["reviews", HOMEPAGE_CACHE_TAG] }
);

export async function getHomepageShellData() {
  const announcements = await getCachedAnnouncements();
  const popups = await getCachedPopups();
  const socialLinks = await getCachedSocialLinks();
  const whatsAppSettings = await getCachedWhatsAppSettings();
  const storeSettings = await getCachedStoreSettings();
  const navigationCategories = shouldSkipLiveDataDuringBuild()
    ? []
    : await getActiveCategories().catch((error) => {
        console.error("[HomepageShell] Failed to load navigation categories:", error);
        return [];
      });

  return { announcements, popups, socialLinks, whatsAppSettings, storeSettings, navigationCategories };
}

export async function getHomepagePageData() {
  const heroSlides = await getCachedHeroSlides();
  const categories = await getCachedHomepageCategories();
  const criticalProducts = await getCachedHomepageCriticalProducts();
  const deferredProducts = await getCachedHomepageDeferredProducts();
  const latestReviews = await getCachedHomepageLatestReviews();
  const blogPosts = await getCachedHomepageBlogPosts();

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
