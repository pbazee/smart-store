import { prisma } from "@/lib/prisma";
import { shouldUseMockData } from "@/lib/live-data-mode";
import {
  getDemoProducts,
  getDemoWishlistProductIds,
  toggleDemoWishlist,
} from "@/lib/demo-catalog";
import type { Product } from "@/types";

export async function getWishlistProductIds(userId: string) {
  if (shouldUseMockData()) {
    return getDemoWishlistProductIds(userId);
  }

  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId },
      select: { productId: true },
    });
    return items.map((item) => item.productId);
  } catch (error) {
    console.error("Wishlist lookup failed, falling back to demo store:", error);
    return getDemoWishlistProductIds(userId);
  }
}

export async function getWishlistProducts(userId: string): Promise<Product[]> {
  const ids = await getWishlistProductIds(userId);

  if (shouldUseMockData()) {
    return getDemoProducts().filter((product) => ids.includes(product.id));
  }

  try {
    return (await prisma.product.findMany({
      where: { id: { in: ids } },
      include: { variants: true },
    })) as Product[];
  } catch (error) {
    console.error("Wishlist products lookup failed, falling back to demo store:", error);
    return getDemoProducts().filter((product) => ids.includes(product.id));
  }
}

export async function toggleWishlistProduct(userId: string, productId: string) {
  if (shouldUseMockData()) {
    return toggleDemoWishlist(userId, productId);
  }

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({
      where: { userId_productId: { userId, productId } },
    });
  } else {
    await prisma.wishlistItem.create({
      data: { userId, productId },
    });
  }

  return getWishlistProductIds(userId);
}
