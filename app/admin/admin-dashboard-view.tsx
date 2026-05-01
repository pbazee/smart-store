"use client";

import { useMemo } from "react";
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
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import useSWR from "swr";
import type { Product } from "@/types";
import { formatKES } from "@/lib/utils";

export type AdminDashboardStats = {
  totalRevenue: number;
  revenueTrend: number;
  totalOrders: number;
  totalProducts: number;
  lowStockProducts: Product[];
  revenueByMonth: Array<{ month: string; revenue: number; orderCount: number }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string | null;
    customerEmail: string | null;
    total: number;
    status: string;
    createdAt: string | Date;
  }>;
  topProducts: Array<{
    name: string;
    images?: string[];
    basePrice: number;
    unitsSold: number;
  }>;
  ordersTrend: Array<{ day: string; orders: number }>;
  todayOrders: number;
  pendingOrdersCount: number;
  needsAttentionCount: number;
  lastUpdated: string;
};

type AdminDashboardStatsResponse = {
  data: AdminDashboardStats;
};

const fetcher = async (url: string): Promise<AdminDashboardStatsResponse> => {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Failed to load admin stats: ${response.status}`);
  }

  return response.json() as Promise<AdminDashboardStatsResponse>;
};

function formatCompactKsh(value: number) {
  if (value >= 1_000_000) {
    return `Ksh ${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `Ksh ${(value / 1_000).toFixed(0)}K`;
  }

  return `Ksh ${value}`;
}

