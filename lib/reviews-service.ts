import { shouldSkipLiveDataDuringBuild } from "@/lib/live-data-mode";
import { prisma } from "@/lib/prisma";
import type { ProductReview } from "@/types";

import { unstable_cache } from "next/cache";

export async function getProductReviews(productId: string) {
  if (shouldSkipLiveDataDuringBuild()) {
    return [];
  }

  return unstable_cache(
    async () => {
      return await prisma.review.findMany({
        where: { productId, isApproved: true },
        orderBy: { createdAt: "desc" },
      });
    },
    ["product-reviews", productId],
    {
      revalidate: 3600,
      tags: ["reviews", `product-reviews:${productId}`],
    }
  )();
}

export async function getLatestApprovedReviews(limit: number = 6) {
  if (shouldSkipLiveDataDuringBuild()) {
    return [];
  }


  return await prisma.review.findMany({
    where: { isApproved: true },
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  });
}

export async function getAllReviewsAdmin() {
  if (shouldSkipLiveDataDuringBuild()) {
    return [];
  }


  return await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  });
}

export async function updateReviewAdmin(id: string, data: Partial<{ isApproved: boolean, rating: number, title: string, content: string }>) {
  const updated = await prisma.review.update({
    where: { id },
    data,
  });
  
  const { revalidateTag } = await import("next/cache");
  revalidateTag("reviews");
  revalidateTag("products");
  revalidateTag(`product:${updated.productId}`);
  revalidateTag(`product-reviews:${updated.productId}`);
  return updated;
}

export async function deleteReviewAdmin(id: string) {
  const deleted = await prisma.review.delete({
    where: { id },
  });
  
  const { revalidateTag } = await import("next/cache");
  revalidateTag("reviews");
  revalidateTag("products");
  revalidateTag(`product:${deleted.productId}`);
  revalidateTag(`product-reviews:${deleted.productId}`);
  return deleted;
}

export async function createProductReview(input: {
  productId: string;
  userId?: string | null;
  authorName: string;
  authorCity?: string | null;
  rating: number;
  title?: string | null;
  content: string;
  verifiedPurchase?: boolean;
}) {

  const review = await prisma.$transaction(async (tx) => {
    const createdReview = await tx.review.create({
      data: {
        productId: input.productId,
        userId: input.userId ?? null,
        authorName: input.authorName,
        authorCity: input.authorCity ?? null,
        rating: input.rating,
        title: input.title ?? null,
        content: input.content,
        verifiedPurchase: input.verifiedPurchase ?? false,
        isApproved: true,
      },
    });

    const aggregate = await tx.review.aggregate({
      where: { productId: input.productId },
      _avg: { rating: true },
      _count: { id: true },
    });

    await tx.product.update({
      where: { id: input.productId },
      data: {
        rating: Number((aggregate._avg.rating ?? 0).toFixed(1)),
        reviewCount: aggregate._count.id,
      },
    });

    return createdReview;
  });

  const { revalidateTag } = await import("next/cache");
  revalidateTag("reviews");
  revalidateTag("products");
  revalidateTag(`product:${input.productId}`);
  revalidateTag(`product-reviews:${input.productId}`);

  return review as ProductReview;
}
