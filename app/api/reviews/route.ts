import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getProductReviews, createProductReview } from "@/lib/reviews-service";
import { getSessionUser } from "@/lib/session-user";

const createReviewSchema = z.object({
  productId: z.string().min(1),
  authorName: z.string().min(2),
  authorCity: z.string().min(2).optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(2).optional(),
  content: z.string().min(8),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  const reviews = await getProductReviews(productId);
  return NextResponse.json({ success: true, data: reviews });
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const reviewData = createReviewSchema.parse(body);

    const review = await createProductReview({
      ...reviewData,
      userId: sessionUser.id,
      authorName: reviewData.authorName || sessionUser.fullName || "Smartest Customer",
      authorCity: reviewData.authorCity ?? "Nairobi",
      verifiedPurchase: true,
    });

    return NextResponse.json({ success: true, data: review }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors[0]?.message || "Invalid review payload";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to save review" }, { status: 500 });
  }
}
