import {
  fetchAdminProducts,
  fetchInvalidAdminProductCount,
} from "@/app/admin/products/actions";
import { ProductsManager } from "@/app/admin/products/products-manager";
import { fetchCategoriesAction } from "@/app/admin/categories/actions";

export default async function AdminProductsPage() {
  const [products, categories, invalidProductCount] = await Promise.all([
    fetchAdminProducts(),
    fetchCategoriesAction(),
    fetchInvalidAdminProductCount(),
  ]);

  return (
    <ProductsManager
      initialProducts={products}
      categories={categories}
      invalidProductCount={invalidProductCount}
    />
  );
}
