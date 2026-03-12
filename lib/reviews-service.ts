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
      where: { productId },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Falling back to mock reviews:", error);
    return getDemoReviews(productId);
  }
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
