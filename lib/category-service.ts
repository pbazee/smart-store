import { shouldUseMockData } from "@/lib/live-data-mode";
import { prisma } from "@/lib/prisma";
import type { Category } from "@/types";

const FALLBACK_CATEGORIES: Category[] = [
  // Top-level categories
  { id: "shoes", name: "Shoes", slug: "shoes", description: "Footwear for every occasion", parentId: null, order: 1, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "clothes", name: "Clothes", slug: "clothes", description: "Kenyan fashion staples", parentId: null, order: 2, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "accessories", name: "Accessories", slug: "accessories", description: "Bags, belts, and finishing touches", parentId: null, order: 3, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  // Shoes subcategories
  { id: "sneakers", name: "Sneakers", slug: "sneakers", parentId: "shoes", order: 1, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "boots", name: "Boots", slug: "boots", parentId: "shoes", order: 2, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "sandals", name: "Sandals", slug: "sandals", parentId: "shoes", order: 3, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "heels", name: "Heels", slug: "heels", parentId: "shoes", order: 4, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "loafers", name: "Loafers", slug: "loafers", parentId: "shoes", order: 5, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  // Clothes subcategories
  { id: "jeans", name: "Jeans", slug: "jeans", parentId: "clothes", order: 1, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "dresses", name: "Dresses", slug: "dresses", parentId: "clothes", order: 2, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "jackets", name: "Jackets", slug: "jackets", parentId: "clothes", order: 3, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "t-shirts", name: "T-Shirts", slug: "t-shirts", parentId: "clothes", order: 4, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "tops", name: "Tops", slug: "tops", parentId: "clothes", order: 5, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "shorts", name: "Shorts", slug: "shorts", parentId: "clothes", order: 6, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "suits", name: "Suits", slug: "suits", parentId: "clothes", order: 7, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "skirts", name: "Skirts", slug: "skirts", parentId: "clothes", order: 8, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  // Accessories subcategories
  { id: "bags", name: "Bags", slug: "bags", parentId: "accessories", order: 1, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "belts", name: "Belts", slug: "belts", parentId: "accessories", order: 2, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "watches", name: "Watches", slug: "watches", parentId: "accessories", order: 3, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "caps", name: "Caps", slug: "caps", parentId: "accessories", order: 4, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "jewellery", name: "Jewellery", slug: "jewellery", parentId: "accessories", order: 5, isActive: true, createdAt: new Date(), updatedAt: new Date() },
];

export async function getActiveCategories(): Promise<Category[]> {
  if (shouldUseMockData()) {
    console.log("[Categories] Using fallback categories (mock mode)");
    return FALLBACK_CATEGORIES;
  }

  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ parentId: "asc" }, { order: "asc" }, { name: "asc" }],
    });

    console.log(`[Categories] Loaded ${categories.length} active categories from database`);
    return categories as unknown as Category[];
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Categories] Query failed:", errorMsg, {
      dbUrl: process.env.DATABASE_URL ? "set" : "NOT SET",
    });
    console.warn("[Categories] Falling back to default categories");
    return FALLBACK_CATEGORIES;
  }
}
