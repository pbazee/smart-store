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

export function getEffectiveProductStock(product: Pick<Product, "baseStock" | "variants">) {
  if (hasRealVariants(product)) {
    return product.variants.reduce((sum, variant) => sum + Math.max(0, variant.stock), 0);
  }

  return product.baseStock ?? null;
}

export function createDefaultProductVariant(product: Pick<Product, "id" | "basePrice" | "baseStock">) {
  return {
    id: createDefaultProductVariantId(product.id),
    color: "",
    colorHex: "#000000",
    size: "Single item",
    stock: product.baseStock == null ? 999999 : Math.max(0, product.baseStock),
    price: product.basePrice,
    variantImageUrl: null,
    isDefault: true,
  } satisfies ProductVariant;
}

export function getCartVariantForProduct(product: Product) {
  if (hasRealVariants(product)) {
    return product.variants.find((variant) => variant.stock > 0) ?? product.variants[0] ?? null;
  }

  return createDefaultProductVariant(product);
}

export function getBaseStockMessage(baseStock?: number | null) {
  if (baseStock === 0) {
    return "Out of stock";
  }

  if (typeof baseStock === "number" && baseStock > 0 && baseStock <= 5) {
    return `Only ${baseStock} left in stock`;
  }

  return null;
}
