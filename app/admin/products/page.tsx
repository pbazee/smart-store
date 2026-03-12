import { fetchAdminProducts } from "@/app/admin/products/actions";
import { ProductsManager } from "@/app/admin/products/products-manager";

export default async function AdminProductsPage() {
  const products = await fetchAdminProducts();

  return <ProductsManager initialProducts={products} />;
}
