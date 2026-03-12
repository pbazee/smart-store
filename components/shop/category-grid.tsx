import { unstable_noStore as noStore } from "next/cache";
import { CategoryGridClient } from "@/components/shop/category-grid-client";
import { getActiveHomepageCategories } from "@/lib/homepage-category-service";
import type { HomepageCategory } from "@/types";

export async function CategoryGrid({
  categories: providedCategories,
}: {
  categories?: HomepageCategory[];
}) {
  let categories = providedCategories;

  if (!categories) {
    noStore();
    categories = await getActiveHomepageCategories();
  }

  if (categories.length === 0) {
    return null;
  }

  return <CategoryGridClient categories={categories} />;
}
