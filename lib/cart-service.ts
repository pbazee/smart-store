import { prisma } from "@/lib/prisma";
import { createDefaultProductVariant, getProductIdFromDefaultVariantId, isDefaultProductVariantId } from "@/lib/product-stock";
import { normalizeStoredCartItems, type StoredCartItem } from "@/lib/cart-utils";
import type { CartItem, Product, ProductVariant, SessionUser } from "@/types";

function resolveCartOwnerKey(sessionUser: Pick<SessionUser, "id" | "email">) {
  const normalizedEmail = sessionUser.email?.trim().toLowerCase();

  if (normalizedEmail) {
    return normalizedEmail;
  }

  return sessionUser.id;
}

async function hydrateCartItems(items: StoredCartItem[]): Promise<CartItem[]> {
  if (items.length === 0) {
    return [];
  }

  const requestedVariantIds = items
    .map((item) => item.variantId)
    .filter((variantId) => !isDefaultProductVariantId(variantId));
  const defaultProductIds = items
    .map((item) => getProductIdFromDefaultVariantId(item.variantId))
    .filter((productId): productId is string => Boolean(productId));
  const [variants, products] = await Promise.all([
    requestedVariantIds.length
      ? prisma.variant.findMany({
          where: {
            id: {
              in: requestedVariantIds,
            },
          },
          include: {
            product: true,
          },
        })
      : Promise.resolve([]),
    defaultProductIds.length
      ? prisma.product.findMany({
          where: {
            id: {
              in: defaultProductIds,
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const variantsById = new Map(variants.map((variant) => [variant.id, variant]));
  const productsById = new Map(products.map((product) => [product.id, product]));

  return items.flatMap((item) => {
    const defaultProductId = getProductIdFromDefaultVariantId(item.variantId);
    if (defaultProductId) {
      const product = productsById.get(defaultProductId);
      if (!product) {
        return [];
      }

      const variant = createDefaultProductVariant(product as Product);
      return [
        {
          product: product as Product,
          variant,
          quantity: variant.stock > 0 ? Math.min(item.quantity, variant.stock) : item.quantity,
        },
      ];
    }

    const variant = variantsById.get(item.variantId);
    if (!variant) {
      return [];
    }

    return [
      {
        product: variant.product as Product,
        variant: variant as unknown as ProductVariant,
        quantity: variant.stock > 0 ? Math.min(item.quantity, variant.stock) : item.quantity,
      },
    ];
  });
}

export async function getSavedCartItems(sessionUser: SessionUser) {
  const cart = await prisma.cart.findUnique({
    where: {
      ownerKey: resolveCartOwnerKey(sessionUser),
    },
  });

  return hydrateCartItems(normalizeStoredCartItems(cart?.items));
}

export async function saveSavedCartItems(sessionUser: SessionUser, items: StoredCartItem[]) {
  const ownerKey = resolveCartOwnerKey(sessionUser);
  const normalizedItems = normalizeStoredCartItems(items);

  if (normalizedItems.length === 0) {
    await prisma.cart.deleteMany({
      where: {
        ownerKey,
      },
    });

    return [] as CartItem[];
  }

  await prisma.cart.upsert({
    where: {
      ownerKey,
    },
    update: {
      items: normalizedItems,
    },
    create: {
      ownerKey,
      items: normalizedItems,
    },
  });

  return hydrateCartItems(normalizedItems);
}
