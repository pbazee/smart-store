"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Loader2,
  Mail,
  MapPin,
  NotebookText,
  Package,
  Phone,
  Receipt,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";
import type { AdminOrderDetail } from "@/lib/data-service";
import { useToast } from "@/lib/use-toast";
import { cn, formatKES } from "@/lib/utils";

const STATUS_OPTIONS = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;
const PAYMENT_OPTIONS = ["pending", "paid", "failed", "refunded"] as const;

const STATUS_STYLES: Record<string, string> = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  processing: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  shipped: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  delivered: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  cancelled: "border-rose-500/30 bg-rose-500/10 text-rose-300",
};

const PAYMENT_STYLES: Record<string, string> = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  paid: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  failed: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  refunded: "border-zinc-700 bg-zinc-800/80 text-zinc-200",
};

function formatDateTime(value?: string | Date | null) {
  if (!value) {
    return "Not available";
  }

  return new Date(value).toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function SummaryCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/80 p-5 shadow-xl shadow-black/20">
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">{label}</p>
      <p className="mt-3 text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-sm text-zinc-400">{helper}</p>
    </div>
  );
}

function DetailRow({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 text-sm", className)}>
      <span className="text-zinc-500">{label}</span>
      <span className="text-right font-medium text-zinc-100">{value}</span>
    </div>
  );
}

