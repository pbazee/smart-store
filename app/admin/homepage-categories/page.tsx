import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { HomepageCategoriesManager } from "@/app/admin/homepage-categories/homepage-categories-manager";
import { fetchAdminHomepageCategories } from "@/app/admin/homepage-categories/actions";
import { fetchCategoriesAction } from "@/app/admin/categories/actions";
import { requireAdminAuth } from "@/lib/auth-utils";
import type { Category, HomepageCategory } from "@/types";

export default async function AdminHomepageCategoriesPage() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    redirect("/sign-in?redirect_url=%2Fadmin%2Fhomepage-categories");
  }

  let homepageCategories: HomepageCategory[] = [];
  let categories: Category[] = [];
  let loadWarning: string | null = null;

  try {
    [homepageCategories, categories] = await Promise.all([
      fetchAdminHomepageCategories(),
      fetchCategoriesAction(),
    ]);
  } catch (error) {
    console.error("[AdminHomepageCategoriesPage] Failed to load page data:", error);
    loadWarning =
      "We could not refresh homepage categories from the database right now. Existing changes are safe, and you can try again in a moment.";
  }

  return (
    <div className="space-y-6">
      {loadWarning ? (
        <div className="flex items-start gap-3 rounded-[1.5rem] border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
          <p>{loadWarning}</p>
        </div>
      ) : null}

      <HomepageCategoriesManager
        initialCategories={homepageCategories}
        topLevelCategories={categories.filter((category) => !category.parentId)}
      />
    </div>
  );
}
