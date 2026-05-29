"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  X,
} from "lucide-react";
import { RippleSpinner } from "@/components/ui/ripple-loader";
import { jsonFetcher } from "@/lib/fetcher";
import type { AdminOrderListItem } from "@/lib/data-service";
import { cn, formatKES } from "@/lib/utils";

type OrdersTableProps = {
  initialOrders: AdminOrderListItem[];
  filteredTotal: number;
  totalOrders: number;
  initialSearch: string;
  initialOrderStatus: string;
  initialPaymentStatus: string;
  initialDateFrom: string;
  initialDateTo: string;
  page: number;
  limit: number;
};

const ORDER_STATUS_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "shipped" },
  { label: "Out for Delivery", value: "out_for_delivery" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Returned", value: "returned" },
] as const;

const PAYMENT_STATUS_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Unpaid", value: "unpaid" },
  { label: "Pending", value: "pending" },
  { label: "Paid", value: "paid" },
  { label: "Failed", value: "failed" },
  { label: "Refunded", value: "refunded" },
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
    orderStatus: string;
    paymentStatus: string;
    dateFrom: string;
    dateTo: string;
  };
};

function buildOrdersUrl(
  page: number,
  limit: number,
  search: string,
  orderStatus: string,
  paymentStatus: string,
  dateFrom: string,
  dateTo: string
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    search,
    orderStatus,
    paymentStatus,
    dateFrom,
    dateTo,
  });

  return `/api/admin/orders?${params.toString()}`;
}

function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function getPaymentBadge(status: AdminOrderListItem["paymentStatus"]) {
  const styles: Record<string, string> = {
    unpaid: "border-red-500/30 bg-red-500/10 text-red-300",
    failed: "border-red-500/30 bg-red-500/10 text-red-300",
    pending: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    partially_paid: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    paid: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    refunded: "border-zinc-700 bg-zinc-800/80 text-zinc-200",
  };

  return styles[status] || "border-zinc-700 bg-zinc-800/80 text-zinc-200";
}

function getOrderBadge(status: AdminOrderListItem["orderStatus"]) {
  const styles: Record<string, string> = {
    pending: "border-zinc-600 bg-zinc-700/20 text-zinc-200",
    processing: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    shipped: "border-violet-500/30 bg-violet-500/10 text-violet-300",
    out_for_delivery: "border-orange-500/30 bg-orange-500/10 text-orange-300",
    delivered: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    cancelled: "border-red-500/30 bg-red-500/10 text-red-300",
    returned: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  };

  return styles[status] || "border-zinc-700 bg-zinc-800/80 text-zinc-200";
}

