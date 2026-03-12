"use client";

import { AlertTriangle, Package, ShoppingCart, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Product } from "@/types";
import { formatKES } from "@/lib/utils";

type AdminDashboardStats = {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  lowStockProducts: Product[];
  revenueByMonth: Array<{ month: string; revenue: number }>;
};

export function AdminDashboardView({ stats }: { stats: AdminDashboardStats }) {
  const cards = [
    {
      title: "Total Revenue",
      value: formatKES(stats.totalRevenue),
      sub: "Paid orders collected",
      icon: TrendingUp,
      color: "text-green-400",
      bg: "bg-green-500/10 border-green-500/20",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      sub: "Across all payment states",
      icon: ShoppingCart,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Products",
      value: stats.totalProducts,
      sub: "Currently in catalog",
      icon: Package,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
    },
    {
      title: "Low Stock",
      value: stats.lowStockProducts.length,
      sub: "Variants at 5 or below",
      icon: AlertTriangle,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black mb-1">Dashboard</h1>
        <p className="text-zinc-400 text-sm">Live commerce metrics from products and orders.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className={`p-5 rounded-2xl border ${card.bg}`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-zinc-400">{card.title}</p>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className="text-2xl font-black mb-1">{card.value}</p>
            <p className="text-xs text-zinc-500">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="font-bold mb-4">Revenue (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="month" tick={{ fill: "#71717a", fontSize: 12 }} />
              <YAxis
                tick={{ fill: "#71717a", fontSize: 12 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [formatKES(value), "Revenue"]}
              />
              <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="font-bold mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats.revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="month" tick={{ fill: "#71717a", fontSize: 12 }} />
              <YAxis
                tick={{ fill: "#71717a", fontSize: 12 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [formatKES(value), "Revenue"]}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ fill: "#f97316" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {stats.lowStockProducts.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-amber-400">Low Stock Alerts</h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.lowStockProducts.map((product) => {
              const lowVariants = product.variants.filter((variant) => variant.stock > 0 && variant.stock <= 5);

              return (
                <div key={product.id} className="flex items-center gap-3 bg-zinc-900/50 rounded-xl p-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden relative flex-shrink-0">
                    <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="48px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{product.name}</p>
                    <p className="text-xs text-amber-400">{lowVariants.length} variant(s) low</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
