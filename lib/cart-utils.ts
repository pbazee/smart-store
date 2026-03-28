import type { CartItem } from "@/types";

export type StoredCartItem = {
  variantId: string;
  quantity: number;
};

function normalizeQuantity(quantity: number, maxQuantity?: number) {
  const parsedQuantity = Number.isFinite(quantity) ? Math.trunc(quantity) : 1;
  const positiveQuantity = Math.max(1, parsedQuantity);

  if (typeof maxQuantity === "number" && maxQuantity > 0) {
    return Math.min(positiveQuantity, maxQuantity);
  }

  return positiveQuantity;
}

function getVariantId(item: CartItem | null | undefined) {
  return typeof item?.variant?.id === "string" ? item.variant.id.trim() : "";
}

function sortStoredCartItems(items: StoredCartItem[]) {
  return [...items].sort((left, right) => left.variantId.localeCompare(right.variantId));
}

export function normalizeStoredCartItems(items: unknown): StoredCartItem[] {
  if (!Array.isArray(items)) {
    return [];
  }

  const mergedItems = new Map<string, number>();

  for (const item of items) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const variantId =
      typeof (item as { variantId?: unknown }).variantId === "string"
        ? (item as { variantId: string }).variantId.trim()
        : "";

    if (!variantId) {
      continue;
    }

    const rawQuantity = (item as { quantity?: unknown }).quantity;
    const parsedQuantity =
      typeof rawQuantity === "number" ? rawQuantity : Number.parseInt(String(rawQuantity ?? "1"), 10);

    mergedItems.set(
      variantId,
      (mergedItems.get(variantId) ?? 0) + normalizeQuantity(parsedQuantity)
    );
  }

  return Array.from(mergedItems.entries()).map(([variantId, quantity]) => ({
    variantId,
    quantity,
  }));
}

export function serializeCartItems(items: CartItem[]): StoredCartItem[] {
  const mergedItems = new Map<string, StoredCartItem>();

  for (const item of items) {
    const variantId = getVariantId(item);
    if (!variantId) {
      continue;
    }

    const existingItem = mergedItems.get(variantId);
    const maxQuantity = item.variant.stock > 0 ? item.variant.stock : undefined;
    const requestedQuantity = normalizeQuantity(item.quantity, maxQuantity);
    const nextQuantity = existingItem
      ? normalizeQuantity(existingItem.quantity + requestedQuantity, maxQuantity)
      : requestedQuantity;

    mergedItems.set(variantId, {
      variantId,
      quantity: nextQuantity,
    });
  }

  return Array.from(mergedItems.values());
}

export function mergeCartItems(...collections: CartItem[][]): CartItem[] {
  const mergedItems = new Map<string, CartItem>();

  for (const collection of collections) {
    for (const item of collection) {
      const variantId = getVariantId(item);
      if (!variantId || !item?.product || !item?.variant) {
        continue;
      }

      const existingItem = mergedItems.get(variantId);
      const maxQuantity =
        item.variant.stock > 0
          ? item.variant.stock
          : existingItem?.variant.stock && existingItem.variant.stock > 0
            ? existingItem.variant.stock
            : undefined;
      const requestedQuantity = normalizeQuantity(item.quantity, maxQuantity);
      const nextQuantity = existingItem
        ? normalizeQuantity(existingItem.quantity + requestedQuantity, maxQuantity)
        : requestedQuantity;

      mergedItems.set(variantId, {
        ...item,
        quantity: nextQuantity,
      });
    }
  }

  return Array.from(mergedItems.values());
}

export function areStoredCartItemsEqual(left: StoredCartItem[], right: StoredCartItem[]) {
  const normalizedLeft = sortStoredCartItems(normalizeStoredCartItems(left));
  const normalizedRight = sortStoredCartItems(normalizeStoredCartItems(right));

  if (normalizedLeft.length !== normalizedRight.length) {
    return false;
  }

  return normalizedLeft.every(
    (item, index) =>
      item.variantId === normalizedRight[index]?.variantId &&
      item.quantity === normalizedRight[index]?.quantity
  );
}

export function areCartItemsEqual(left: CartItem[], right: CartItem[]) {
  return areStoredCartItemsEqual(serializeCartItems(left), serializeCartItems(right));
}
