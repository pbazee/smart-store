/**
 * Homepage Diagnostic Script
 * Run: npx tsx scripts/diagnose-homepage.ts
 * Uses DATABASE_URL (pgBouncer pooler) — avoids $queryRaw which is incompatible
 * with pgBouncer Transaction Mode.
 */
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Build a lower-pressure pooler URL: 1 connection, short timeout
function buildPoolerUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("connection_limit", "1");
    parsed.searchParams.set("pool_timeout", "20");
    parsed.searchParams.set("connect_timeout", "15");
    return parsed.toString();
  } catch {
    return url;
  }
}

const poolerUrl = buildPoolerUrl();
console.log("[Diagnostic] Using DATABASE_URL pooler:", poolerUrl?.replace(/:([^:@]+)@/, ":***@") ?? "NOT SET");

const prisma = new PrismaClient({
  datasourceUrl: poolerUrl,
  log: ["error", "warn"],
});

async function main() {
  console.log("\n========== HOMEPAGE DIAGNOSTIC ==========\n");

  // 1. DB Connection check
  console.log("1. Testing database connection...");
  try {
    await prisma.blog.findFirst({ select: { id: true } });
    console.log("   ✅ Database connection: OK");
  } catch (e) {
    console.error("   ❌ Database connection FAILED:", e);
    process.exit(1);
  }

  // 2. Table row counts
  console.log("\n2. Checking row counts for all homepage tables...");
  try {
    const [
      productCount,
      heroSlideCount,
      categoryCount,
      homepageCategoryCount,
      blogCount,
      reviewCount,
      announcementCount,
      popupCount,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.heroSlide.count(),
      prisma.category.count(),
      prisma.homepageCategory.count(),
      prisma.blog.count(),
      prisma.review.count(),
      prisma.announcementMessage.count(),
      prisma.popup.count(),
    ]);

    const counts = {
      "Products (total)": productCount,
      "HeroSlides (total)": heroSlideCount,
      "Categories (total)": categoryCount,
      "HomepageCategories (total)": homepageCategoryCount,
      "Blog posts (total)": blogCount,
      "Reviews (total)": reviewCount,
      "Announcements (total)": announcementCount,
      "Popups (total)": popupCount,
    };

    for (const [label, count] of Object.entries(counts)) {
      const icon = count === 0 ? "⚠️ " : "✅";
      console.log(`   ${icon} ${label}: ${count}`);
    }
  } catch (e) {
    console.error("   ❌ Count query failed:", e);
  }

  // 3. Active/filtered counts (what the homepage actually fetches)
  console.log("\n3. Checking ACTIVE/FILTERED data (what homepage fetches)...");
  try {
    const [
      activeHeroSlides,
      activeCategories,
      homepageVisibleCategories,
      activeHomepageCategories,
      publishedBlogs,
      approvedReviews,
      featuredProducts,
      popularProducts,
      trendingProducts,
      newArrivalProducts,
      recommendedProducts,
      productsWithCategoryId,
      productsWithoutCategoryId,
    ] = await Promise.all([
      prisma.heroSlide.count({ where: { isActive: true } }),
      prisma.category.count({ where: { isActive: true } }),
      prisma.category.count({ where: { isActive: true, isHomepageVisible: true } }),
      prisma.homepageCategory.count({ where: { isActive: true } }),
      prisma.blog.count({ where: { isPublished: true } }),
      prisma.review.count({ where: { isApproved: true } }),
      prisma.product.count({ where: { isFeatured: true, categoryId: { not: null } } }),
      prisma.product.count({ where: { isPopular: true, categoryId: { not: null } } }),
      prisma.product.count({ where: { isTrending: true, categoryId: { not: null } } }),
      prisma.product.count({ where: { isNew: true, categoryId: { not: null } } }),
      prisma.product.count({ where: { isRecommended: true, categoryId: { not: null } } }),
      prisma.product.count({ where: { categoryId: { not: null } } }),
      prisma.product.count({ where: { categoryId: null } }),
    ]);

    const filtered = {
      "Active hero slides": activeHeroSlides,
      "Active categories": activeCategories,
      "Homepage-visible categories (isHomepageVisible=true)": homepageVisibleCategories,
      "Active HomepageCategory records": activeHomepageCategories,
      "Published blog posts": publishedBlogs,
      "Approved reviews": approvedReviews,
      "Featured products (with categoryId)": featuredProducts,
      "Popular products (with categoryId)": popularProducts,
      "Trending products (with categoryId)": trendingProducts,
      "New arrival products (with categoryId)": newArrivalProducts,
      "Recommended products (with categoryId)": recommendedProducts,
      "Products WITH categoryId": productsWithCategoryId,
      "Products WITHOUT categoryId (excluded by homepage query!)": productsWithoutCategoryId,
    };

    for (const [label, count] of Object.entries(filtered)) {
      const icon = count === 0 ? "⚠️ " : "✅";
      console.log(`   ${icon} ${label}: ${count}`);
    }
  } catch (e) {
    console.error("   ❌ Filtered count query failed:", e);
  }

  // 4. Sample hero slide
  console.log("\n4. Fetching sample hero slide...");
  try {
    const slide = await prisma.heroSlide.findFirst({ where: { isActive: true } });
    if (slide) {
      console.log("   ✅ Sample hero slide:", { id: slide.id, title: slide.title, isActive: slide.isActive });
    } else {
      console.log("   ⚠️  No active hero slides found — add slides via admin panel");
    }
  } catch (e) {
    console.error("   ❌ Hero slide query failed:", e);
  }

  // 5. Sample category
  console.log("\n5. Fetching sample active category...");
  try {
    const cat = await prisma.category.findFirst({ where: { isActive: true } });
    if (cat) {
      console.log("   ✅ Sample category:", { id: cat.id, name: cat.name, isHomepageVisible: cat.isHomepageVisible });
    } else {
      console.log("   ⚠️  No active categories found — add categories via admin panel");
    }
  } catch (e) {
    console.error("   ❌ Category query failed:", e);
  }

  // 6. Sample popular product
  console.log("\n6. Fetching sample popular product (no categoryId filter)...");
  try {
    const product = await prisma.product.findFirst({ where: { isPopular: true } });
    if (product) {
      console.log("   ✅ Found popular product:", {
        id: product.id,
        name: product.name,
        categoryId: product.categoryId,
        isPopular: product.isPopular,
      });
      if (!product.categoryId) {
        console.log("   ⚠️  PROBLEM: Product has no categoryId — it will be EXCLUDED by the homepage query filter!");
      }
    } else {
      console.log("   ⚠️  No popular products found — mark products as popular via admin panel");
    }
  } catch (e) {
    console.error("   ❌ Product query failed:", e);
  }

  console.log("\n========== DIAGNOSIS COMPLETE ==========\n");
  console.log("SUMMARY OF LIKELY ISSUES:");
  console.log("  - If hero slides count = 0 → add slides via /admin/hero-slides");
  console.log("  - If products without categoryId > 0 → those products are hidden from homepage");
  console.log("  - If isHomepageVisible categories = 0 → no category section shown");
  console.log("  - If popular/trending/featured products (with categoryId) = 0 → product sections are hidden");
  console.log("  - The blog shows even when empty because it has hardcoded fallback seeds\n");
}

main()
  .catch((e) => {
    console.error("Diagnostic script failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
