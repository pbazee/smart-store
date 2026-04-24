"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Package,
  Search,
  Truck,
  X,
} from "lucide-react";
import type { Order } from "@/types";
import { cn, formatKES } from "@/lib/utils";

type OrdersTableProps = {
  initialOrders: Order[];
  filteredTotal: number;
  totalOrders: number;
  initialSearch: string;
  initialStatus: string;
  page: number;
  limit: number;
};

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Paid", value: "paid" },
  { label: "Shipped", value: "shipped" },
  { label: "Cancelled", value: "cancelled" },
] as const;

type ApiResponse = {
  success: boolean;
  data: Order[];
  meta: {
    page: number;
    limit: number;
    filteredTotal: number;
    totalOrders: number;
    totalPages: number;
    search: string;
    status: string;
  };
};

function getStatusConfig(order: Order) {
  if (order.paymentStatus === "paid" && order.status === "pending") {
    return { label: "paid", color: "text-emerald-400 bg-emerald-400/10 border-emerald-500/20", icon: CheckCircle };
  }

  switch (order.status) {
    case "delivered":
      return { label: "delivered", color: "text-emerald-400 bg-emerald-400/10 border-emerald-500/20", icon: CheckCircle };
    case "shipped":
      return { label: "shipped", color: "text-blue-400 bg-blue-400/10 border-blue-500/20", icon: Truck };
    case "pending":
    case "processing":
      return { label: order.status, color: "text-amber-400 bg-amber-400/10 border-amber-500/20", icon: Clock };
    case "cancelled":
      return { label: "cancelled", color: "text-red-400 bg-red-400/10 border-red-500/20", icon: Package };
    default:
      return { label: order.status, color: "text-zinc-400 bg-zinc-400/10 border-zinc-500/20", icon: Package };
  }
}

export function OrdersTable({
  initialOrders,
  filteredTotal,
  totalOrders,
  initialSearch,
  initialStatus,
  page,
  limit,
}: OrdersTableProps) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [query, setQuery] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [currentPage, setCurrentPage] = useState(page);
  const [currentFilteredTotal, setCurrentFilteredTotal] = useState(filteredTotal);
  const [currentTotalOrders, setCurrentTotalOrders] = useState(totalOrders);
  const [totalPages, setTotalPages] = useState(Math.max(1, Math.ceil(filteredTotal / limit)));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setOrders(initialOrders);
    setCurrentFilteredTotal(filteredTotal);
    setCurrentTotalOrders(totalOrders);
    setCurrentPage(page);
    setStatus(initialStatus);
    setQuery(initialSearch);
    setTotalPages(Math.max(1, Math.ceil(filteredTotal / limit)));
  }, [filteredTotal, initialOrders, initialSearch, initialStatus, limit, page, totalOrders]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        setIsLoading(true);

        try {
          const searchParams = new URLSearchParams({
            search: query,
            status,
            page: String(currentPage),
            limit: String(limit),
          });

          const response = await fetch(`/api/admin/orders?${searchParams.toString()}`, {
            cache: "no-store",
          });
          const data = (await response.json()) as ApiResponse;

          if (!response.ok) {
            throw new Error("Failed to fetch orders");
          }

          setOrders(data.data);
          setCurrentFilteredTotal(data.meta.filteredTotal);
          setCurrentTotalOrders(data.meta.totalOrders);
          setTotalPages(data.meta.totalPages);
          router.replace(
            `/admin/orders?page=${data.meta.page}&limit=${data.meta.limit}&search=${encodeURIComponent(
              data.meta.search
            )}&status=${encodeURIComponent(data.meta.status)}`
          );
        } catch (error) {
          console.error("Orders search failed:", error);
        } finally {
          setIsLoading(false);
        }
      })();
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [currentPage, limit, query, router, status]);

  const changePage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) {
      return;
    }

    setCurrentPage(nextPage);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Full Order Ledger</h1>
        <p className="mt-1 text-xs font-bold uppercase tracking-widest text-zinc-500">
          Showing {currentFilteredTotal} of {currentTotalOrders} entries
        </p>
      </div>

      <div className="rounded-[2.5rem] border border-zinc-800 bg-zinc-900/40 p-8 shadow-2xl">
        <div className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by order ref, customer name, email, or payment method..."
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 pl-11 pr-11 py-3 text-sm font-medium text-white outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCurrentPage(1);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 transition hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => {
                  setStatus(filter.value);
                  setCurrentPage(1);
                }}
                className={cn(
                  "rounded-full border px-4 py-2 text-xs font-black uppercase tracking-widest transition",
                  status === filter.value
                    ? "border-orange-500 bg-orange-500 text-white"
                    : "border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-orange-500/50 hover:text-white"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <Clock className="h-6 w-6 animate-spin text-orange-500" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[2rem] border border-dashed border-zinc-700 bg-zinc-950/60 text-center">
            <p className="text-lg font-black text-white">
              No orders found matching &apos;{query}&apos;
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setStatus("all");
                setCurrentPage(1);
              }}
              className="mt-4 rounded-full border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-orange-500 hover:text-white"
            >
              Clear search
            </button>
          </div>
        ) : (
          <>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-zinc-800 text-left">
                    <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Order Ref</th>
                    <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Principal</th>
                    <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Method</th>
                    <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Investment</th>
                    <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Condition</th>
                    <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Timestamp</th>
                    <th className="pb-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {orders.map((order) => {
                    const config = getStatusConfig(order);
                    return (
                      <tr key={order.id} className="group transition-colors hover:bg-zinc-800/30">
                        <td className="py-5">
                          <span className="font-black text-white">#{order.orderNumber}</span>
                        </td>
                        <td className="py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-zinc-200">{order.customerName}</span>
                            <span className="text-[10px] text-zinc-500">{order.customerEmail}</span>
                          </div>
                        </td>
                        <td className="py-5">
                          <span className="text-xs font-bold uppercase text-zinc-300">
                            {order.paymentMethod}
                          </span>
                        </td>
                        <td className="py-5 text-sm font-black text-orange-400">
                          {formatKES(order.total)}
                        </td>
                        <td className="py-5">
                          <div
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                              config.color
                            )}
                          >
                            <config.icon className="h-3 w-3" />
                            {config.label}
                          </div>
                        </td>
                        <td className="py-5 text-[10px] font-black uppercase text-zinc-500">
                          {new Date(order.createdAt).toLocaleDateString("en-KE", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-5 text-right">
                          <Link
                            href={`/admin/orders/${order.orderNumber}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-zinc-400 transition hover:border-orange-500 hover:text-orange-400"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 ? (
              <div className="mt-8 flex items-center justify-between border-t border-zinc-800 pt-8">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Showing page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => changePage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-300 transition hover:border-orange-500/50 disabled:opacity-30"
                  >
                    <ChevronLeft className="h-3 w-3" /> Previous
                  </button>
                  <button
                    onClick={() => changePage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-300 transition hover:border-orange-500/50 disabled:opacity-30"
                  >
                    Next <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
