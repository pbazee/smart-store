import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getProductReviews, createProductReview } from "@/lib/reviews-service";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session-user";

const optionalReviewField = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const createReviewSchema = z.object({
  productId: z.string().trim().min(1),
  authorName: z.string().trim().min(2),
  authorCity: optionalReviewField,
  rating: z.number().int().min(1).max(5),
  title: optionalReviewField,
  content: z.string().trim().min(8),
});

async function resolveReviewUserId(sessionUser: Awaited<ReturnType<typeof getSessionUser>>) {
  if (!sessionUser?.email) {
    return sessionUser?.id ?? null;
  }

  const fullName =
    sessionUser.fullName ||
    [sessionUser.firstName, sessionUser.lastName].filter(Boolean).join(" ").trim() ||
    null;

  const persistedUser = await prisma.user.upsert({
    where: { email: sessionUser.email.toLowerCase() },
    update: {
      fullName,
      firstName: sessionUser.firstName ?? undefined,
      lastName: sessionUser.lastName ?? undefined,
    },
    create: {
      email: sessionUser.email.toLowerCase(),
      fullName,
      firstName: sessionUser.firstName ?? null,
      lastName: sessionUser.lastName ?? null,
      role: "CUSTOMER",
    },
    select: { id: true },
  });

  return persistedUser.id;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  const reviews = await getProductReviews(productId);
  return NextResponse.json(
    { success: true, data: reviews },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const reviewData = createReviewSchema.parse(body);
    const resolvedUserId = await resolveReviewUserId(sessionUser);

    const review = await createProductReview({
      ...reviewData,
      userId: resolvedUserId,
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

    console.error("[Reviews] Failed to save review:", error);
    return NextResponse.json({ error: "Failed to save review" }, { status: 500 });
  }
}
