import { prisma } from "@/lib/prisma";
import {
  getPaystackVerificationError,
  isDuplicatePaymentVerification,
} from "@/lib/paystack-verification";

const LATE_PAYMENT_NOTE =
  "Payment completed after reservation expiry; stock was re-reserved.";

function appendOrderNote(existing: string | null | undefined, note: string) {
  const normalizedExisting = existing ?? "";

  if (!note || normalizedExisting.includes(note)) {
    return normalizedExisting;
  }

  return normalizedExisting ? `${normalizedExisting}\n${note}` : note;
}

export async function initializePaystackTransaction(input: {
  email: string;
  amountInSubunit: number;
  reference: string;
  callbackUrl: string;
  channels: Array<"mobile_money" | "card">;
  metadata?: Record<string, unknown>;
}) {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack secret key is missing");
  }

  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amountInSubunit,
      currency: "KES",
      reference: input.reference,
      callback_url: input.callbackUrl,
      channels: input.channels,
      metadata: input.metadata,
    }),
  });
  const payload = (await response.json().catch(() => null)) as
    | {
        status?: boolean;
        message?: string;
        data?: {
          authorization_url?: string;
          access_code?: string;
          reference?: string;
        };
      }
    | null;

  if (
    !response.ok ||
    !payload?.status ||
    !payload.data?.authorization_url ||
    !payload.data.access_code
  ) {
    throw new Error(payload?.message || `Paystack API error: ${response.statusText}`);
  }

  return {
    authorizationUrl: payload.data.authorization_url,
    accessCode: payload.data.access_code,
    reference: payload.data.reference ?? input.reference,
  };
}

export async function verifyPaystackTransaction(reference: string) {
  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Paystack verification failed: ${response.statusText}`);
  }

  return response.json();
}

export async function finalizePaystackPayment(input: {
  reference: string;
  verifiedAmount: number;
  verifiedCurrency?: string;
  verifiedEmail?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { paystackReference: input.reference },
      include: { items: true },
    });

    if (!order) {
      return { state: "missing" as const };
    }

    if (isDuplicatePaymentVerification(order.paymentVerifiedAt)) {
      return {
        state: "duplicate" as const,
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
        total: order.total,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        paymentMethod: order.paymentMethod,
      };
    }

    const verificationError = getPaystackVerificationError({
      orderTotal: order.total,
      customerEmail: order.customerEmail,
      verifiedAmount: input.verifiedAmount,
      verifiedCurrency: input.verifiedCurrency,
      verifiedEmail: input.verifiedEmail,
    });

    if (verificationError) {
      throw new Error(verificationError);
    }

    if (order.stockReleasedAt) {
      for (const item of order.items) {
        if (!item.variantId) {
          continue;
        }

        const reserved = await tx.variant.updateMany({
          where: {
            id: item.variantId,
            productId: item.productId,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        if (reserved.count === 0) {
          throw new Error("Reservation expired and inventory is no longer available");
        }
      }
    }

    const now = new Date();
    await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "paid",
        status: "processing",
        paymentVerifiedAt: now,
        reservationExpiresAt: null,
        stockReservedAt: order.stockReservedAt ?? now,
        stockReleasedAt: null,
        notes: order.stockReleasedAt
          ? appendOrderNote(order.notes, LATE_PAYMENT_NOTE)
          : order.notes,
      },
    });

    return {
      state: "processed" as const,
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      total: order.total,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      paymentMethod: order.paymentMethod,
    };
  });
}