export function OrdersTable({
  initialOrders,
  filteredTotal,
  totalOrders,
  initialSearch,
  initialOrderStatus,
  initialPaymentStatus,
  initialDateFrom,
  initialDateTo,
  page,
  limit,
}: OrdersTableProps) {
  const router = useRouter();
  const [isNavigating, startNavigation] = useTransition();
  const [query, setQuery] = useState(initialSearch);
  const [debouncedQuery, setDebouncedQuery] = useState(initialSearch);
  const [orderStatus, setOrderStatus] = useState(initialOrderStatus);
  const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus);
  const [dateFrom, setDateFrom] = useState(initialDateFrom);
  const [dateTo, setDateTo] = useState(initialDateTo);
  const [currentPage, setCurrentPage] = useState(page);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    setQuery(initialSearch);
    setDebouncedQuery(initialSearch);
    setOrderStatus(initialOrderStatus);
    setPaymentStatus(initialPaymentStatus);
    setDateFrom(initialDateFrom);
    setDateTo(initialDateTo);
    setCurrentPage(page);
  }, [initialSearch, initialOrderStatus, initialPaymentStatus, initialDateFrom, initialDateTo, page]);

  const { data, isLoading, isValidating } = useSWR<ApiResponse>(
    buildOrdersUrl(
      currentPage,
      limit,
      debouncedQuery,
      orderStatus,
      paymentStatus,
      dateFrom,
      dateTo
    ),
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
          orderStatus: initialOrderStatus,
          paymentStatus: initialPaymentStatus,
          dateFrom: initialDateFrom,
          dateTo: initialDateTo,
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
    orderStatus: initialOrderStatus,
    paymentStatus: initialPaymentStatus,
    dateFrom: initialDateFrom,
    dateTo: initialDateTo,
  };

  useEffect(() => {
    const params = new URLSearchParams({
      page: String(currentPage),
      limit: String(limit),
      search: debouncedQuery,
      orderStatus,
      paymentStatus,
      dateFrom,
      dateTo,
    });

    router.replace(`/admin/orders?${params.toString()}`, { scroll: false });
  }, [currentPage, dateFrom, dateTo, debouncedQuery, limit, orderStatus, paymentStatus, router]);

  const changePage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > meta.totalPages) {
      return;
    }

    setCurrentPage(nextPage);
  };

  const clearFilters = () => {
    setQuery("");
    setDebouncedQuery("");
    setOrderStatus("all");
    setPaymentStatus("all");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  const openOrder = (orderNumber: string) => {
    setPendingOrderId(orderNumber);
    startNavigation(() => {
      router.push(`/admin/orders/${orderNumber}`);
    });
  };

  const summary = useMemo(
    () =>
      orders.map((order) => ({
        ...order,
        itemsSummary: order.items
          .slice(0, 2)
          .map((item) => `${item.productName} x${item.quantity}`)
          .join(", "),
        itemsCount: order.items.reduce((count, item) => count + item.quantity, 0),
      })),
    [orders]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Orders</h1>
        <p className="mt-1 text-xs font-bold uppercase tracking-widest text-zinc-500">
          Showing {meta.filteredTotal} of {meta.totalOrders} entries
        </p>
      </div>

      <div className="rounded-[2.5rem] border border-zinc-800 bg-zinc-900/40 p-8 shadow-2xl">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr),repeat(4,minmax(0,0.75fr)),auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by order ID, customer name, or phone..."
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

          <select
            value={orderStatus}
            onChange={(event) => {
              setOrderStatus(event.target.value);
              setCurrentPage(1);
            }}
            className="rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white"
          >
            {ORDER_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={paymentStatus}
            onChange={(event) => {
              setPaymentStatus(event.target.value);
              setCurrentPage(1);
            }}
            className="rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white"
          >
            {PAYMENT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(event) => {
              setDateFrom(event.target.value);
              setCurrentPage(1);
            }}
            className="rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(event) => {
              setDateTo(event.target.value);
              setCurrentPage(1);
            }}
            className="rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white"
          />

          <button
            type="button"
            onClick={clearFilters}
            className="rounded-2xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:border-brand-400 hover:text-white"
          >
            Clear Filters
          </button>
        </div>

        {isLoading ? (
          <div className="flex min-h-[240px] items-center justify-center gap-3 text-sm text-zinc-400">
            <RippleSpinner size={28} color="#FF6400" label="Loading orders" />
            Loading orders...
          </div>
        ) : summary.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[2rem] border border-dashed border-zinc-700 bg-zinc-950/60 text-center">
            <p className="text-lg font-black text-white">No orders match the current filters.</p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 rounded-full border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-orange-500 hover:text-white"
            >
              Clear filters
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
              <table className="w-full min-w-[1200px]">
                <thead>
                  <tr className="border-b border-zinc-800 text-left">
                    {[
                      "Order ID",
                      "Date",
                      "Customer Name",
                      "Customer Phone",
                      "Items",
                      "Total Amount",
                      "Payment Status",
                      "Order Status",
                      "Actions",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {summary.map((order) => (
                    <tr key={order.id} className="transition-colors hover:bg-zinc-800/30">
                      <td className="py-5 font-black text-white">#{order.orderNumber}</td>
                      <td className="py-5 text-sm text-zinc-300">
                        {new Date(order.createdAt).toLocaleDateString("en-KE", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-5 text-sm font-semibold text-zinc-200">{order.customerName}</td>
                      <td className="py-5 text-sm text-zinc-300">{order.customerPhone}</td>
                      <td className="py-5 text-sm text-zinc-300">
                        <p>{order.itemsCount} item{order.itemsCount === 1 ? "" : "s"}</p>
                        <p className="mt-1 text-xs text-zinc-500">{order.itemsSummary}</p>
                      </td>
                      <td className="py-5 text-sm font-black text-orange-400">{formatKES(order.total)}</td>
                      <td className="py-5">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                            getPaymentBadge(order.paymentStatus)
                          )}
                        >
                          {formatStatusLabel(order.paymentStatus)}
                        </span>
                      </td>
                      <td className="py-5">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                            getOrderBadge(order.orderStatus)
                          )}
                        >
                          {formatStatusLabel(order.orderStatus)}
                        </span>
                      </td>
                      <td className="py-5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openOrder(order.orderNumber)}
                            disabled={isNavigating && pendingOrderId === order.orderNumber}
                            className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:border-brand-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isNavigating && pendingOrderId === order.orderNumber ? (
                              <RippleSpinner size={28} color="currentColor" label="Opening order" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => openOrder(order.orderNumber)}
                            disabled={isNavigating && pendingOrderId === order.orderNumber}
                            className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:border-brand-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isNavigating && pendingOrderId === order.orderNumber ? (
                              <RippleSpinner size={28} color="currentColor" label="Opening order" />
                            ) : null}
                            Update Status
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
