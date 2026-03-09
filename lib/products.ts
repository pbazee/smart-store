import type { Product } from "@/types";
import productsData from "@/mock/products.json";

export function getAllProducts(): Product[] {
  return productsData as Product[];
}

export function getProductBySlug(slug: string): Product | undefined {
  return (productsData as Product[]).find((p) => p.slug === slug);
}

export function getFeaturedProducts(): Product[] {
  return (productsData as Product[]).filter((p) => p.isFeatured).slice(0, 8);
}

export function getNewArrivals(): Product[] {
  return (productsData as Product[]).filter((p) => p.isNew).slice(0, 8);
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return (productsData as Product[])
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, limit);
}

export function getCategories(): string[] {
  const cats = new Set((productsData as Product[]).map((p) => p.category));
  return Array.from(cats);
}
