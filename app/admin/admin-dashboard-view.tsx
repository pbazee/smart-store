"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  Mail,
  MapPin,
  Package,
  Plus,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Product } from "@/types";
import { formatKES } from "@/lib/utils";
import useSWR from "swr";

type AdminDashboardStats = {
  totalRevenue: number;
  revenueTrend: number;
  totalOrders: number;
  totalProducts: number;
  lowStockProducts: Product[];
  revenueByMonth: Array<{ month: string; revenue: number; orderCount: number }>;
  recentOrders: any[];
  topProducts: any[];
  todayOrders: number;
  pendingOrdersCount: number;
  needsAttentionCount: number;
  lastUpdated: string;
};

type AdminDashboardStatsResponse = {
  data: AdminDashboardStats;
};

const fetcher = async (url: string): Promise<AdminDashboardStatsResponse> => fetch(url).then((res) => res.json());

function CountUp({ value, duration = 800 }: { value: number | string, duration?: number }) {
  const [count, setCount] = useState(0);
  const target = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.]/g, ""));

  useEffect(() => {
    let start = 0;
    const end = target;
    if (start === end) {
        setCount(end);
        return;
    }
    
    let totalFrames = Math.round(duration / 16);
    let frame = 0;
    
    const timer = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const current = end * progress;
      
      if (frame === totalFrames) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [target, duration]);

  if (typeof value === "string" && value.includes("Ksh")) {
      return <span>Ksh {Math.round(count).toLocaleString()}</span>;
  }
  return <span>{Math.round(count).toLocaleString()}</span>;
}

