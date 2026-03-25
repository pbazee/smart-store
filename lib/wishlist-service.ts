import { prisma } from "@/lib/prisma";
import { buildValidCatalogProductWhere } from "@/lib/product-integrity";
import type { Product } from "@/types";

export async function getWishlistProductIds(userId: string) {
  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    select: { productId: true },
  });
  return items.map((item) => item.productId);
}

export async function getWishlistProducts(userId: string): Promise<Product[]> {
  const ids = await getWishlistProductIds(userId);

  return (await prisma.product.findMany({
    where: buildValidCatalogProductWhere({
      id: { in: ids },
    }),
    include: { variants: true },
  })) as Product[];
}

export async function toggleWishlistProduct(userId: string, productId: string) {
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
