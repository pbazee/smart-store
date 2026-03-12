import type { Product } from "@/types";

type ProductRouteInput = Pick<Product, "id" | "slug"> | string;

export function buildProductHref(productOrSlug: ProductRouteInput) {
  if (typeof productOrSlug === "string") {
    return `/product/${encodeURIComponent(productOrSlug)}`;
  }

  return `/product/${encodeURIComponent(productOrSlug.slug || productOrSlug.id)}`;
}
