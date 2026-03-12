import { unstable_cache } from "next/cache";
import { cache } from "react";
import { getDemoAnnouncementMessages } from "@/lib/announcement-service";
import { getDemoBlogPosts } from "@/lib/blog-service";
import { getProducts } from "@/lib/data-service";
import { createFallbackAnnouncementMessage } from "@/lib/default-announcements";
import { DEFAULT_WHATSAPP_SETTINGS, createDefaultWhatsAppSettings } from "@/lib/default-whatsapp-settings";
import { getDemoHomepageCategories } from "@/lib/homepage-category-service";
import { shouldUseMockData } from "@/lib/live-data-mode";
import { getDemoPopups } from "@/lib/popup-service";
import { prisma } from "@/lib/prisma";
import { getCityInspiredProducts, getCustomersAlsoBought } from "@/lib/recommendations";
import { getDemoSocialLinks } from "@/lib/social-link-service";
import { getDemoWhatsAppSettings } from "@/lib/whatsapp-service";
import type {
  AnnouncementMessage,
  BlogPost,
  HomepageCategory,
  Popup,
  Product,
  SocialLink,
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
};

export type HomepageProductSectionsData = {
  featured: Product[];
  trending: Product[];
  newArrivals: Product[];
  alsoBought: Product[];
  cityInspired: Product[];
};

export type HomepagePageData = {
  categories: HomepageCategory[];
  blogPosts: BlogPost[];
  productSections: HomepageProductSectionsData;
};

export type HomepageData = HomepageShellData & HomepagePageData;

function shouldUseProductionCache() {
  return process.env.NODE_ENV === "production";
}

async function safeQuery<T>(query: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    return await query();
  } catch {
    return fallback();
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
    };
  }

  const now = new Date();
  const [announcements, popups, socialLinks, whatsAppSettings] = await Promise.all([
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
  ]);

  return {
    announcements,
    popups,
    socialLinks,
    whatsAppSettings,
  };
}

async function resolveHomepageProductSectionsData(): Promise<HomepageProductSectionsData> {
  const allProducts = await getProducts(undefined, {
    syncReservations: false,
    cacheKey: "homepage:products",
  });
  const featured = allProducts.filter((product) => product.isFeatured).slice(0, HOMEPAGE_PRODUCT_LIMIT);
  const trending = allProducts
    .filter((product) => product.tags.includes("trending"))
    .slice(0, HOMEPAGE_PRODUCT_LIMIT);
  const newArrivals = allProducts.filter((product) => product.isNew).slice(0, HOMEPAGE_PRODUCT_LIMIT);
  const referenceProduct = featured[0] ?? allProducts[0] ?? null;

  return {
    featured,
    trending,
    newArrivals,
    alsoBought: referenceProduct
      ? getCustomersAlsoBought(allProducts, referenceProduct, HOMEPAGE_PRODUCT_LIMIT)
      : [],
    cityInspired: getCityInspiredProducts(allProducts, "Nairobi", HOMEPAGE_PRODUCT_LIMIT),
  };
}

async function resolveHomepagePageData(): Promise<HomepagePageData> {
  const [categories, blogPosts, productSections] = await Promise.all([
    shouldUseMockData()
      ? Promise.resolve(getDemoHomepageCategories({ activeOnly: true }))
      : safeQuery(
          async () =>
            (await prisma.homepageCategory.findMany({
              where: { isActive: true },
              orderBy: [{ order: "asc" }, { createdAt: "asc" }],
            })) as HomepageCategory[],
          () => getDemoHomepageCategories({ activeOnly: true })
        ),
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
  ]);

  return {
    categories,
    blogPosts,
    productSections,
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

const getHomepageShellDataForDev = cache(resolveHomepageShellData);
const getHomepageProductSectionsDataForDev = cache(resolveHomepageProductSectionsData);
const getHomepagePageDataForDev = cache(resolveHomepagePageData);
const getHomepageDataForDev = cache(resolveHomepageData);

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
