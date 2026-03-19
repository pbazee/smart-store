import { prisma } from "@/lib/prisma";
import { shouldUseMockData } from "@/lib/live-data-mode";
import { addDemoReview, getDemoReviews } from "@/lib/demo-catalog";
import type { ProductReview } from "@/types";

export async function getProductReviews(productId: string) {
  if (shouldUseMockData()) {
    return getDemoReviews(productId);
  }

  try {
    return await prisma.review.findMany({
      where: { productId, isApproved: true },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Falling back to mock reviews:", error);
    return getDemoReviews(productId);
  }
}

export async function getLatestApprovedReviews(limit: number = 6) {
  if (shouldUseMockData()) {
    return [];
  }

  try {
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
  } catch (error) {
    console.error("Failed to fetch latest reviews:", error);
    return [];
  }
}

export async function getAllReviewsAdmin() {
  if (shouldUseMockData()) {
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
  if (shouldUseMockData()) {
    return null;
  }

  return await prisma.review.update({
    where: { id },
    data,
  });
}

export async function deleteReviewAdmin(id: string) {
  if (shouldUseMockData()) {
    return null;
  }

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
  if (shouldUseMockData()) {
    return addDemoReview(input.productId, {
      userId: input.userId ?? null,
      authorName: input.authorName,
      authorCity: input.authorCity ?? null,
      rating: input.rating,
      title: input.title ?? null,
      content: input.content,
      verifiedPurchase: input.verifiedPurchase ?? false,
    });
  }

  const review = await prisma.review.create({
    data: {
      productId: input.productId,
      userId: input.userId ?? null,
      authorName: input.authorName,
      authorCity: input.authorCity ?? null,
      rating: input.rating,
      title: input.title ?? null,
      content: input.content,
      verifiedPurchase: input.verifiedPurchase ?? false,
    },
  });

  const aggregate = await prisma.review.aggregate({
    where: { productId: input.productId },
    _avg: { rating: true },
    _count: { id: true },
  });

  await prisma.product.update({
    where: { id: input.productId },
    data: {
      rating: Number((aggregate._avg.rating ?? 0).toFixed(1)),
      reviewCount: aggregate._count.id,
    },
  });

  return review as ProductReview;
}
