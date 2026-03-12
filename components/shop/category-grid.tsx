import { unstable_noStore as noStore } from "next/cache";
import { CategoryGridClient } from "@/components/shop/category-grid-client";
import { getActiveHomepageCategories } from "@/lib/homepage-category-service";

export async function CategoryGrid() {
  noStore();

  const categories = await getActiveHomepageCategories();

  if (categories.length === 0) {
    return null;
  }

  return <CategoryGridClient categories={categories} />;
}