export function OrderDetailView({ initialOrder }: { initialOrder: AdminOrderDetail }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [order, setOrder] = useState(initialOrder);
  const [status, setStatus] = useState(initialOrder.status);
  const [paymentStatus, setPaymentStatus] = useState(initialOrder.paymentStatus);

  const subtotal =
    typeof order.subtotal === "number" && order.subtotal > 0
      ? order.subtotal
      : order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingAmount = order.shippingAmount ?? 0;
  const discountAmount = order.discountAmount ?? 0;

  const handleSave = () => {
    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch(`/api/admin/orders/${order.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status, paymentStatus }),
          });

          const payload = (await response.json().catch(() => null)) as
            | { data?: AdminOrderDetail; error?: string }
            | null;

          if (!response.ok || !payload?.data) {
            throw new Error(payload?.error || "Failed to update order");
          }

          setOrder(payload.data);
          setStatus(payload.data.status);
          setPaymentStatus(payload.data.paymentStatus);
          toast({
            title: "Order updated",
            description: `Order ${payload.data.orderNumber} has been updated.`,
          });
        } catch (error) {
          toast({
            title: "Update failed",
            description: error instanceof Error ? error.message : "Please try again.",
            variant: "destructive",
          });
        }
      })();
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Link>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-400">
              Order Details
            </p>
            <h1 className="mt-2 text-3xl font-black text-white">{order.orderNumber}</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Full order record with customer, payment, fulfillment, and note history.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={cn(
              "inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]",
              STATUS_STYLES[order.status]
            )}
          >
            {order.status}
          </span>
          <span
            className={cn(
              "inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]",
              PAYMENT_STYLES[order.paymentStatus]
            )}
          >
            {order.paymentStatus}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="Order Total"
          value={formatKES(order.total)}
          helper={`${order.items.length} item${order.items.length === 1 ? "" : "s"} in this order`}
        />
        <SummaryCard
          label="Payment Method"
          value={order.paymentMethod === "mpesa" ? "M-Pesa" : order.paymentMethod.toUpperCase()}
          helper={order.paystackReference ? `Reference ${order.paystackReference}` : "No payment reference attached"}
        />
        <SummaryCard
          label="Created"
          value={new Date(order.createdAt).toLocaleDateString("en-KE", { dateStyle: "medium" })}
          helper={formatDateTime(order.createdAt)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr),minmax(320px,0.85fr)]">
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl shadow-black/25">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-300">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Items</h2>
                <p className="text-sm text-zinc-400">Line items, quantities, and unit pricing.</p>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-zinc-800">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-zinc-950/80 text-left text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Variant</th>
                      <th className="px-4 py-3">Qty</th>
                      <th className="px-4 py-3">Unit</th>
                      <th className="px-4 py-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80">
                    {order.items.map((item) => (
                      <tr key={item.id ?? `${item.productId}-${item.variantId ?? "variant"}`}>
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-semibold text-zinc-100">{item.productName}</p>
                            <p className="text-xs text-zinc-500">{item.productId}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-zinc-300">{item.variantId || "Default"}</td>
                        <td className="px-4 py-4 text-zinc-300">{item.quantity}</td>
                        <td className="px-4 py-4 text-zinc-300">{formatKES(item.price)}</td>
                        <td className="px-4 py-4 text-right font-semibold text-zinc-100">
                          {formatKES(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 space-y-3 rounded-[1.5rem] border border-zinc-800 bg-zinc-950/80 p-5">
              <DetailRow label="Subtotal" value={formatKES(subtotal)} />
              <DetailRow label="Shipping" value={formatKES(shippingAmount)} />
              <DetailRow label="Discount" value={discountAmount > 0 ? `- ${formatKES(discountAmount)}` : formatKES(0)} />
              <DetailRow
                label="Coupon"
                value={order.couponCode || "No coupon used"}
                className="border-b border-zinc-800 pb-3"
              />
              <DetailRow label="Grand total" value={formatKES(order.total)} />
            </div>
          </section>

          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl shadow-black/25">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Payment & Fulfillment</h2>
                <p className="text-sm text-zinc-400">Operational details for this checkout.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 rounded-[1.5rem] border border-zinc-800 bg-zinc-950/80 p-5">
              <DetailRow label="Payment method" value={order.paymentMethod} />
              <DetailRow label="Payment status" value={order.paymentStatus} />
              <DetailRow label="Order status" value={order.status} />
              <DetailRow label="Shipping rule" value={order.shippingRuleName || "Manual / default"} />
              <DetailRow label="Payment verified" value={formatDateTime(order.paymentVerifiedAt)} />
              <DetailRow label="Reserved stock" value={formatDateTime(order.stockReservedAt)} />
              <DetailRow label="Reservation expiry" value={formatDateTime(order.reservationExpiresAt)} />
              <DetailRow label="Stock released" value={formatDateTime(order.stockReleasedAt)} />
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl shadow-black/25">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-300">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Update Status</h2>
                <p className="text-sm text-zinc-400">
                  Change payment and fulfillment state for this order.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <label className="space-y-2 text-sm">
                <span className="font-medium text-zinc-300">Order status</span>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as AdminOrderDetail["status"])}
                  className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm">
                <span className="font-medium text-zinc-300">Payment status</span>
                <select
                  value={paymentStatus}
                  onChange={(event) =>
                    setPaymentStatus(event.target.value as AdminOrderDetail["paymentStatus"])
                  }
                  className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
                >
                  {PAYMENT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isPending ? "Saving..." : "Save changes"}
              </button>
            </div>
          </section>

          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl shadow-black/25">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-300">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Customer</h2>
                <p className="text-sm text-zinc-400">Contact information for delivery and support.</p>
              </div>
            </div>

            <div className="mt-6 space-y-4 rounded-[1.5rem] border border-zinc-800 bg-zinc-950/80 p-5">
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-4 w-4 text-zinc-500" />
                <div>
                  <p className="font-semibold text-zinc-100">{order.customerName}</p>
                  {order.user?.id && (
                    <Link
                      href={`/admin/users/${order.user.id}`}
                      className="text-xs font-semibold text-brand-400 hover:text-brand-300"
                    >
                      Open user profile
                    </Link>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-zinc-500" />
                <p className="text-sm text-zinc-200">{order.customerEmail || "No email provided"}</p>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-zinc-500" />
                <p className="text-sm text-zinc-200">{order.customerPhone || "No phone provided"}</p>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-zinc-500" />
                <div className="text-sm text-zinc-200">
                  <p>{order.address}</p>
                  <p>{[order.city, order.county].filter(Boolean).join(", ")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 text-zinc-500" />
                <p className="text-sm text-zinc-200">{formatDateTime(order.createdAt)}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl shadow-black/25">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
                <NotebookText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Notes</h2>
                <p className="text-sm text-zinc-400">Customer-entered delivery instructions and notes.</p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-zinc-800 bg-zinc-950/80 p-5">
              <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-200">
                {order.notes?.trim() || "No customer notes were added to this order."}
              </p>
            </div>
          </section>

          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl shadow-black/25">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">References</h2>
                <p className="text-sm text-zinc-400">Traceability fields for support and reconciliation.</p>
              </div>
            </div>

            <div className="mt-6 space-y-3 rounded-[1.5rem] border border-zinc-800 bg-zinc-950/80 p-5">
              <DetailRow label="Internal id" value={order.id} />
              <DetailRow label="Order number" value={order.orderNumber} />
              <DetailRow label="Paystack reference" value={order.paystackReference || "Not attached"} />
              <DetailRow label="Updated" value={formatDateTime(order.updatedAt)} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