const MemoizedOrderRow = React.memo(({ order }: { order: any }) => {
    const initials = order.customerName ? order.customerName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '??';
    
    const successStatuses = ["shipped", "delivered"];
    const statusColor = successStatuses.includes(order.status)
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      : order.status === "pending" || order.status === "processing"
        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
        : "bg-red-500/10 text-red-400 border-red-500/20";

    return (
        <tr className="group border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
            <td className="py-4 pr-4">
                <Link href={`/admin/orders/${order.orderNumber}`} className="font-bold text-white group-hover:text-orange-400 transition-colors">
                    #{order.orderNumber}
                </Link>
            </td>
            <td className="py-4 pr-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-black text-zinc-400 border border-zinc-700">
                        {initials}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{order.customerName || "Member"}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{order.customerEmail}</p>
                    </div>
                </div>
            </td>
            <td className="py-4 pr-4 text-sm font-black text-orange-400">
                {formatKES(order.total)}
            </td>
            <td className="py-4 pr-4">
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${statusColor}`}>
                    {order.status}
                </span>
            </td>
            <td className="py-4 text-zinc-500 text-xs">
                {new Date(order.createdAt).toLocaleDateString("en-KE", { month: "short", day: "numeric" })}
            </td>
        </tr>
    );
});

MemoizedOrderRow.displayName = "MemoizedOrderRow";

export function AdminDashboardView({ stats: initialStats }: { stats: AdminDashboardStats }) {
  const { data } = useSWR<AdminDashboardStatsResponse>("/api/admin/stats", fetcher, {
      fallbackData: { data: initialStats },
      refreshInterval: 60000,
      revalidateOnFocus: false,
      dedupingInterval: 30000,
  });
  const stats: AdminDashboardStats = data?.data ?? initialStats;

  const [dateRange, setDateRange] = useState("Last 6 months");

  const orderTrendData = useMemo(
    () =>
      stats.revenueByMonth.map((month) => ({
        month: month.month,
        orderCount: month.orderCount,
      })),
    [stats.revenueByMonth]
  );

  const topProductsChartData = useMemo(
    () =>
      stats.topProducts.map((product: any) => ({
        name: product.name?.length > 14 ? `${product.name.slice(0, 14)}…` : product.name,
        unitsSold: product.unitsSold,
      })),
    [stats.topProducts]
  );

  const cards = [
    {
      title: "Total Revenue",
      value: formatKES(stats.totalRevenue),
      trend: stats.revenueTrend,
      icon: TrendingUp,
      color: "bg-emerald-500/20 text-emerald-400",
      chartData: stats.revenueByMonth.map(m => ({ v: m.revenue }))
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      trend: 12, // Mock trend for now
      icon: ShoppingCart,
      color: "bg-blue-500/20 text-blue-400",
      chartData: stats.revenueByMonth.map(m => ({ v: m.orderCount }))
    },
    {
      title: "Products",
      value: stats.totalProducts,
      trend: 2,
      icon: Package,
      color: "bg-purple-500/20 text-purple-400",
      chartData: [ {v:10}, {v:12}, {v:15}, {v:14}, {v:18}, {v:20} ]
    },
    {
      title: "Low Stock",
      value: stats.lowStockProducts.length,
      trend: -5,
      icon: AlertTriangle,
      color: "bg-orange-500/20 text-orange-400",
      chartData: [ {v:20}, {v:18}, {v:15}, {v:12}, {v:10}, {v:stats.lowStockProducts.length} ]
    },
  ];

  const quickActions = [
      { label: "Add Product", icon: Plus, href: "/admin/products?action=add" },
      { label: "View Orders", icon: ShoppingCart, href: "/admin/orders" },
      { label: "Send Announcement", icon: Mail, href: "/admin/announcements" },
      { label: "Manage Shipping", icon: MapPin, href: "/admin/shipping-rules" },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white">Console</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Performance overview and operational intelligence.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2">
            <Clock className="h-4 w-4 text-zinc-500" />
            <span className="text-xs font-semibold text-zinc-400">
                Last updated: {new Date(stats.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-900/40 p-6 shadow-xl transition-all hover:border-orange-500/50 hover:shadow-orange-500/10"
          >
            <div className="flex items-center justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <div className="h-10 w-20 opacity-40 group-hover:opacity-100 transition-opacity">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={card.chartData}>
                          <Area 
                            type="monotone" 
                            dataKey="v" 
                            stroke={card.title === "Low Stock" ? "#f97316" : "#4ade80"} 
                            fill={card.title === "Low Stock" ? "#f9731633" : "#4ade8033"} 
                            strokeWidth={2}
                            isAnimationActive={false}
                          />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
            </div>
            
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">{card.title}</p>
              <h2 className="mt-1 text-3xl font-black text-white">
                  <CountUp value={card.value} />
              </h2>
            </div>

            <div className="mt-4 flex items-center gap-2">
                {card.trend > 0 ? (
                    <div className="flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                        <TrendingUp className="h-3 w-3" />
                        {card.trend}%
                    </div>
                ) : (
                    <div className="flex items-center gap-1 text-[10px] font-black text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">
                        <TrendingUp className="h-3 w-3 rotate-180" />
                        {Math.abs(card.trend)}%
                    </div>
                )}
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">vs last month</span>
            </div>
            
            <div className="absolute -bottom-1 -right-1 h-32 w-32 bg-orange-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full pointer-events-none" />
          </motion.div>
        ))}
      </div>

      {/* Quick Actions & At a Glance */}
      <div className="grid gap-8 lg:grid-cols-[1fr,340px]">
          <div className="space-y-6">
              <div className="flex flex-col gap-4">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500">Quick Actions</h3>
                  <div className="flex flex-wrap gap-3">
                      {quickActions.map((action) => (
                          <Link 
                            key={action.label} 
                            href={action.href}
                            className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-5 py-3 text-xs font-black text-zinc-200 hover:border-orange-500/50 hover:bg-orange-500/10 hover:text-orange-400 transition-all"
                          >
                              <action.icon className="h-4 w-4" />
                              {action.label}
                          </Link>
                      ))}
                  </div>
              </div>

              {/* Chart Section */}
              <div className="rounded-[2.5rem] border border-zinc-800 bg-zinc-900/40 p-8 shadow-2xl">
                  <div className="mb-8 flex items-center justify-between">
                      <div>
                          <h3 className="text-xl font-black text-white">Revenue Intelligence</h3>
                          <p className="text-sm text-zinc-500">Combined revenue and order volume analysis</p>
                      </div>
                      <select 
                        value={dateRange} 
                        onChange={(e) => setDateRange(e.target.value)}
                        className="rounded-full border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-bold text-zinc-300 outline-none focus:ring-2 focus:ring-orange-500/20"
                      >
                          <option>Last 7 days</option>
                          <option>Last 30 days</option>
                          <option>Last 6 months</option>
                      </select>
                  </div>
                  
                  <div className="h-[320px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={stats.revenueByMonth}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis 
                            dataKey="month" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#71717a", fontSize: 11, fontWeight: 700 }} 
                            dy={10}
                          />
                          <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#71717a", fontSize: 11, fontWeight: 700 }}
                            tickFormatter={(value) => `Ksh${(value / 1000).toFixed(0)}k`}
                          />
                          <Tooltip 
                            cursor={{ fill: '#ffffff08' }}
                            contentStyle={{ 
                                background: "#09090b", 
                                border: "1px solid #27272a", 
                                borderRadius: "1.5rem",
                                padding: "12px 16px",
                                boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
                            }}
                            itemStyle={{ fontWeight: 800, fontSize: "12px" }}
                            labelStyle={{ color: "#71717a", marginBottom: "4px", fontSize: "10px", fontWeight: 800, textTransform: "uppercase" }}
                            formatter={(value: number, name: string) => [
                                name === "revenue" ? formatKES(value) : value, 
                                name.charAt(0).toUpperCase() + name.slice(1)
                            ]}
                          />
                          <Bar 
                            dataKey="revenue" 
                            name="revenue" 
                            fill="#f97316" 
                            radius={[8, 8, 0, 0]} 
                            barSize={40}
                            isAnimationActive={false}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="orderCount" 
                            name="orders" 
                            stroke="#ffffff" 
                            strokeWidth={3} 
                            dot={{ fill: "#ffffff", strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, fill: "#f97316" }}
                            isAnimationActive={false}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                  <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900/40 p-6">
                      <div className="mb-6">
                          <h3 className="text-lg font-black text-white">Order Momentum</h3>
                          <p className="text-sm text-zinc-500">Monthly order volume without extra queries</p>
                      </div>
                      <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={orderTrendData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                  <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#71717a", fontSize: 11, fontWeight: 700 }}
                                  />
                                  <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    allowDecimals={false}
                                    tick={{ fill: "#71717a", fontSize: 11, fontWeight: 700 }}
                                  />
                                  <Tooltip
                                    cursor={{ fill: "#ffffff08" }}
                                    contentStyle={{
                                        background: "#09090b",
                                        border: "1px solid #27272a",
                                        borderRadius: "1.25rem",
                                        padding: "12px 16px",
                                    }}
                                    formatter={(value: number) => [value, "Orders"]}
                                  />
                                  <Area
                                    type="monotone"
                                    dataKey="orderCount"
                                    stroke="#38bdf8"
                                    fill="#38bdf822"
                                    strokeWidth={3}
                                    isAnimationActive={false}
                                  />
                              </AreaChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900/40 p-6">
                      <div className="mb-6">
                          <h3 className="text-lg font-black text-white">Top Product Demand</h3>
                          <p className="text-sm text-zinc-500">Best-selling items by units shipped</p>
                      </div>
                      <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={topProductsChartData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                  <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#71717a", fontSize: 11, fontWeight: 700 }}
                                  />
                                  <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    allowDecimals={false}
                                    tick={{ fill: "#71717a", fontSize: 11, fontWeight: 700 }}
                                  />
                                  <Tooltip
                                    cursor={{ fill: "#ffffff08" }}
                                    contentStyle={{
                                        background: "#09090b",
                                        border: "1px solid #27272a",
                                        borderRadius: "1.25rem",
                                        padding: "12px 16px",
                                    }}
                                    formatter={(value: number) => [value, "Units sold"]}
                                  />
                                  <Bar
                                    dataKey="unitsSold"
                                    fill="#22c55e"
                                    radius={[10, 10, 0, 0]}
                                    maxBarSize={56}
                                    isAnimationActive={false}
                                  />
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
              </div>
          </div>

          <div className="space-y-6">
              <div className="rounded-[2.5rem] border border-zinc-800 bg-zinc-900/40 p-6">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-6">At a Glance</h3>
                  <div className="space-y-5">
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
                                  <Clock className="h-4 w-4" />
                              </div>
                              <span className="text-sm font-bold text-zinc-300">Today's Orders</span>
                          </div>
                          <span className="text-lg font-black text-white">{stats.todayOrders}</span>
                      </div>
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
                                  <Clock className="h-4 w-4" />
                              </div>
                              <span className="text-sm font-bold text-zinc-300">Pending Orders</span>
                          </div>
                          <span className="text-lg font-black text-white">{stats.pendingOrdersCount}</span>
                      </div>
                      {stats.needsAttentionCount > 0 && (
                          <div className="flex items-center justify-between rounded-2xl bg-red-500/10 border border-red-500/20 p-3">
                              <div className="flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4 text-red-400" />
                                  <span className="text-xs font-black text-red-200">Needs Attention</span>
                              </div>
                              <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white">
                                  {stats.needsAttentionCount}
                              </span>
                          </div>
                      )}
                  </div>
              </div>

              <div className="rounded-[2.5rem] border border-zinc-800 bg-zinc-900/40 p-6">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-6">Top Product Velocity</h3>
                  <div className="space-y-4">
                      {stats.topProducts.map((product: any, i: number) => (
                          <div key={i} className="flex items-center gap-4">
                              <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-zinc-800">
                                  <Image 
                                    src={product.images?.[0] || "/placeholder.jpg"} 
                                    alt="" 
                                    fill 
                                    className="object-cover" 
                                  />
                              </div>
                              <div className="flex-1 min-w-0">
                                  <p className="text-xs font-black text-white truncate">{product.name}</p>
                                  <p className="text-[10px] font-bold text-zinc-500">{product.unitsSold} units shipped</p>
                              </div>
                              <div className="text-right">
                                  <p className="text-[10px] font-black text-zinc-300">{formatKES(product.basePrice)}</p>
                              </div>
                          </div>
                      ))}
                  </div>
                  <Link href="/admin/products" className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-zinc-800 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:bg-zinc-800 transition-colors">
                      Full Inventory <ArrowRight className="h-3 w-3" />
                  </Link>
              </div>
          </div>
      </div>

      {/* Bottom Section: Recent Orders */}
      <div className="rounded-[2.5rem] border border-zinc-800 bg-zinc-900/40 p-8 shadow-2xl">
          <div className="mb-8 flex items-center justify-between">
              <div>
                  <h3 className="text-2xl font-black text-white">Latest Orders</h3>
                  <p className="text-sm text-zinc-500">Real-time purchase activity</p>
              </div>
              <Link 
                href="/admin/orders" 
                className="flex items-center gap-2 rounded-full bg-zinc-800 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                  View All Orders <ArrowRight className="h-3 w-3" />
              </Link>
          </div>
          
          <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                  <thead>
                      <tr className="text-left">
                          <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Order</th>
                          <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Customer</th>
                          <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Total</th>
                          <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Status</th>
                          <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Date</th>
                      </tr>
                  </thead>
                  <tbody>
                      {stats.recentOrders.map((order: any) => (
                          <MemoizedOrderRow key={order.id} order={order} />
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
}
