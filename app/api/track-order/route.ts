import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function detectSearchMethod(query: string) {
  const value = query.trim();

  if (value.includes("@")) {
    return { customerEmail: { equals: value.toLowerCase(), mode: "insensitive" as const } };
  }

  if (/^\+?\d[\d\s()-]+$/.test(value)) {
    const digits = value.replace(/[^\d+]/g, "");
    return { customerPhone: { contains: digits.replace(/^\+/, ""), mode: "insensitive" as const } };
  }

  return { orderNumber: { equals: value.toUpperCase(), mode: "insensitive" as const } };
}

function buildDeliveryEstimate(createdAt: Date, estimatedDays?: number | null) {
  const date = new Date(createdAt);
  date.setDate(date.getDate() + Math.max(1, estimatedDays ?? 3));
  return date.toLocaleDateString("en-KE", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < 3) {
    return NextResponse.json({ error: "Enter an order number, email, or phone number." }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: detectSearchMethod(query),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      orderStatus: true,
      paymentStatus: true,
      total: true,
      address: true,
      city: true,
      county: true,
      createdAt: true,
      shippingRule: {
        select: {
          estimatedDays: true,
        },
      },
      items: {
        select: {
          productId: true,
          productName: true,
          price: true,
          quantity: true,
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found. Check the details and try again." }, { status: 404 });
  }

  const productIds = Array.from(new Set(order.items.map((item) => item.productId).filter(Boolean)));
  const products = productIds.length
    ? await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, images: true },
      })
    : [];
  const productImages = new Map(products.map((product) => [product.id, product.images[0] || null]));

  return NextResponse.json({
    data: {
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      customerName: order.customerName,
      total: order.total,
      shippingAddress: [order.address, order.city, order.county].filter(Boolean).join(", "),
      estimatedDelivery: buildDeliveryEstimate(order.createdAt, order.shippingRule?.estimatedDays),
      items: order.items.map((item) => ({
        name: item.productName,
        quantity: item.quantity,
        price: item.price,
        imageUrl: productImages.get(item.productId) ?? null,
      })),
    },
  });
}
