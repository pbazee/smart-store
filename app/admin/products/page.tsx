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

  const [productsResult, totalResult, categoriesResult, invalidCountResult] = await Promise.allSettled([
    fetchAdminProducts({ 
        skip: (pageNum - 1) * limitNum, 
        take: limitNum,
        search
    }),
    fetchAdminProductCount(search),
    fetchCategoriesAction(),
    fetchInvalidAdminProductCount(),
  ]);

  if (productsResult.status === "rejected") {
    console.error("[AdminProductsPage] Failed to load products:", productsResult.reason);
  }
  if (totalResult.status === "rejected") {
    console.error("[AdminProductsPage] Failed to load product count:", totalResult.reason);
  }
  if (categoriesResult.status === "rejected") {
    console.error("[AdminProductsPage] Failed to load categories:", categoriesResult.reason);
  }
  if (invalidCountResult.status === "rejected") {
    console.error("[AdminProductsPage] Failed to load invalid product count:", invalidCountResult.reason);
  }

  const products = productsResult.status === "fulfilled" ? productsResult.value : [];
  const total = totalResult.status === "fulfilled" ? totalResult.value : 0;
  const categories = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
  const invalidProductCount =
    invalidCountResult.status === "fulfilled" ? invalidCountResult.value : 0;

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
