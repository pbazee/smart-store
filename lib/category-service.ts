import { shouldUseMockData } from "@/lib/live-data-mode";
import { prisma } from "@/lib/prisma";
import type { Category } from "@/types";

const FALLBACK_CATEGORIES: Category[] = [
  {
    id: "shoes",
    name: "Shoes",
    slug: "shoes",
    description: "Footwear for every occasion",
    parentId: null,
    order: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "clothes",
    name: "Clothes",
    slug: "clothes",
    description: "Kenyan fashion staples",
    parentId: null,
    order: 2,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
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
