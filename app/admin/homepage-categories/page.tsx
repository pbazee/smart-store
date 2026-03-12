import { redirect } from "next/navigation";
import { HomepageCategoriesManager } from "@/app/admin/homepage-categories/homepage-categories-manager";
import { fetchAdminHomepageCategories } from "@/app/admin/homepage-categories/actions";
import { requireAdminAuth } from "@/lib/auth-utils";

export default async function AdminHomepageCategoriesPage() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    redirect("/login?redirect_url=%2Fadmin%2Fhomepage-categories");
  }

  const categories = await fetchAdminHomepageCategories();

  return <HomepageCategoriesManager initialCategories={categories} />;
}
