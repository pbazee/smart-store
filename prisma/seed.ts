import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { DEFAULT_ANNOUNCEMENT_MESSAGE_SEEDS } from "../lib/default-announcements";
import { DEFAULT_BLOG_POST_SEEDS } from "../lib/default-blog-posts";
import { DEFAULT_HERO_SLIDE_SEEDS } from "../lib/default-hero-slides";
import { DEFAULT_HOMEPAGE_CATEGORY_SEEDS } from "../lib/default-homepage-categories";
import { DEFAULT_COUPON_SEEDS } from "../lib/default-coupons";
import { DEFAULT_SOCIAL_LINK_SEEDS } from "../lib/default-social-links";
import { DEFAULT_WHATSAPP_SETTINGS } from "../lib/default-whatsapp-settings";
import { DEFAULT_STORE_SETTINGS } from "../lib/default-store-settings";
import { DEFAULT_SHIPPING_RULES } from "../lib/default-shipping-rules";
import { mockProducts } from "../lib/mock-data";
import { buildInvalidCatalogProductWhere } from "../lib/product-integrity";
import { hashPassword } from "../lib/password";

loadEnvConfig(process.cwd());

function resolveDatabaseUrl(rawUrl = process.env.DIRECT_URL || process.env.DATABASE_URL) {
  if (!rawUrl) {
    return rawUrl;
  }

  try {
    const url = new URL(rawUrl);
    const isSupabaseUrl = url.hostname.includes("supabase");
    const isSupabasePooler = url.hostname.includes("pooler.supabase.com") || url.port === "6543";

    if (isSupabaseUrl && !url.searchParams.has("sslmode")) {
      url.searchParams.set("sslmode", "require");
    }

    if (isSupabasePooler) {
      if (!url.searchParams.has("pgbouncer")) {
        url.searchParams.set("pgbouncer", "true");
      }
      if (!url.searchParams.has("connection_limit")) {
        url.searchParams.set("connection_limit", "1");
      }
      if (!url.searchParams.has("connect_timeout")) {
        url.searchParams.set("connect_timeout", "30");
      }
      if (!url.searchParams.has("pool_timeout")) {
        url.searchParams.set("pool_timeout", "30");
      }
    }

    return url.toString();
  } catch {
    return rawUrl;
  }
}

const resolvedDatabaseUrl = resolveDatabaseUrl();
const prisma = new PrismaClient({
  datasources: resolvedDatabaseUrl
    ? {
      db: {
        url: resolvedDatabaseUrl,
      },
    }
    : undefined,
});

