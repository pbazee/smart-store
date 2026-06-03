import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId, isAuthenticated } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const orders = await prisma.order.findMany({
      where: { userId },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        orderStatus: true,
        paymentStatus: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            productName: true,
            productId: true,
            variantId: true,
            price: true,
            quantity: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const productIds = Array.from(new Set(orders.flatMap((order) => order.items.map((item) => item.productId)).filter(Boolean)));
    const variantIds = Array.from(new Set(orders.flatMap((order) => order.items.map((item) => item.variantId)).filter(Boolean)));
    const products = productIds.length
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, images: true },
        })
      : [];
    const variants = variantIds.length
      ? await prisma.variant.findMany({
          where: { id: { in: variantIds as string[] } },
          select: { id: true, variantImageUrl: true },
        })
      : [];
    const productImages = new Map(products.map((product) => [product.id, product.images[0] || null]));
    const variantImages = new Map(variants.map((v) => [v.id, v.variantImageUrl || null]));

    const ordersWithImages = orders.map((order) => ({
      ...order,
      items: order.items.map((item) => ({
        ...item,
        imageUrl: (item.variantId ? variantImages.get(item.variantId) : null) || productImages.get(item.productId) || null,
      })),
    }));

    return NextResponse.json({
      success: true,
      data: ordersWithImages,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