function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string; payload?: Record<string, unknown> }>;
  label?: string;
  formatter?: (name: string, value: number) => string;
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-zinc-700 bg-zinc-950/95 px-4 py-3 shadow-2xl backdrop-blur">
      {label ? <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">{label}</p> : null}
      <div className="space-y-2">
        {payload.map((entry) => {
          const value = typeof entry.value === "number" ? entry.value : 0;
          const name = entry.name ?? "Value";

          return (
            <div key={`${name}-${value}`} className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: entry.color ?? "#f97316" }}
                />
                <span className="text-zinc-300">{name}</span>
              </div>
              <span className="font-bold text-white">
                {formatter ? formatter(name, value) : value.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  tone,
  icon: Icon,
  helper,
}: {
  title: string;
  value: string | number;
  tone: string;
  icon: React.ComponentType<{ className?: string }>;
  helper: string;
}) {
  return (
    <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900/40 p-6 shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">{title}</p>
          <h2 className="mt-3 text-3xl font-black text-white">{value}</h2>
          <p className="mt-2 text-xs text-zinc-400">{helper}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function AdminDashboardView({ stats: initialStats }: { stats: AdminDashboardStats }) {
  const { data, error, mutate } = useSWR<AdminDashboardStatsResponse>("/api/admin/stats", fetcher, {
    fallbackData: { data: initialStats },
    refreshInterval: 0,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    revalidateOnMount: false,
    keepPreviousData: true,
    dedupingInterval: 30000,
  });
  const stats = data?.data ?? initialStats;
  const monthlyRevenueData = useMemo(
    () => stats.revenueByMonth,
    [stats.revenueByMonth]
  );
  const topProductsBreakdown = useMemo(
    () => {
      const palette = ["#f97316", "#fb7185", "#38bdf8", "#22c55e", "#a855f7", "#eab308"];
      const totalUnits = stats.topProducts.reduce((sum, item) => sum + item.unitsSold, 0) || 1;

      return stats.topProducts.map((product, index) => ({
        name: product.name,
        value: Number(((product.unitsSold / totalUnits) * 100).toFixed(1)),
        unitsSold: product.unitsSold,
        color: palette[index % palette.length],
      }));
    },
    [stats.topProducts]
  );
  const ordersTrendData = useMemo(() => stats.ordersTrend, [stats.ordersTrend]);

  const quickActions = [
    { label: "Add Product", icon: Plus, href: "/admin/products?action=add" },
    { label: "View Orders", icon: ShoppingCart, href: "/admin/orders" },
    { label: "Send Announcement", icon: Mail, href: "/admin/announcements" },
    { label: "Manage Shipping", icon: MapPin, href: "/admin/shipping-rules" },
  ];

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-xl rounded-[2rem] border border-red-500/20 bg-zinc-950 p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="mt-6 text-3xl font-black text-white">Oops! Something went wrong</h1>
          <p className="mt-3 text-sm text-zinc-400">
            We encountered an unexpected error. Please try again.
          </p>
          <p className="mt-6 text-left text-xs font-bold uppercase tracking-[0.2em] text-red-400">
            Error Details:
          </p>
          <p className="mt-2 break-words text-left font-mono text-xs text-red-300">
            {error.message}
          </p>
          <div className="mt-8 grid gap-3">
            <button
              onClick={() => mutate()}
              className="rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-600"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-zinc-900"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Store performance, recent activity, and quick admin actions.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2">
          <Clock className="h-4 w-4 text-zinc-500" />
          <span className="text-xs font-semibold text-zinc-400" suppressHydrationWarning>
            Last updated:{" "}
            {new Date(stats.lastUpdated).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Revenue"
          value={formatKES(stats.totalRevenue)}
          tone="bg-emerald-500/15 text-emerald-400"
          icon={TrendingUp}
          helper={`${stats.revenueTrend >= 0 ? "+" : ""}${stats.revenueTrend.toFixed(1)}% vs last month`}
        />
        <StatCard
          title="Orders"
          value={stats.totalOrders.toLocaleString()}
          tone="bg-sky-500/15 text-sky-400"
          icon={ShoppingCart}
          helper={`${stats.todayOrders} placed today`}
        />
        <StatCard
          title="Products"
          value={stats.totalProducts.toLocaleString()}
          tone="bg-violet-500/15 text-violet-400"
          icon={Package}
          helper={`${stats.topProducts.length} top sellers tracked`}
        />
        <StatCard
          title="Low Stock"
          value={stats.lowStockProducts.length.toLocaleString()}
          tone="bg-orange-500/15 text-orange-400"
          icon={AlertTriangle}
          helper={`${stats.pendingOrdersCount} pending orders`}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-8">
          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900/40 p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white">Quick Actions</h2>
                <p className="text-sm text-zinc-500">Jump straight into the most common tasks.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-5 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
                >
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900/40 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-black text-white">Revenue by Month</h2>
              <p className="text-sm text-zinc-500">Monthly revenue performance for the last 6 months.</p>
            </div>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenueData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="monthlyRevenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#a1a1aa", fontSize: 12, fontWeight: 700 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#71717a", fontSize: 11, fontWeight: 700 }}
                    tickFormatter={(value: number) => formatCompactKsh(value)}
                  />
                  <Tooltip
                    content={
                      <ChartTooltip
                        formatter={(_name, value) => formatKES(value)}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#fb923c"
                    strokeWidth={3}
                    fill="url(#monthlyRevenueFill)"
                    isAnimationActive={false}
                    activeDot={{ r: 6, fill: "#f97316", stroke: "#18181b", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900/40 p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white">Latest Orders</h2>
                <p className="text-sm text-zinc-500">Newest purchase activity from the store.</p>
              </div>
              <Link
                href="/admin/orders"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-800 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                View All
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    <th className="pb-4">Order</th>
                    <th className="pb-4">Customer</th>
                    <th className="pb-4">Total</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.length > 0 ? (
                    stats.recentOrders.map((order) => (
                      <tr key={order.id} className="border-t border-zinc-800/80 text-sm">
                        <td className="py-4 font-bold text-white">#{order.orderNumber}</td>
                        <td className="py-4">
                          <div>
                            <p className="font-semibold text-zinc-200">
                              {order.customerName || "Member"}
                            </p>
                            <p className="text-xs text-zinc-500">{order.customerEmail || "No email"}</p>
                          </div>
                        </td>
                        <td className="py-4 font-bold text-orange-400">
                          {formatKES(order.total)}
                        </td>
                        <td className="py-4">
                          <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.16em] text-zinc-300">
                            {order.status}
                          </span>
                        </td>
                        <td className="py-4 text-xs text-zinc-500" suppressHydrationWarning>
                          {new Date(order.createdAt).toLocaleDateString("en-KE", {
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-zinc-500">
                        No recent orders yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="space-y-3 md:hidden">
              {stats.recentOrders.length > 0 ? (
                stats.recentOrders.map((order) => (
                  <div key={order.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-white">#{order.orderNumber}</p>
                        <p className="truncate text-sm text-zinc-400">
                          {order.customerName || "Member"}
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                          {order.customerEmail || "No email"}
                        </p>
                      </div>
                      <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-300">
                        {order.status}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="font-bold text-orange-400">{formatKES(order.total)}</span>
                      <span className="text-zinc-500" suppressHydrationWarning>
                        {new Date(order.createdAt).toLocaleDateString("en-KE", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500">No recent orders yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900/40 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-black text-white">Orders Trend</h2>
              <p className="text-sm text-zinc-500">Daily order movement over the last 7 days.</p>
            </div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ordersTrendData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#a1a1aa", fontSize: 12, fontWeight: 700 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    tick={{ fill: "#71717a", fontSize: 11, fontWeight: 700 }}
                  />
                  <Tooltip
                    content={
                      <ChartTooltip
                        formatter={(_name, value) => `${value} orders`}
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    name="Orders"
                    stroke="#38bdf8"
                    strokeWidth={3}
                    isAnimationActive={false}
                    dot={{ r: 4, fill: "#38bdf8", stroke: "#09090b", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: "#38bdf8", stroke: "#09090b", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900/40 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-black text-white">Top Products Breakdown</h2>
              <p className="mt-1 text-sm text-zinc-500">A donut view of the best-selling products.</p>
            </div>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topProductsBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={106}
                    paddingAngle={3}
                    isAnimationActive={false}
                  >
                    {topProductsBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} stroke="#18181b" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={
                      <ChartTooltip
                        formatter={(name, value) => {
                          const matchedProduct = topProductsBreakdown.find((entry) => entry.name === name);
                          return `${value}% (${matchedProduct?.unitsSold ?? 0} sold)`;
                        }}
                      />
                    }
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(value) => <span className="text-sm font-semibold text-zinc-300">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 rounded-2xl bg-zinc-950/80 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Leading Product</p>
                  <p className="mt-1 text-lg font-black text-white">
                    {topProductsBreakdown[0]?.name ?? "No sales data yet"}
                  </p>
                </div>
                <p className="text-sm font-bold text-orange-400">
                  {topProductsBreakdown[0]?.value ?? 0}% share
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900/40 p-6">
            <h2 className="text-xl font-black text-white">Low Stock Products</h2>
            <p className="mt-1 text-sm text-zinc-500">Items that may need restocking soon.</p>
            <div className="mt-6 space-y-3">
              {stats.lowStockProducts.length > 0 ? (
                stats.lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-2xl bg-zinc-950 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-zinc-100">{product.name}</p>
                      <p className="text-xs text-zinc-500">{product.category || "Uncategorized"}</p>
                    </div>
                    <Link
                      href="/admin/products"
                      className="text-xs font-bold uppercase tracking-[0.18em] text-orange-400"
                    >
                      Review
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500">No low-stock products right now.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
