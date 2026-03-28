import { prisma } from "@/lib/prisma";
import { normalizeStoredCartItems, type StoredCartItem } from "@/lib/cart-utils";
import { ensureCartStorage } from "@/lib/runtime-schema-repair";
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

  const variants = await prisma.variant.findMany({
    where: {
      id: {
        in: items.map((item) => item.variantId),
      },
    },
    include: {
      product: true,
    },
  });

  const variantsById = new Map(variants.map((variant) => [variant.id, variant]));

  return items.flatMap((item) => {
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
  await ensureCartStorage();

  const cart = await prisma.cart.findUnique({
    where: {
      ownerKey: resolveCartOwnerKey(sessionUser),
    },
  });

  return hydrateCartItems(normalizeStoredCartItems(cart?.items));
}

export async function saveSavedCartItems(sessionUser: SessionUser, items: StoredCartItem[]) {
  await ensureCartStorage();

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
