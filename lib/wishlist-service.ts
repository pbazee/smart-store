import { prisma, withPrismaRetry } from "@/lib/prisma";
import { buildValidCatalogProductWhere } from "@/lib/product-integrity";
import type { Product } from "@/types";

export async function getWishlistProductIds(userId: string) {
  const items = await withPrismaRetry("getWishlistProductIds", () =>
    prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { productId: true },
    })
  );
  return items.map((item) => item.productId);
}

export async function getWishlistCount(userId: string) {
  return withPrismaRetry("getWishlistCount", () =>
    prisma.wishlistItem.count({
      where: { userId },
    })
  );
}

export async function getWishlistProducts(userId: string): Promise<Product[]> {
  const ids = await getWishlistProductIds(userId);

  return (await withPrismaRetry("getWishlistProducts", () =>
    prisma.product.findMany({
      where: buildValidCatalogProductWhere({
        id: { in: ids },
      }),
      include: { variants: true },
    })
  )) as Product[];
}

export async function addWishlistProduct(userId: string, productId: string) {
  const existing = await withPrismaRetry("addWishlistProduct existing", () =>
    prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } },
    })
  );

  if (existing) {
    return false;
  }

  await withPrismaRetry("addWishlistProduct create", () =>
    prisma.wishlistItem.create({
      data: { userId, productId },
    })
  );

  return true;
}

export async function removeWishlistProduct(userId: string, productId: string) {
  await withPrismaRetry("removeWishlistProduct", () =>
    prisma.wishlistItem.deleteMany({
      where: { userId, productId },
    })
  );
}
