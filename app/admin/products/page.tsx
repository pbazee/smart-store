import { fetchAdminProducts } from "@/app/admin/products/actions";
import { ProductsManager } from "@/app/admin/products/products-manager";
import { fetchCategoriesAction } from "@/app/admin/categories/actions";

export default async function AdminProductsPage() {
  const products = await fetchAdminProducts();
  const categories = await fetchCategoriesAction();

  return <ProductsManager initialProducts={products} categories={categories} />;
}
