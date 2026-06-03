"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatKES } from "@/lib/utils";
import { Package, ArrowRight, Calendar } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useToast } from "@/lib/use-toast";

interface OrderItem {
  id: string;
  productName: string;
  productId: string;
  variantId: string | null;
  price: number;
  quantity: number;
  imageUrl?: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  orderStatus: "pending" | "processing" | "shipped" | "out_for_delivery" | "delivered" | "cancelled" | "returned";
  paymentStatus: "unpaid" | "pending" | "paid" | "partially_paid" | "failed" | "refunded";
  items: OrderItem[];
  createdAt: string;
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  out_for_delivery: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  returned: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
};

const fallbackStatusColor = "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";

function formatStatus(status?: string | null) {
  return (status || "pending").replace(/_/g, " ");
}

function normalizeOrders(value: unknown): Order[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((order) => {
    const record = order as Partial<Order>;

    return {
      id: record.id || record.orderNumber || crypto.randomUUID(),
      orderNumber: record.orderNumber || "Unknown order",
      total: Number(record.total ?? 0),
      orderStatus: record.orderStatus || "pending",
      paymentStatus: record.paymentStatus || "pending",
      items: Array.isArray(record.items) ? record.items : [],
      createdAt: record.createdAt || new Date().toISOString(),
    } as Order;
  });
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  
  const cart = useCartStore();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch("/api/orders");
        if (response.ok) {
          const data = await response.json();
          setOrders(normalizeOrders(data.data));
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleReorder = async (order: Order, redirect: boolean = false) => {
    if (reorderingId) return;
    setReorderingId(order.id);
    
    try {
      const response = await fetch("/api/cart/check-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: order.items }),
      });
      
      if (!response.ok) throw new Error("Failed to check stock");
      
      const { data } = await response.json();
      const availableItems = Array.isArray(data?.availableItems) ? data.availableItems : [];
      const outOfStockItems = Array.isArray(data?.outOfStockItems) ? data.outOfStockItems : [];
      
      if (availableItems.length === 0) {
        toast({
          title: "Items Unavailable",
          description: "None of the items in this order are currently in stock.",
          variant: "destructive"
        });
        return;
      }
      
      // Add items to cart
      availableItems.forEach((item: { product: any; variant: any; quantity: number }) => {
        const { product, variant, quantity } = item;
        // Add quantity times (addItem adds 1 at a time)
        for (let i = 0; i < quantity; i++) {
          const result = cart.addItem(product, variant);
          if (result.status === "max-stock") break;
        }
      });
      
      // Show warnings for out of stock items
      if (outOfStockItems.length > 0) {
        const outOfStockNames = outOfStockItems.map((item: any) => item.productName || "an item").join(", ");
        toast({
          title: "Some items out of stock",
          description: `Added available items, but could not add: ${outOfStockNames}`,
          variant: "destructive"
        });
      } else if (!redirect) {
        toast({
          title: "Added to Cart",
          description: `${availableItems.length} items added to your cart successfully.`,
        });
      }
      
      if (redirect) {
        router.push("/checkout");
      } else {
        cart.openCart();
      }
    } catch (error) {
      console.error("Reorder error:", error);
      toast({
        title: "Error",
        description: "An error occurred while reordering. Please try again.",
        variant: "destructive"
      });
    } finally {
      setReorderingId(null);
    }
  };

  const handleTrackOrder = (e: React.MouseEvent, orderNumber: string) => {
    e.preventDefault();
    router.push(`/track-order?q=${encodeURIComponent(orderNumber)}`);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-black mb-8">Your Orders</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h1 className="text-2xl font-bold mb-2">No Orders Yet</h1>
        <p className="text-muted-foreground mb-6">You haven't placed any orders yet.</p>
        <Link
          href="/shop"
          className="inline-block px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg transition-colors"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black mb-2">Your Orders</h1>
      <p className="text-muted-foreground mb-8">
        You have {orders.length} order{orders.length !== 1 ? "s" : ""}
      </p>

      <div className="space-y-6">
        {orders.map((order) => {
          const isReorderable = order.orderStatus === "cancelled" || order.orderStatus === "delivered" || order.paymentStatus === "failed" || order.paymentStatus === "unpaid";          
          return (
            <div key={order.id} className="group border border-border rounded-2xl bg-card hover:border-brand-500 hover:shadow-lg transition-all overflow-hidden flex flex-col sm:flex-row">
              <Link
                href={`/order-confirmation/${order.id}`}
                className="flex-1 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg">{order.orderNumber}</h3>
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        statusColors[order.orderStatus] || fallbackStatusColor
                      }`}
                    >
                      {formatStatus(order.orderStatus)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-3">
                    <Calendar className="w-4 h-4" />
                    {new Date(order.createdAt).toLocaleDateString("en-KE", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  
                  {/* Thumbnails Section */}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex -space-x-2 overflow-hidden">
                      {order.items.slice(0, 4).map((item, i) => (
                        <div key={i} className="inline-block h-12 w-12 relative rounded-xl ring-2 ring-background bg-muted overflow-hidden shrink-0">
                          {typeof item.imageUrl === "string" && item.imageUrl ? (
                            <Image src={item.imageUrl} alt={item.productName || "Order item"} fill sizes="48px" className="object-cover" />
                          ) : (
                            <Package className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-muted-foreground/50" />
                          )}
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-2 ring-background bg-muted text-xs font-bold text-muted-foreground">
                          +{order.items.length - 4}
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-muted-foreground hidden sm:inline-block">
                      {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-4 mt-4 sm:mt-0">
                  <div className="text-left sm:text-right">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="font-black text-lg text-brand-600">{formatKES(order.total)}</p>
                  </div>
                  <ArrowRight className="hidden sm:block w-5 h-5 text-muted-foreground group-hover:text-brand-500 transition-colors flex-shrink-0" />
                </div>
              </Link>
              
              {/* Action Buttons Container */}
              <div className="p-6 pt-0 sm:p-6 sm:border-l border-border bg-muted/20 flex flex-col justify-center gap-3 sm:min-w-[180px]">
                {isReorderable ? (
                  <>
                    <button
                      onClick={() => handleReorder(order, true)}
                      disabled={reorderingId === order.id}
                      className="w-full text-center px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
                    >
                      {reorderingId === order.id ? "Checking..." : "Reorder"}
                    </button>
                    <button
                      onClick={() => handleReorder(order, false)}
                      disabled={reorderingId === order.id}
                      className="w-full text-center px-4 py-2.5 border border-border hover:bg-muted text-foreground text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
                    >
                      Add to Cart
                    </button>
                  </>
                ) : (
                  <Link
                    href={`/track-order?q=${order.orderNumber}`}
                    className="w-full text-center px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold rounded-lg transition-colors"
                  >
                    Track Order
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
