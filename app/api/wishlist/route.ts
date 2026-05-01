import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSessionUser } from "@/lib/session-user";
import {
  addWishlistProduct,
  getWishlistCount,
  getWishlistProductIds,
  removeWishlistProduct,
} from "@/lib/wishlist-service";

const WISHLIST_CAP = 50;

const toggleWishlistSchema = z.object({
  productId: z.string().min(1),
});

async function readJsonBodySafely(request: NextRequest) {
  const rawBody = await request.text();

  if (!rawBody.trim()) {
    return null;
  }

  return JSON.parse(rawBody) as unknown;
}

// GET — returns only product IDs (never full objects) to minimise initial payload
export async function GET() {
  try {
    const user = await requireSessionUser();
    const productIds = await getWishlistProductIds(user.id);

    return NextResponse.json(
      {
        success: true,
        data: { productIds },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// POST — add only; keep toggle operations fast and avoid reloading the full list.
export async function POST(request: NextRequest) {
  try {
    const user = await requireSessionUser();
    const body = await readJsonBodySafely(request);
    const { productId } = toggleWishlistSchema.parse(body);

    const currentCount = await getWishlistCount(user.id);
    if (currentCount >= WISHLIST_CAP) {
      return NextResponse.json(
        { error: `Wishlist is capped at ${WISHLIST_CAP} items. Remove some first.` },
        { status: 422 }
      );
    }

    await addWishlistProduct(user.id, productId);

    return NextResponse.json({
      success: true,
      data: { productId },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid wishlist payload" }, { status: 400 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireSessionUser();
    const body = await readJsonBodySafely(request);
    const { productId } = toggleWishlistSchema.parse(body);

    await removeWishlistProduct(user.id, productId);

    return NextResponse.json({
      success: true,
      data: { productId },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid wishlist payload" }, { status: 400 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