async function main() {
  console.log("Starting seed...");

  try {
    console.log("Seeding admin user...");
    const adminPasswordHash = await hashPassword("admin123");
    await prisma.user.upsert({
      where: { email: "admin@store.com" },
      update: {
        email: "admin@store.com",
        fullName: "Store Admin",
        role: "ADMIN",
        passwordHash: adminPasswordHash,
      },
      create: {
        id: "local-admin-store",
        email: "admin@store.com",
        fullName: "Store Admin",
        role: "ADMIN",
        passwordHash: adminPasswordHash,
      },
    });

    console.log("Seeding second admin user (peterkinuthia726@gmail.com)...");
    await prisma.user.upsert({
      where: { email: "peterkinuthia726@gmail.com" },
      update: {
        role: "ADMIN",
      },
      create: {
        id: "admin-peter",
        email: "peterkinuthia726@gmail.com",
        fullName: "Peter Kinuthia",
        role: "ADMIN",
        passwordHash: adminPasswordHash,
      },
    });

    console.log("Seeding categories...");
    const categories = [
      { name: "Shoes", slug: "shoes", description: "Footwear for every occasion" },
      { name: "Clothes", slug: "clothes", description: "Fashion and apparel" },
      { name: "Accessories", slug: "accessories", description: "Complete your look" },
    ];
    const topLevelCategoriesBySlug = new Map<string, { id: string; slug: string }>();

    for (const category of categories) {
      const seededCategory = await prisma.category.upsert({
        where: { slug: category.slug },
        update: category,
        create: category,
      });
      topLevelCategoriesBySlug.set(seededCategory.slug, {
        id: seededCategory.id,
        slug: seededCategory.slug,
      });
      console.log(`Seeded category: ${category.name}`);
    }

    console.log("Seeding announcement messages...");
    for (const announcement of DEFAULT_ANNOUNCEMENT_MESSAGE_SEEDS) {
      await prisma.announcementMessage.upsert({
        where: { id: announcement.id },
        update: announcement,
        create: announcement,
      });
      console.log(`Seeded announcement: ${announcement.text}`);
    }

    console.log("Seeding homepage categories...");
    for (const category of DEFAULT_HOMEPAGE_CATEGORY_SEEDS) {
      const categorySlug = category.link.split("/").filter(Boolean).at(-1)?.toLowerCase() ?? "";
      const mappedParentSlug =
        categorySlug === "shoes"
          ? "shoes"
          : ["dresses", "jeans", "jackets"].includes(categorySlug)
            ? "clothes"
            : null;

      await prisma.homepageCategory.upsert({
        where: { id: category.id },
        update: {
          ...category,
          parentCategoryId: mappedParentSlug
            ? topLevelCategoriesBySlug.get(mappedParentSlug)?.id ?? null
            : null,
        },
        create: {
          ...category,
          parentCategoryId: mappedParentSlug
            ? topLevelCategoriesBySlug.get(mappedParentSlug)?.id ?? null
            : null,
        },
      });
      console.log(`Seeded homepage category: ${category.title}`);
    }

    console.log("Seeding hero slides...");
    for (const slide of DEFAULT_HERO_SLIDE_SEEDS) {
      await prisma.heroSlide.upsert({
        where: { id: slide.id },
        update: {
          title: slide.title,
          subtitle: slide.subtitle,
          imageUrl: slide.imageUrl,
          ctaText: slide.ctaText,
          ctaLink: slide.ctaLink,
          moodTags: slide.moodTags,
          locationBadge: slide.locationBadge,
          order: slide.order,
          isActive: slide.isActive,
        },
        create: {
          id: slide.id,
          title: slide.title,
          subtitle: slide.subtitle,
          imageUrl: slide.imageUrl,
          ctaText: slide.ctaText,
          ctaLink: slide.ctaLink,
          moodTags: slide.moodTags,
          locationBadge: slide.locationBadge,
          order: slide.order,
          isActive: slide.isActive,
        },
      });
      console.log(`Seeded hero slide: ${slide.title}`);
    }

    console.log("Seeding blog posts...");
    for (const post of DEFAULT_BLOG_POST_SEEDS) {
      await prisma.blog.upsert({
        where: { slug: post.slug },
        update: {
          title: post.title,
          content: post.content,
          imageUrl: post.imageUrl,
          isPublished: post.isPublished,
          publishedAt: post.publishedAt ? new Date(post.publishedAt) : null,
        },
        create: {
          id: post.id,
          title: post.title,
          slug: post.slug,
          content: post.content,
          imageUrl: post.imageUrl,
          isPublished: post.isPublished,
          publishedAt: post.publishedAt ? new Date(post.publishedAt) : null,
        },
      });
      console.log(`Seeded blog post: ${post.title}`);
    }

    console.log("Seeding coupons...");
    for (const coupon of DEFAULT_COUPON_SEEDS) {
      await prisma.coupon.upsert({
        where: { code: coupon.code },
        update: {
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minOrderAmount: coupon.minOrderAmount,
          maxUsage: coupon.maxUsage,
          isActive: coupon.isActive,
          expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt) : null,
        },
        create: {
          id: coupon.id,
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minOrderAmount: coupon.minOrderAmount,
          maxUsage: coupon.maxUsage,
          usedCount: coupon.usedCount,
          expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt) : null,
          isActive: coupon.isActive,
        },
      });
      console.log(`Seeded coupon: ${coupon.code}`);
    }

    console.log("Seeding social links...");
    for (const socialLink of DEFAULT_SOCIAL_LINK_SEEDS) {
      await prisma.socialLink.upsert({
        where: { id: socialLink.id },
        update: {
          platform: socialLink.platform,
          url: socialLink.url,
          icon: socialLink.icon,
        },
        create: socialLink,
      });
      console.log(`Seeded social link: ${socialLink.platform}`);
    }

    console.log("Seeding WhatsApp settings...");
    await prisma.whatsAppSettings.upsert({
      where: { id: DEFAULT_WHATSAPP_SETTINGS.id },
      update: {
        phoneNumber: DEFAULT_WHATSAPP_SETTINGS.phoneNumber,
        defaultMessage: DEFAULT_WHATSAPP_SETTINGS.defaultMessage,
        isActive: DEFAULT_WHATSAPP_SETTINGS.isActive,
      },
      create: DEFAULT_WHATSAPP_SETTINGS,
    });
    console.log("Seeded WhatsApp settings");

    console.log("Seeding store settings...");
    await prisma.storeSettings.upsert({
      where: { id: DEFAULT_STORE_SETTINGS.id },
      update: {
        supportEmail: DEFAULT_STORE_SETTINGS.supportEmail,
        supportPhone: DEFAULT_STORE_SETTINGS.supportPhone,
        adminNotificationEmail: DEFAULT_STORE_SETTINGS.adminNotificationEmail,
        contactPhone: DEFAULT_STORE_SETTINGS.contactPhone,
        footerContactPhone: DEFAULT_STORE_SETTINGS.footerContactPhone,
      },
      create: {
        id: DEFAULT_STORE_SETTINGS.id,
        supportEmail: DEFAULT_STORE_SETTINGS.supportEmail,
        supportPhone: DEFAULT_STORE_SETTINGS.supportPhone,
        adminNotificationEmail: DEFAULT_STORE_SETTINGS.adminNotificationEmail,
        contactPhone: DEFAULT_STORE_SETTINGS.contactPhone,
        footerContactPhone: DEFAULT_STORE_SETTINGS.footerContactPhone,
      },
    });
    console.log("Seeded store settings");

    console.log("Seeding shipping rules...");
    for (const rule of DEFAULT_SHIPPING_RULES) {
      const existingRule = await prisma.shippingRule.findFirst({
        where: { name: rule.name },
      });

      if (existingRule) {
        await prisma.shippingRule.update({
          where: { id: existingRule.id },
          data: {
            description: rule.description,
            locationScope: rule.locationScope,
            minOrderAmount: rule.minOrderAmount,
            cost: rule.cost,
            isActive: rule.isActive,
            priority: rule.priority,
          },
        });
      } else {
        await prisma.shippingRule.create({
          data: {
            name: rule.name,
            description: rule.description,
            locationScope: rule.locationScope,
            minOrderAmount: rule.minOrderAmount,
            cost: rule.cost,
            isActive: rule.isActive,
            priority: rule.priority,
          },
        });
      }
      console.log(`Seeded shipping rule: ${rule.name}`);
    }

    const legacyCleanup = await prisma.product.deleteMany({
      where: buildInvalidCatalogProductWhere(mockProducts.map((product) => product.id)),
    });
    console.log(`Removed ${legacyCleanup.count} legacy seeded product(s).`);
    console.log(
      "Skipping legacy mock product seeding. Create products through the admin panel so category mappings stay valid."
    );

    console.log("Seed completed successfully.");
  } catch (error) {
    console.error("Seed failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
