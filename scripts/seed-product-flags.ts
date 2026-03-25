/**
 * One-time script: seeds isPopular/isTrending/isRecommended flags on existing
 * products and fixes HomepageCategory links so every CTA goes somewhere useful.
 *
 * Run:  npx tsx scripts/seed-product-flags.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ── 1. Mark the first 6 products as popular ──────────────────────────────
  const allProducts = await prisma.product.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  const total = allProducts.length;
  const popularIds   = allProducts.slice(0, Math.ceil(total * 0.4)).map((p) => p.id);
  const trendingIds  = allProducts.slice(0, Math.ceil(total * 0.35)).map((p) => p.id);
  const recommendedIds = allProducts.slice(0, Math.ceil(total * 0.5)).map((p) => p.id);
  const newIds       = allProducts.slice(-Math.ceil(total * 0.3)).map((p) => p.id);

  await prisma.product.updateMany({
    where: { id: { in: popularIds } },
    data: { isPopular: true },
  });

  await prisma.product.updateMany({
    where: { id: { in: trendingIds } },
    data: { isTrending: true },
  });

  await prisma.product.updateMany({
    where: { id: { in: recommendedIds } },
    data: { isRecommended: true },
  });

  await prisma.product.updateMany({
    where: { id: { in: newIds } },
    data: { isNew: true },
  });

  console.log(`✓ Flagged products — popular:${popularIds.length} trending:${trendingIds.length} recommended:${recommendedIds.length} new:${newIds.length}`);

  // ── 2. Fix HomepageCategory links ────────────────────────────────────────
  //    Map each category title (case-insensitive) → the correct /products URL.
  const linkMap: Record<string, string> = {
    shoes:    "/products?category=Shoes",
    dresses:  "/products?category=Clothes&subcategory=Dresses",
    jeans:    "/products?category=Clothes&subcategory=Jeans",
    trousers: "/products?category=Clothes&subcategory=Trousers",
    jackets:  "/products?category=Clothes&subcategory=Jackets",
    clothes:  "/products?category=Clothes",
    accessories: "/products?category=Accessories",
    men:      "/products?gender=men",
    women:    "/products?gender=women",
    children: "/products?gender=children",
  };

  const homepageCategories = await prisma.homepageCategory.findMany({
    select: { id: true, title: true, link: true },
  });

  for (const cat of homepageCategories) {
    const key = cat.title.trim().toLowerCase();
    const newLink = linkMap[key];
    if (newLink && cat.link !== newLink) {
      await prisma.homepageCategory.update({
        where: { id: cat.id },
        data: { link: newLink },
      });
      console.log(`✓ Updated "${cat.title}" link: ${cat.link} → ${newLink}`);
    }
  }

  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
