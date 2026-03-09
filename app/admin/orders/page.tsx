"use client";
import { useState } from "react";
import { mockOrders } from "@/lib/mock-data";
import { formatKES } from "@/lib/utils";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
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
};

export default function AdminOrders() {
  const [orders, setOrders] = useState(mockOrders);
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const updateStatus = (id: string, status: Order["status"]) => {
    setOrders(orders.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black mb-1">Orders</h1>
        <p className="text-zinc-400 text-sm">{filtered.length} orders</p>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "processing", "shipped", "delivered", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize",
              filter === s ? "bg-brand-500 text-white" : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                {["Order", "Customer", "Items", "Total", "Payment", "Status", "Update Status"].map((h) => (
                  <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((order, i) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="px-4 py-4">
                    <p className="font-bold text-sm text-brand-400">{order.orderNumber}</p>
                    <p className="text-xs text-zinc-500">{new Date(order.createdAt).toLocaleDateString("en-KE")}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-sm">{order.customerName}</p>
                    <p className="text-xs text-zinc-500">{order.customerPhone}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-zinc-400">{order.items.length} items</td>
                  <td className="px-4 py-4 font-bold text-sm">{formatKES(order.total)}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${PAYMENT_STYLES[order.paymentStatus]}`}>
                      {order.paymentMethod === "mpesa" ? "📱 " : "💳 "}{order.paymentStatus}
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
                      onChange={(e) => updateStatus(order.id, e.target.value as Order["status"])}
                      className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      {["pending", "processing", "shipped", "delivered", "cancelled"].map((s) => (
                        <option key={s} value={s}>{s}</option>
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
