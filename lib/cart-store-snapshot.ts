import type { CartItem, Product, ProductVariant } from "@/types";

function normalizeNumber(value: number, fallback: number) {
  return Number.isFinite(value) ? Math.trunc(value) : fallback;
}

function clampCartQuantity(quantity: number, stock: number) {
  const normalizedQuantity = Math.max(1, normalizeNumber(quantity, 1));

  if (stock > 0) {
    return Math.min(normalizedQuantity, stock);
  }

  return normalizedQuantity;
}

function createCartVariantSnapshot(variant: ProductVariant): ProductVariant {
  return {
    id: variant.id,
    color: variant.color,
    colorHex: variant.colorHex,
    size: variant.size,
    stock: Math.max(0, normalizeNumber(variant.stock, 0)),
    price: Math.max(0, normalizeNumber(variant.price, 0)),
  };
}

function createCartProductSnapshot(
  product: Product,
  variant: ProductVariant
): Product {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: "",
    category: product.category,
    subcategory: product.subcategory,
    categoryId: product.categoryId ?? null,
    gender: product.gender,
    tags: [],
    basePrice: variant.price || product.basePrice,
    images: product.images.filter(Boolean).slice(0, 1),
    variants: [variant],
    rating: normalizeNumber(product.rating, 0),
    reviewCount: Math.max(0, normalizeNumber(product.reviewCount, 0)),
    isFeatured: Boolean(product.isFeatured),
    isNew: Boolean(product.isNew),
    isPopular: Boolean(product.isPopular),
    isTrending: Boolean(product.isTrending),
    isRecommended: Boolean(product.isRecommended),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export function createCartItemSnapshot(item: CartItem): CartItem {
  const variant = createCartVariantSnapshot(item.variant);

  return {
    product: createCartProductSnapshot(item.product, variant),
    variant,
    quantity: clampCartQuantity(item.quantity, variant.stock),
  };
}

export function createCartItemsSnapshot(items: CartItem[]) {
  return items.map(createCartItemSnapshot);
}
