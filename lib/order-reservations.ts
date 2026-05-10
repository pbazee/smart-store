import { Prisma } from "@prisma/client";
import { releaseCouponUsage } from "@/lib/coupon-service";
import { prisma } from "@/lib/prisma";

export {
  getReservationExpiryDate,
  isReservationExpired,
  reservationWindowMinutes,
} from "@/lib/reservation-timing";

const RESERVATION_EXPIRED_NOTE = "Stock reservation expired before payment confirmation.";
const PAYMENT_FAILED_NOTE = "Payment failed and reserved stock was released.";

type TransactionClient = Prisma.TransactionClient;
type ReservationTransactionOptions = {
  timeoutMs?: number;
  maxWaitMs?: number;
};

const DEFAULT_TRANSACTION_TIMEOUT_MS = 10_000;
const DEFAULT_TRANSACTION_MAX_WAIT_MS = 5_000;

const reservableOrderSelect = {
  id: true,
  status: true,
  paymentStatus: true,
  notes: true,
  paymentVerifiedAt: true,
  reservationExpiresAt: true,
  stockReservedAt: true,
  stockReleasedAt: true,
  couponCode: true,
  items: {
    select: {
      id: true,
      productId: true,
      variantId: true,
      quantity: true,
    },
  },
} satisfies Prisma.OrderSelect;

type ReservableOrder = Prisma.OrderGetPayload<{
  select: typeof reservableOrderSelect;
}>;

function appendOrderNote(existing: string | null | undefined, note: string) {
  const normalizedExisting = existing ?? "";

  if (!note || normalizedExisting.includes(note)) {
    return normalizedExisting;
  }

  return normalizedExisting ? `${normalizedExisting}\n${note}` : note;
}

export async function releaseOrderReservationInTransaction(
  tx: TransactionClient,
  order: ReservableOrder,
  note: string,
  paymentStatus: "pending" | "failed" = "failed"
) {
  if (order.paymentVerifiedAt || order.stockReleasedAt || !order.stockReservedAt) {
    return false;
  }

  for (const item of order.items) {
    if (!item.variantId) {
      continue;
    }

    await tx.variant.update({
      where: { id: item.variantId },
      data: {
        stock: { increment: item.quantity },
      },
    });
  }

  await tx.order.update({
    where: { id: order.id },
    data: {
      status: "cancelled",
      paymentStatus,
      reservationExpiresAt: null,
      stockReleasedAt: new Date(),
      notes: appendOrderNote(order.notes, note),
    },
  });

  await releaseCouponUsage(tx, order.couponCode);

  return true;
}

export async function releaseExpiredReservationsInTransaction(tx: TransactionClient) {
  const expiredOrders = await tx.order.findMany({
    where: {
      paymentStatus: "pending",
      paymentVerifiedAt: null,
      stockReservedAt: { not: null },
      stockReleasedAt: null,
      reservationExpiresAt: { lt: new Date() },
    },
    select: reservableOrderSelect,
  });

  for (const order of expiredOrders) {
    await releaseOrderReservationInTransaction(tx, order, RESERVATION_EXPIRED_NOTE, "failed");
  }

  return expiredOrders.length;
}

export async function releaseExpiredReservations(
  options: ReservationTransactionOptions = {}
) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TRANSACTION_TIMEOUT_MS;
  const maxWaitMs = options.maxWaitMs ?? Math.min(timeoutMs, DEFAULT_TRANSACTION_MAX_WAIT_MS);

  return prisma.$transaction(
    async (tx) => releaseExpiredReservationsInTransaction(tx),
    {
      timeout: timeoutMs,
      maxWait: maxWaitMs,
    }
  );
}

export async function releaseReservationForReference(reference: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { paystackReference: reference },
      select: reservableOrderSelect,
    });

    if (!order) {
      return false;
    }

    return releaseOrderReservationInTransaction(tx, order, PAYMENT_FAILED_NOTE, "failed");
  });
}
