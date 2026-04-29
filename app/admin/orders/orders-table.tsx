"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
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
import { InlineLoader } from "@/components/ui/ripple-loader";
import { jsonFetcher } from "@/lib/fetcher";
import type { AdminOrderListItem } from "@/lib/data-service";
import { cn, formatKES } from "@/lib/utils";

type OrdersTableProps = {
  initialOrders: AdminOrderListItem[];
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
  data: AdminOrderListItem[];
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

function getStatusConfig(order: AdminOrderListItem) {
  if (order.paymentStatus === "paid" && order.status === "pending") {
    return {
      label: "paid",
      color: "text-emerald-400 bg-emerald-400/10 border-emerald-500/20",
      icon: CheckCircle,
    };
  }

  switch (order.status) {
    case "delivered":
      return {
        label: "delivered",
        color: "text-emerald-400 bg-emerald-400/10 border-emerald-500/20",
        icon: CheckCircle,
      };
    case "shipped":
      return {
        label: "shipped",
        color: "text-blue-400 bg-blue-400/10 border-blue-500/20",
        icon: Truck,
      };
    case "pending":
    case "processing":
      return {
        label: order.status,
        color: "text-amber-400 bg-amber-400/10 border-amber-500/20",
        icon: Clock,
      };
    case "cancelled":
      return {
        label: "cancelled",
        color: "text-red-400 bg-red-400/10 border-red-500/20",
        icon: Package,
      };
    default:
      return {
        label: order.status,
        color: "text-zinc-400 bg-zinc-400/10 border-zinc-500/20",
        icon: Package,
      };
  }
}

function buildOrdersUrl(page: number, limit: number, search: string, status: string) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    search,
    status,
  });

  return `/api/admin/orders?${params.toString()}`;
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
  const [query, setQuery] = useState(initialSearch);
  const [debouncedQuery, setDebouncedQuery] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [currentPage, setCurrentPage] = useState(page);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [query]);

  useEffect(() => {
    setQuery(initialSearch);
    setDebouncedQuery(initialSearch);
    setStatus(initialStatus);
    setCurrentPage(page);
  }, [initialSearch, initialStatus, page]);

  const { data, isLoading, isValidating } = useSWR<ApiResponse>(
    buildOrdersUrl(currentPage, limit, debouncedQuery, status),
    jsonFetcher,
    {
      fallbackData: {
        success: true,
        data: initialOrders,
        meta: {
          page,
          limit,
          filteredTotal,
          totalOrders,
          totalPages: Math.max(1, Math.ceil(filteredTotal / limit)),
          search: initialSearch,
          status: initialStatus,
        },
      },
      keepPreviousData: true,
      revalidateOnFocus: true,
      dedupingInterval: 30_000,
    }
  );

  const orders = data?.data ?? initialOrders;
  const meta = data?.meta ?? {
    page,
    limit,
    filteredTotal,
    totalOrders,
    totalPages: Math.max(1, Math.ceil(filteredTotal / limit)),
    search: initialSearch,
    status: initialStatus,
  };

  useEffect(() => {
    const params = new URLSearchParams({
      page: String(currentPage),
      limit: String(limit),
      search: debouncedQuery,
      status,
    });

    router.replace(`/admin/orders?${params.toString()}`, { scroll: false });
  }, [currentPage, debouncedQuery, limit, router, status]);

  const changePage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > meta.totalPages) {
      return;
    }

    setCurrentPage(nextPage);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Full Order Ledger</h1>
        <p className="mt-1 text-xs font-bold uppercase tracking-widest text-zinc-500">
          Showing {meta.filteredTotal} of {meta.totalOrders} entries
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
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 py-3 pl-11 pr-11 text-sm font-medium text-white outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
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
          <InlineLoader label="Loading orders..." />
        ) : orders.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[2rem] border border-dashed border-zinc-700 bg-zinc-950/60 text-center">
            <p className="text-lg font-black text-white">
              No orders found matching &apos;{debouncedQuery}&apos;
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
            {isValidating ? (
              <div className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                Refreshing orders...
              </div>
            ) : null}

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

            {meta.totalPages > 1 ? (
              <div className="mt-8 flex items-center justify-between border-t border-zinc-800 pt-8">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Showing page {meta.page} of {meta.totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => changePage(meta.page - 1)}
                    disabled={meta.page === 1}
                    className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-300 transition hover:border-orange-500/50 disabled:opacity-30"
                  >
                    <ChevronLeft className="h-3 w-3" /> Previous
                  </button>
                  <button
                    onClick={() => changePage(meta.page + 1)}
                    disabled={meta.page === meta.totalPages}
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
