import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { releaseReservationForReference } from "@/lib/order-reservations";
import { finalizePaystackPayment, verifyPaystackTransaction } from "@/lib/paystack";

const confirmPaymentSchema = z.object({
  reference: z.string().trim().min(1),
});

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
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentStatus === "paid" && order.paymentVerifiedAt) {
      return NextResponse.json({
        success: true,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          state: "duplicate",
          userId: order.userId,
          total: order.total,
          customerEmail: order.customerEmail,
          customerName: order.customerName,
          paymentMethod: order.paymentMethod,
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

    return NextResponse.json({
      success: true,
      data: {
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        state: result.state,
        userId: result.userId,
        total: result.total,
        customerEmail: result.customerEmail,
        customerName: result.customerName,
        paymentMethod: result.paymentMethod,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        {
          error:
            "Database connection failed. Verify Supabase pooled DATABASE_URL and DIRECT_URL configuration.",
        },
        { status: 503 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to confirm payment";
    console.error("Payment confirmation error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
