import { redirect } from "next/navigation";
import { CategoriesView } from "@/app/admin/categories/categories-view";
import { fetchCategoriesAction } from "@/app/admin/categories/actions";
import { requireAdminAuth } from "@/lib/auth-utils";

export default async function AdminCategoriesPage() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    redirect("/sign-in?redirect_url=%2Fadmin%2Fcategories");
  }

  const categories = await fetchCategoriesAction();

  return <CategoriesView initialCategories={categories} />;
}
