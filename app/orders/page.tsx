"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatKES } from "@/lib/utils";
import { Package, ArrowRight, Calendar } from "lucide-react";

interface OrderItem {
  id: string;
  productName: string;
  productId: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  items: OrderItem[];
  createdAt: string;
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch("/api/orders");
        if (response.ok) {
          const data = await response.json();
          setOrders(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-black mb-8">Your Orders</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
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

      <div className="space-y-4">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/order-confirmation/${order.id}`}
            className="group border border-border rounded-2xl p-6 hover:border-brand-500 hover:shadow-lg transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-lg">{order.orderNumber}</h3>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      statusColors[order.status]
                    }`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {new Date(order.createdAt).toLocaleDateString("en-KE", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="flex items-center justify-between sm:flex-col sm:items-end gap-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-black text-lg text-brand-600">{formatKES(order.total)}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-brand-500 transition-colors flex-shrink-0" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
