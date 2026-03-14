import { unstable_noStore as noStore } from "next/cache";
import { CategoryGridClient } from "@/components/shop/category-grid-client";
import { getActiveCategories } from "@/lib/category-service";
import type { Category } from "@/types";

export async function CategoryGrid({
  categories: providedCategories,
}: {
  categories?: Category[];
}) {
  let categories = providedCategories;

  if (!categories) {
    noStore();
    categories = await getActiveCategories();
  }

  if (categories.length === 0) {
    return null;
  }

  return <CategoryGridClient categories={categories} />;
}
