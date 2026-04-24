import { ProductCard } from "@/components/shop/product-card";
import type { Product } from "@/types";

export function HomepageProductCard({
  product,
  priority = false,
  sizes = "(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw",
}: {
  product: Product;
  priority?: boolean;
  sizes?: string;
}) {
  return <ProductCard product={product} priority={priority} sizes={sizes} />;
}
