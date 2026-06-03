import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    const results = {
      availableItems: [] as any[],
      outOfStockItems: [] as any[],
    };

    // Use a transaction or multiple queries to fetch products and variants
    for (const item of items) {
      const { productId, variantId, quantity, productName } = item;
      
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          variants: true,
        },
      });

      if (!product) {
        results.outOfStockItems.push({ productName, reason: "Product no longer exists" });
        continue;
      }

      // If variantId is provided, find it. Otherwise just use the first variant or fail if none exist
      let variant = null;
      if (variantId) {
        variant = product.variants.find(v => v.id === variantId);
      } else if (product.variants.length > 0) {
        variant = product.variants[0];
      }

      if (!variant) {
        results.outOfStockItems.push({ productName, reason: "Variant not found" });
        continue;
      }

      if (variant.stock < quantity && variant.stock === 0) {
        results.outOfStockItems.push({ productName, reason: "Out of stock" });
        continue;
      }

      // If they asked for 5 but we only have 3, we add 3 to cart
      const availableQuantity = Math.min(quantity, variant.stock);
      
      results.availableItems.push({
        product: {
          ...product,
          gender: product.gender as any,
        },
        variant,
        quantity: availableQuantity,
        originalQuantityRequested: quantity,
      });
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Error checking stock:", error);
    return NextResponse.json({ error: "Failed to check stock" }, { status: 500 });
  }
}
