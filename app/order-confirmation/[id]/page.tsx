"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatKES } from "@/lib/utils";
import { CheckCircle, Package, Truck, MapPin, ArrowRight } from "lucide-react";

interface OrderItem {
  id: string;
  productName: string;
  productId: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  orderStatus:
    | "pending"
    | "processing"
    | "shipped"
    | "out_for_delivery"
    | "delivered"
    | "cancelled"
    | "returned";
  paymentStatus:
    | "unpaid"
    | "pending"
    | "paid"
    | "partially_paid"
    | "failed"
    | "refunded";
  items: OrderItem[];
  address: string;
  city: string;
  createdAt: string;
}

const STATUS_STEPS = [
  { label: "Order Placed", status: "pending", icon: Package },
  { label: "Processing", status: "processing", icon: Package },
  { label: "Shipped", status: "shipped", icon: Truck },
  { label: "Out for Delivery", status: "out_for_delivery", icon: Truck },
  { label: "Delivered", status: "delivered", icon: CheckCircle },
];

function formatStatus(status?: string | null) {
  return (status || "pending").replace(/_/g, " ");
}

function normalizeOrder(value: unknown): Order | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Partial<Order>;

  return {
    id: record.id || "unknown",
    orderNumber: record.orderNumber || "Unknown order",
    customerName: record.customerName || "Customer",
    customerEmail: record.customerEmail || "",
    total: Number(record.total ?? 0),
    orderStatus: record.orderStatus || "pending",
    paymentStatus: record.paymentStatus || "pending",
    items: Array.isArray(record.items) ? record.items : [],
    address: record.address || "Address unavailable",
    city: record.city || "",
    createdAt: record.createdAt || new Date().toISOString(),
  } as Order;
}

function getStatusColor(status: Order["orderStatus"]) {
  switch (status) {
    case "delivered":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "shipped":
    case "out_for_delivery":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "processing":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "cancelled":
    case "returned":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default function OrderConfirmationPage() {
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setOrder(normalizeOrder(data.data));
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      void fetchOrder();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="animate-pulse space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-muted" />
          <div className="mx-auto h-6 w-48 rounded-lg bg-muted" />
          <div className="mx-auto h-4 w-64 rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <p className="mb-4 text-lg font-bold">Order not found</p>
        <Link href="/orders" className="text-brand-500 hover:underline">
          View all orders
        </Link>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex(
    (s) => s.status === order.orderStatus
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      {/* Success header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-2xl font-black sm:text-3xl">
          Order Confirmed! 🎉
        </h1>
        <p className="mt-2 text-muted-foreground">
          Thank you, {order.customerName}. Your order has been placed
          successfully.
        </p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm font-semibold">
          Order #{order.orderNumber}
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${getStatusColor(order.orderStatus)}`}
          >
            {formatStatus(order.orderStatus)}
          </span>
        </div>
      </div>

      {/* Status stepper */}
      {order.orderStatus !== "cancelled" &&
        order.orderStatus !== "returned" && (
          <div className="mb-8 overflow-x-auto">
            <div className="flex min-w-max items-start gap-0">
              {STATUS_STEPS.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const Icon = step.icon;
                return (
                  <div
                    key={step.status}
                    className="flex flex-1 flex-col items-center"
                  >
                    <div className="flex w-full items-center">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          isCompleted
                            ? "border-brand-500 bg-brand-500 text-white"
                            : "border-border bg-muted text-muted-foreground"
                        } ${isCurrent ? "ring-4 ring-brand-500/20" : ""}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      {index < STATUS_STEPS.length - 1 && (
                        <div
                          className={`h-0.5 flex-1 transition-colors ${
                            index < currentStepIndex
                              ? "bg-brand-500"
                              : "bg-border"
                          }`}
                        />
                      )}
                    </div>
                    <p
                      className={`mt-2 w-16 text-center text-[10px] font-semibold leading-tight ${
                        isCurrent ? "text-brand-600" : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* Payment status */}
      {order.paymentStatus === "paid" && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
          <p className="text-sm font-semibold text-green-700 dark:text-green-400">
            ✓ Payment successful
          </p>
          <p className="mt-1 text-xs text-green-600 dark:text-green-500">
            Your payment has been verified and your order is being processed.
          </p>
        </div>
      )}
      {order.paymentStatus === "pending" && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
            ⏳ Payment pending
          </p>
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">
            We&apos;re awaiting confirmation of your payment. Your order will be
            processed once confirmed.
          </p>
        </div>
      )}

      {/* Delivery address */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <MapPin className="h-4 w-4 text-brand-500" />
          Delivery Address
        </div>
        <p className="text-sm text-muted-foreground">
          {order.address}, {order.city}
        </p>
      </div>

      {/* Order items */}
      <div className="mb-6 rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-bold">
            {order.items.length} item{order.items.length !== 1 ? "s" : ""}
          </h2>
        </div>
        <div className="divide-y divide-border">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 px-5 py-4"
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted">
                {typeof item.imageUrl === "string" && item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.productName}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {item.productName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Qty: {item.quantity}
                </p>
              </div>
              <p className="shrink-0 text-sm font-bold">
                {formatKES(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-border px-5 py-4">
          <span className="text-base font-bold">Total</span>
          <span className="text-xl font-black text-brand-600">
            {formatKES(order.total)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Link
          href="/orders"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-600"
        >
          View All Orders <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/shop"
          className="flex w-full items-center justify-center rounded-xl border border-border px-6 py-3 font-semibold text-foreground transition-colors hover:bg-muted"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
