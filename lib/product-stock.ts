import type { Product, ProductVariant } from "@/types";

const DEFAULT_PRODUCT_VARIANT_PREFIX = "__product__";
const HIDDEN_DEFAULT_COLOR = "Default";
const HIDDEN_DEFAULT_SIZE = "One Size";

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
  if (product.variants.length === 0) {
    return false;
  }

  if (product.variants.length === 1) {
    const [variant] = product.variants;
    return !isHiddenDefaultVariant(variant);
  }

  return true;
}

export function getEffectiveProductStock(product: Pick<Product, "variants">) {
  return product.variants.reduce((sum, variant) => sum + Math.max(0, variant.stock), 0);
}

export function createDefaultProductVariant(product: Pick<Product, "id" | "basePrice">) {
  const defaultBackedVariant =
    "variants" in product && Array.isArray(product.variants)
      ? product.variants.find((variant) => isHiddenDefaultVariant(variant))
      : null;

  return {
    id: defaultBackedVariant?.id ?? createDefaultProductVariantId(product.id),
    color: defaultBackedVariant?.color ?? HIDDEN_DEFAULT_COLOR,
    colorHex: defaultBackedVariant?.colorHex ?? "#000000",
    size: defaultBackedVariant?.size ?? HIDDEN_DEFAULT_SIZE,
    stock: defaultBackedVariant?.stock ?? 999999,
    price: defaultBackedVariant?.price ?? product.basePrice,
    isDefault: true,
  } satisfies ProductVariant;
}

export function isHiddenDefaultVariant(
  variant: Pick<ProductVariant, "color" | "size"> | null | undefined
) {
  return (
    variant?.color.trim().toLowerCase() === HIDDEN_DEFAULT_COLOR.toLowerCase() &&
    variant?.size.trim().toLowerCase() === HIDDEN_DEFAULT_SIZE.toLowerCase()
  );
}

export function getCartVariantForProduct(product: Product) {
  if (hasRealVariants(product)) {
    return product.variants.find((variant) => variant.stock > 0) ?? product.variants[0] ?? null;
  }

  return createDefaultProductVariant(product);
}
