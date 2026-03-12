import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSessionUser } from "@/lib/session-user";
import {
  getWishlistProductIds,
  getWishlistProducts,
  toggleWishlistProduct,
} from "@/lib/wishlist-service";

const toggleWishlistSchema = z.object({
  productId: z.string().min(1),
});

export async function GET() {
  try {
    const user = await requireSessionUser();
    const [productIds, products] = await Promise.all([
      getWishlistProductIds(user.id),
      getWishlistProducts(user.id),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        productIds,
        products,
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireSessionUser();
    const body = await request.json();
    const { productId } = toggleWishlistSchema.parse(body);
    const productIds = await toggleWishlistProduct(user.id, productId);

    return NextResponse.json({
      success: true,
      data: {
        productIds,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid wishlist payload" }, { status: 400 });
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
