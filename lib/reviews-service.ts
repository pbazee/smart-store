import { prisma } from "@/lib/prisma";
import { ensureReviewStorage } from "@/lib/runtime-schema-repair";
import type { ProductReview } from "@/types";

export async function getProductReviews(productId: string) {
  await ensureReviewStorage();

  return await prisma.review.findMany({
    where: { productId, isApproved: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getLatestApprovedReviews(limit: number = 6) {
  await ensureReviewStorage();

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
  await ensureReviewStorage();

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
  await ensureReviewStorage();

  return await prisma.review.update({
    where: { id },
    data,
  });
}

export async function deleteReviewAdmin(id: string) {
  await ensureReviewStorage();

  return await prisma.review.delete({
    where: { id },
  });
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
  await ensureReviewStorage();

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

  return review as ProductReview;
}
