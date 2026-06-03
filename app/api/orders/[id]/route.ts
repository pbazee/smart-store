import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId, isAuthenticated } from "@/lib/auth-utils";
import { releaseExpiredReservations } from "@/lib/order-reservations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    await releaseExpiredReservations();

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.userId) {
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const userId = await getCurrentUserId();
      if (order.userId !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const productIds = Array.from(new Set(order.items.map((item) => item.productId).filter(Boolean)));
    const variantIds = Array.from(new Set(order.items.map((item) => item.variantId).filter(Boolean)));
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

    const orderWithImages = {
      ...order,
      items: order.items.map((item) => ({
        ...item,
        imageUrl: (item.variantId ? variantImages.get(item.variantId) : null) || productImages.get(item.productId) || null,
      })),
    };

    return NextResponse.json({
      success: true,
      data: orderWithImages,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}
