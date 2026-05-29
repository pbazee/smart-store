"use client";

import { type FormEvent, useState } from "react";
import Image from "next/image";
import { formatKES } from "@/lib/utils";

type TrackedOrder = {
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  customerName: string;
  items: Array<{ name: string; quantity: number; price: number; imageUrl?: string | null }>;
  total: number;
  shippingAddress: string;
  estimatedDelivery: string;
};

export function TrackOrderClient({
  supportPhone,
  supportTel,
}: {
  supportPhone: string;
  supportTel: string;
}) {
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTrack = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/track-order?q=${encodeURIComponent(query.trim())}`);
      const payload = (await response.json()) as { data?: TrackedOrder; error?: string };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error || "Order not found. Please check your details.");
      }

      setOrder(payload.data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Order not found. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "shipped":
      case "out_for_delivery":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getStatusSteps = (status: string) => [
    { name: "Order Placed", completed: true },
    { name: "Processing", completed: ["processing", "shipped", "out_for_delivery", "delivered"].includes(status) },
    { name: "Shipped", completed: ["shipped", "out_for_delivery", "delivered"].includes(status) },
    { name: "Delivered", completed: status === "delivered" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-black">Track Your Order</h1>
        <p className="text-xl text-muted-foreground">
          Enter your order number, email, or phone number to see the latest updates
        </p>
      </div>

      {!order ? (
        <div className="mx-auto max-w-md">
          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Order number, email, or phone</label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="SSK-123456, you@email.com, or +254..."
                required
              />
              <p className="mt-1 text-sm text-muted-foreground">
                We detect the search type automatically.
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-500 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Searching..." : "Track Order"}
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Order {order.orderNumber}</h2>
                <p className="text-muted-foreground">Placed for {order.customerName}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(order.orderStatus)}`}
              >
                {order.orderStatus.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())}
              </span>
            </div>

            <div className="mb-6 flex items-center justify-between">
              {getStatusSteps(order.orderStatus).map((step, index) => (
                <div key={step.name} className="flex items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      step.completed
                        ? "bg-brand-500 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step.completed ? "OK" : index + 1}
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      step.completed ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.name}
                  </span>
                  {index < 3 && (
                    <div
                      className={`mx-4 h-0.5 w-12 ${
                        step.completed ? "bg-brand-500" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {["shipped", "out_for_delivery"].includes(order.orderStatus) && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
                <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
                  Out for Delivery
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Estimated delivery: {order.estimatedDelivery}
                </p>
              </div>
            )}
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-lg font-semibold">Order Items</h3>
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between gap-3 border-b border-border py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                          {item.imageUrl ? (
                            <Image src={item.imageUrl} alt="" fill sizes="56px" className="object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      </div>
                      <p className="font-semibold">{formatKES(item.price)}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 font-bold">
                  <span>Total</span>
                  <span>{formatKES(order.total)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-lg font-semibold">Shipping Address</h3>
                <p className="text-muted-foreground">{order.shippingAddress}</p>
              </div>

              <div>
                <h3 className="mb-3 text-lg font-semibold">Need Help?</h3>
                <div className="space-y-2 text-sm">
                  <a href="/contact" className="block text-brand-500 hover:text-brand-600">
                    Contact Customer Service
                  </a>
                  <a href="/returns" className="block text-brand-500 hover:text-brand-600">
                    Return Policy
                  </a>
                  <a href={`tel:${supportTel}`} className="block text-brand-500 hover:text-brand-600">
                    Call {supportPhone}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => setOrder(null)}
              className="font-medium text-brand-500 hover:text-brand-600"
            >
              Track Another Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
