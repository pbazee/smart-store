import { PrismaClient } from "@prisma/client";
import { DEFAULT_ANNOUNCEMENT_MESSAGE_SEEDS } from "../lib/default-announcements";
import { DEFAULT_BLOG_POST_SEEDS } from "../lib/default-blog-posts";
import { DEFAULT_HOMEPAGE_CATEGORY_SEEDS } from "../lib/default-homepage-categories";
import { DEFAULT_COUPON_SEEDS } from "../lib/default-coupons";
import { DEFAULT_SOCIAL_LINK_SEEDS } from "../lib/default-social-links";
import { DEFAULT_WHATSAPP_SETTINGS } from "../lib/default-whatsapp-settings";
import { mockProducts } from "../lib/mock-data";
import { hashPassword } from "../lib/password";

function resolveDatabaseUrl(rawUrl = process.env.DATABASE_URL) {
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

    console.log("Seeding categories...");
    const categories = [
      { name: "Shoes", slug: "shoes", description: "Footwear for every occasion" },
      { name: "Clothes", slug: "clothes", description: "Fashion and apparel" },
      { name: "Accessories", slug: "accessories", description: "Complete your look" },
    ];

    for (const category of categories) {
      await prisma.category.upsert({
        where: { slug: category.slug },
        update: category,
        create: category,
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
      await prisma.homepageCategory.upsert({
        where: { id: category.id },
        update: category,
        create: category,
      });
      console.log(`Seeded homepage category: ${category.title}`);
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

    console.log("Seeding products...");
    let createdCount = 0;
    for (const product of mockProducts) {
      const createdProduct = await prisma.product.upsert({
        where: { id: product.id },
        update: {
          name: product.name,
          slug: product.slug,
          description: product.description,
          category: product.category,
          subcategory: product.subcategory,
          gender: product.gender,
          tags: product.tags,
          basePrice: product.basePrice,
          images: product.images,
          rating: product.rating || 0,
          reviewCount: product.reviewCount || 0,
          isFeatured: product.isFeatured || false,
          isNew: product.isNew || false,
        },
        create: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          category: product.category,
          subcategory: product.subcategory,
          gender: product.gender,
          tags: product.tags,
          basePrice: product.basePrice,
          images: product.images,
          rating: product.rating || 0,
          reviewCount: product.reviewCount || 0,
          isFeatured: product.isFeatured || false,
          isNew: product.isNew || false,
        },
      });

      await prisma.variant.deleteMany({
        where: {
          productId: createdProduct.id,
          id: { notIn: product.variants.map((variant) => variant.id) },
        },
      });

      for (const variant of product.variants) {
        await prisma.variant.upsert({
          where: { id: variant.id },
          update: {
            color: variant.color,
            colorHex: variant.colorHex,
            size: variant.size,
            stock: variant.stock,
            price: variant.price,
            productId: createdProduct.id,
          },
          create: {
            id: variant.id,
            color: variant.color,
            colorHex: variant.colorHex,
            size: variant.size,
            stock: variant.stock,
            price: variant.price,
            productId: createdProduct.id,
          },
        });
      }

      createdCount++;
      console.log(`Seeded product: ${product.name}`);
    }

    console.log("Seed completed successfully.");
    console.log(`Seeded ${createdCount} products with variants.`);
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
