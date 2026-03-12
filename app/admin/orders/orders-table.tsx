"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn, formatKES } from "@/lib/utils";
import type { Order } from "@/types";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  processing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  shipped: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  delivered: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

const PAYMENT_STYLES: Record<string, string> = {
  paid: "bg-green-500/20 text-green-400",
  pending: "bg-yellow-500/20 text-yellow-400",
  failed: "bg-red-500/20 text-red-400",
  refunded: "bg-zinc-500/20 text-zinc-300",
};

export function OrdersTable({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState("all");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const filtered = filter === "all" ? orders : orders.filter((order) => order.status === filter);

  const updateStatus = async (id: string, status: Order["status"]) => {
    const currentOrder = orders.find((order) => order.id === id);
    if (!currentOrder) {
      return;
    }

    setUpdatingOrderId(id);

    try {
      const response = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          paymentStatus: currentOrder.paymentStatus,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { data?: Order; error?: string }
        | null;

      if (!response.ok || !payload?.data) {
        throw new Error(payload?.error || "Failed to update order");
      }

      setOrders((current) =>
        current.map((order) => (order.id === id ? payload.data! : order))
      );
    } catch (error) {
      console.error("Failed to update admin order status", error);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black mb-1">Orders</h1>
        <p className="text-zinc-400 text-sm">{filtered.length} orders</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "processing", "shipped", "delivered", "cancelled"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize",
              filter === status
                ? "bg-brand-500 text-white"
                : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100"
            )}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                {["Order", "Customer", "Items", "Total", "Payment", "Status", "Update Status"].map((heading) => (
                  <th key={heading} className="text-left px-4 py-3.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((order, index) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="px-4 py-4">
                    <p className="font-bold text-sm text-brand-400">{order.orderNumber}</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(order.createdAt).toLocaleDateString("en-KE")}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-sm">{order.customerName}</p>
                    <p className="text-xs text-zinc-500">{order.customerPhone}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-zinc-400">{order.items.length} items</td>
                  <td className="px-4 py-4 font-bold text-sm">{formatKES(order.total)}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${PAYMENT_STYLES[order.paymentStatus]}`}>
                      {order.paymentMethod === "mpesa" ? "M-Pesa" : "Card"} {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold border capitalize", STATUS_STYLES[order.status])}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={order.status}
                      onChange={(event) => void updateStatus(order.id, event.target.value as Order["status"])}
                      disabled={updatingOrderId === order.id}
                      className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-60"
                    >
                      {["pending", "processing", "shipped", "delivered", "cancelled"].map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
