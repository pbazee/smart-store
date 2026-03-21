import { redirect } from "next/navigation";
import { HomepageCategoriesManager } from "@/app/admin/homepage-categories/homepage-categories-manager";
import { fetchAdminHomepageCategories } from "@/app/admin/homepage-categories/actions";
import { fetchCategoriesAction } from "@/app/admin/categories/actions";
import { requireAdminAuth } from "@/lib/auth-utils";

export default async function AdminHomepageCategoriesPage() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    redirect("/sign-in?redirect_url=%2Fadmin%2Fhomepage-categories");
  }

  const [homepageCategories, categories] = await Promise.all([
    fetchAdminHomepageCategories(),
    fetchCategoriesAction(),
  ]);

  return (
    <HomepageCategoriesManager
      initialCategories={homepageCategories}
      topLevelCategories={categories.filter((category) => !category.parentId)}
    />
  );
}
