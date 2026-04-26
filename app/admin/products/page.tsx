import {
  fetchAdminProducts,
  fetchAdminProductCount,
  fetchInvalidAdminProductCount,
} from "@/app/admin/products/actions";
import { ProductsManager } from "@/app/admin/products/products-manager";
import { fetchCategoriesAction } from "@/app/admin/categories/actions";

export default async function AdminProductsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; limit?: string; search?: string }>;
}) {
  const { page = "1", limit = "20", search } = await searchParams;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, parseInt(limit));

  const [products, total, categories, invalidProductCount] = await Promise.all([
    fetchAdminProducts({ 
        skip: (pageNum - 1) * limitNum, 
        take: limitNum,
        search
    }),
    fetchAdminProductCount(search),
    fetchCategoriesAction(),
    fetchInvalidAdminProductCount(),
  ]);

  return (
    <ProductsManager
      initialProducts={products}
      totalProducts={total}
      page={pageNum}
      limit={limitNum}
      search={search}
      categories={categories}
      invalidProductCount={invalidProductCount}
    />
  );
}
