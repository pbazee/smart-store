import type { Product, ProductVariant } from "@/types";

const DEFAULT_PRODUCT_VARIANT_PREFIX = "__product__";

export function createDefaultProductVariantId(productId: string) {
  return `${DEFAULT_PRODUCT_VARIANT_PREFIX}${productId}`;
}

export function isDefaultProductVariantId(variantId?: string | null) {
  return Boolean(variantId?.startsWith(DEFAULT_PRODUCT_VARIANT_PREFIX));
}

export function getProductIdFromDefaultVariantId(variantId?: string | null) {
  if (!variantId || !isDefaultProductVariantId(variantId)) {
    return null;
  }

  return variantId.slice(DEFAULT_PRODUCT_VARIANT_PREFIX.length) || null;
}

export function hasRealVariants(product: Pick<Product, "variants">) {
  return product.variants.length > 0;
}

export function getEffectiveProductStock(product: Pick<Product, "variants">) {
  return product.variants.reduce((sum, variant) => sum + Math.max(0, variant.stock), 0);
}

export function createDefaultProductVariant(product: Pick<Product, "id" | "basePrice">) {
  return {
    id: createDefaultProductVariantId(product.id),
    color: "",
    colorHex: "#000000",
    size: "Single item",
    stock: 999999,
    price: product.basePrice,
    isDefault: true,
  } satisfies ProductVariant;
}

export function getCartVariantForProduct(product: Product) {
  if (hasRealVariants(product)) {
    return product.variants.find((variant) => variant.stock > 0) ?? product.variants[0] ?? null;
  }

  return createDefaultProductVariant(product);
}
