import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSessionUser } from "@/lib/session-user";
import {
  getWishlistProductIds,
  toggleWishlistProduct,
} from "@/lib/wishlist-service";

const WISHLIST_CAP = 50;

const toggleWishlistSchema = z.object({
  productId: z.string().min(1),
});

// GET — returns only product IDs (never full objects) to minimise initial payload
export async function GET() {
  try {
    const user = await requireSessionUser();
    const productIds = await getWishlistProductIds(user.id);

    return NextResponse.json({
      success: true,
      data: { productIds },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// POST — toggle; enforces 50-item cap
export async function POST(request: NextRequest) {
  try {
    const user = await requireSessionUser();
    const body = await request.json();
    const { productId } = toggleWishlistSchema.parse(body);

    // Read current list so we can cap before adding
    const current = await getWishlistProductIds(user.id);
    const isAdding = !current.includes(productId);
    if (isAdding && current.length >= WISHLIST_CAP) {
      return NextResponse.json(
        { error: `Wishlist is capped at ${WISHLIST_CAP} items. Remove some first.` },
        { status: 422 }
      );
    }

    const productIds = await toggleWishlistProduct(user.id, productId);

    return NextResponse.json({
      success: true,
      data: { productIds },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid wishlist payload" }, { status: 400 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
