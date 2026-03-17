import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { releaseReservationForReference } from "@/lib/order-reservations";
import { finalizePaystackPayment, verifyPaystackTransaction } from "@/lib/paystack";
import { sendOrderEmailsAfterPayment } from "@/lib/email/order-confirmation";

const confirmPaymentSchema = z.object({
  reference: z.string().trim().min(1),
});

function formatVariantLabel(variant?: { size?: string | null; color?: string | null }) {
  if (!variant) return null;
  const parts = [variant.size, variant.color].filter(Boolean);
  return parts.length ? parts.join(" / ") : null;
}

async function buildOrderSummary(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    return null;
  }

  const variantIds = order.items.map((item) => item.variantId).filter(Boolean) as string[];
  const variants = variantIds.length
    ? await prisma.variant.findMany({ where: { id: { in: variantIds } } })
    : [];
  const variantMap = new Map(variants.map((variant) => [variant.id, variant]));

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    state: "processed" as const,
    userId: order.userId,
    total: order.total,
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    paymentMethod: order.paymentMethod,
    shippingAmount: order.shippingAmount,
    shippingRuleName: order.shippingRuleName,
    address: order.address,
    city: order.city,
    county: (order as any).county ?? null,
    createdAt: order.createdAt,
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      quantity: item.quantity,
      price: item.price,
      variantLabel: item.variantId ? formatVariantLabel(variantMap.get(item.variantId)) : null,
    })),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reference } = confirmPaymentSchema.parse(body);

    const order = await prisma.order.findFirst({
      where: { paystackReference: reference },
      select: {
        id: true,
        orderNumber: true,
        userId: true,
        total: true,
        customerEmail: true,
        customerName: true,
        paymentMethod: true,
        paymentStatus: true,
        paymentVerifiedAt: true,
        status: true,
        shippingAmount: true,
        shippingRuleName: true,
        address: true,
        city: true,
        county: true,
        createdAt: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentStatus === "paid" && order.paymentVerifiedAt) {
      const summary = await buildOrderSummary(order.id);

      return NextResponse.json({
        success: true,
        data: {
          ...(summary ?? {
            orderId: order.id,
            orderNumber: order.orderNumber,
            userId: order.userId,
            total: order.total,
            customerEmail: order.customerEmail,
            customerName: order.customerName,
            paymentMethod: order.paymentMethod,
            shippingAmount: order.shippingAmount,
            shippingRuleName: order.shippingRuleName,
            address: order.address,
            city: order.city,
            county: (order as any).county ?? null,
            createdAt: order.createdAt,
          }),
          state: "duplicate",
        },
      });
    }

    const verification = await verifyPaystackTransaction(reference);
    const paystackStatus = verification.data?.status as string | undefined;
    if (!verification.status || paystackStatus !== "success") {
      if (paystackStatus && ["abandoned", "failed", "reversed"].includes(paystackStatus)) {
        await releaseReservationForReference(reference);
      }

      return NextResponse.json(
        { error: "Payment has not been completed yet" },
        { status: 409 }
      );
    }

    const result = await finalizePaystackPayment({
      reference,
      verifiedAmount: Number(verification.data.amount ?? 0),
      verifiedCurrency: verification.data.currency as string | undefined,
      verifiedEmail: verification.data.customer?.email as string | undefined,
    });

    if (result.state === "missing") {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (result.state === "processed") {
      void sendOrderEmailsAfterPayment({
        orderId: result.orderId,
        origin: req.nextUrl.origin,
      });
    }

    const summary = await buildOrderSummary(result.orderId);

    return NextResponse.json({
      success: true,
      data: {
        ...(summary ?? {
          orderId: result.orderId,
          orderNumber: result.orderNumber,
          userId: result.userId,
          total: result.total,
          customerEmail: result.customerEmail,
          customerName: result.customerName,
          paymentMethod: result.paymentMethod,
        }),
        state: result.state,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    // Log the actual error for debugging
    console.error("Payment confirmation error:", error);

    // Handle Prisma connection errors gracefully
    if (error instanceof Prisma.PrismaClientInitializationError) {
      // In development, provide detailed error message
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json(
          {
            error: "Database connection failed",
            details: "Check your DATABASE_URL and DIRECT_URL environment variables in .env.local",
            debug: error.message,
          },
          { status: 503 }
        );
      }

      // In production, log but show generic message
      console.error("[CRITICAL] Database initialization failed:", {
        timestamp: new Date().toISOString(),
        error: error.message,
      });

      return NextResponse.json(
        {
          error: "Payment confirmation could not connect to the order service. Please try again in a moment.",
        },
        { status: 503 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to confirm payment";
    console.error("Payment confirmation error details:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
