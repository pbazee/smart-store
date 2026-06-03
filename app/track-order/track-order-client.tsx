"use client";

import { type FormEvent, useState, useEffect } from "react";
import Image from "next/image";
import { formatKES } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

type TrackedOrder = {
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  customerName: string;
  items: Array<{ name: string; quantity: number; price: number; imageUrl?: string | null }>;
  total: number;
  shippingAddress: string;
  estimatedDelivery: string;
  placedDate?: string;
};

function normalizeOrder(order: Partial<TrackedOrder>): TrackedOrder {
  return {
    orderNumber: order.orderNumber || "Unknown order",
    orderStatus: order.orderStatus || "pending",
    paymentStatus: order.paymentStatus || "pending",
    customerName: order.customerName || "Customer",
    items: Array.isArray(order.items) ? order.items : [],
    total: Number(order.total ?? 0),
    shippingAddress: order.shippingAddress || "Address unavailable",
    estimatedDelivery: order.estimatedDelivery || "To be confirmed",
    placedDate: order.placedDate,
  };
}

function normalizeOrders(value: unknown): TrackedOrder[] {
  const orders = Array.isArray(value) ? value : value ? [value] : [];
  return orders.map((order) => normalizeOrder(order as Partial<TrackedOrder>));
}

export function TrackOrderClient({
  supportPhone,
  supportTel,
  initialOrders = [],
}: {
  supportPhone: string;
  supportTel: string;
  initialOrders?: TrackedOrder[];
}) {
  const [query, setQuery] = useState("");
  const [searchedOrders, setSearchedOrders] = useState<TrackedOrder[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const handleTrack = async (e?: FormEvent, searchQuery?: string) => {
    if (e) e.preventDefault();
    const searchVal = searchQuery || query.trim();
    if (!searchVal) return;
    
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/track-order?q=${encodeURIComponent(searchVal)}`);
      const payload = await response.json();

      if (!response.ok || !payload.data) {
        throw new Error(payload.error || "Order not found. Please check your details.");
      }

      setSearchedOrders(normalizeOrders(payload.data));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Order not found. Please check your details.");
      setSearchedOrders(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q");
      if (q && !searchedOrders) {
        setQuery(q);
        handleTrack(undefined, q);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleOrderExpansion = (orderNumber: string) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderNumber]: !prev[orderNumber]
    }));
  };

  const getStatusColor = (status?: string | null) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "shipped":
      case "out_for_delivery":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "cancelled":
      case "returned":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getStatusSteps = (status?: string | null) => {
    const safeStatus = status || "pending";

    return [
    { name: "Order Placed", completed: true, isCurrent: safeStatus === "pending" },
    { name: "Processing", completed: ["processing", "shipped", "out_for_delivery", "delivered"].includes(safeStatus), isCurrent: safeStatus === "processing" },
    { name: "Shipped", completed: ["shipped", "out_for_delivery", "delivered"].includes(safeStatus), isCurrent: ["shipped", "out_for_delivery"].includes(safeStatus) },
    { name: "Delivered", completed: safeStatus === "delivered", isCurrent: safeStatus === "delivered" },
  ];
  };

  const renderOrderDetails = (order: TrackedOrder) => (
    <div className="space-y-8 mt-6 border-t border-border pt-6">
      <div className="mb-6 flex items-center justify-between overflow-x-auto pb-4">
        {getStatusSteps(order.orderStatus).map((step, index) => (
          <div key={step.name} className="flex items-center">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                step.isCurrent
                  ? "bg-orange-500 text-white"
                  : step.completed
                  ? "bg-brand-500 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step.completed && !step.isCurrent ? "✓" : index + 1}
            </div>
            <span
              className={`ml-2 whitespace-nowrap text-sm font-medium ${
                step.isCurrent ? "text-orange-500" : step.completed ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {step.name}
            </span>
            {index < 3 && (
              <div
                className={`mx-2 sm:mx-4 h-0.5 w-6 sm:w-12 shrink-0 ${
                  step.completed && !step.isCurrent ? "bg-brand-500" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {["shipped", "out_for_delivery"].includes(order.orderStatus) && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950/30">
          <h3 className="mb-2 font-semibold text-orange-900 dark:text-orange-100">
            Out for Delivery
          </h3>
          <p className="text-sm text-orange-800 dark:text-orange-200">
            Estimated delivery: {order.estimatedDelivery}
          </p>
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 text-lg font-semibold">Order Items</h3>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between gap-3 border-b border-border py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {typeof item.imageUrl === "string" && item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.name || "Order item"} fill sizes="48px" className="object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                    <p className="font-medium">{item.name || "Order item"}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity ?? 0}</p>
                  </div>
                  </div>
                  <p className="font-semibold">{formatKES(Number(item.price ?? 0))}</p>
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
    </div>
  );

  const renderOrderCard = (order: TrackedOrder, isSearched: boolean = false) => {
    const isExpanded = isSearched || expandedOrders[order.orderNumber];

    return (
      <div key={order.orderNumber} className="rounded-xl border border-border bg-card p-6 shadow-sm mb-6">
        <div 
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${!isSearched ? 'cursor-pointer select-none' : ''}`}
          onClick={() => !isSearched && toggleOrderExpansion(order.orderNumber)}
        >
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold">Order {order.orderNumber}</h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${getStatusColor(order.orderStatus)}`}
              >
                {(order.orderStatus || "pending").replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {order.placedDate ? new Date(order.placedDate).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' }) : `Placed for ${order.customerName || "Customer"}`}
              {" • "}
              {order.items.reduce((acc, item) => acc + Number(item.quantity ?? 0), 0)} items
              {" • "}
              <span className="font-semibold text-foreground">{formatKES(order.total)}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2 overflow-hidden">
              {order.items.slice(0, 3).map((item, i) => (
                <div key={i} className="inline-block h-10 w-10 relative rounded-full ring-2 ring-background bg-muted overflow-hidden">
                   {typeof item.imageUrl === "string" && item.imageUrl ? <Image src={item.imageUrl} alt={item.name || "Order item"} fill sizes="40px" className="object-cover" /> : null}
                </div>
              ))}
              {order.items.length > 3 && (
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full ring-2 ring-background bg-muted text-xs font-medium text-muted-foreground">
                  +{order.items.length - 3}
                </div>
              )}
            </div>
            {!isSearched && (
              <div className="text-muted-foreground">
                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            )}
          </div>
        </div>

        {isExpanded && renderOrderDetails(order)}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-black">Track Your Order</h1>
        <p className="text-xl text-muted-foreground">
          {initialOrders.length > 0 
            ? "View your recent orders or search for a specific one" 
            : "Enter your order number, email, or phone number to see the latest updates"}
        </p>
      </div>

      {searchedOrders && searchedOrders.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Search Result{searchedOrders.length !== 1 ? 's' : ''}</h2>
            <button
              onClick={() => { setSearchedOrders(null); setQuery(""); }}
              className="text-sm font-medium text-brand-500 hover:text-brand-600"
            >
              Clear Search
            </button>
          </div>
          <div className="space-y-4">
            {searchedOrders.map(order => renderOrderCard(order, true))}
          </div>
          <div className="mt-8 text-center">
            <button
              onClick={() => { setSearchedOrders(null); setQuery(""); }}
              className="text-brand-500 font-semibold hover:text-brand-600 underline underline-offset-4"
            >
              Track Another Order
            </button>
          </div>
        </div>
      )}

      {(!searchedOrders || searchedOrders.length === 0) && initialOrders.length > 0 && (
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Your Recent Orders</h2>
          <div className="space-y-4">
            {normalizeOrders(initialOrders).map(order => renderOrderCard(order))}
          </div>
        </div>
      )}

      {(!searchedOrders || searchedOrders.length === 0) && (
        <div className="mx-auto max-w-md mt-12 bg-muted/30 p-8 rounded-2xl border border-border/50">
          <h2 className="text-xl font-bold mb-4">{initialOrders.length > 0 ? "Track a different order" : "Find an order"}</h2>
          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <label className="sr-only block text-sm font-medium">Order number, email, or phone</label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Enter order number, email, or phone number"
                required
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Searching..." : "Track Order"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
