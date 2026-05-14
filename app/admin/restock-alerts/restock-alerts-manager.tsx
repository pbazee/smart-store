"use client";

import { useDeferredValue, useMemo, useState } from "react";
import {
  Bell,
  Check,
  Clipboard,
  Download,
  Mail,
  MessageCircle,
  Search,
  Trash2,
} from "lucide-react";
import { useToast } from "@/lib/use-toast";
import { cn } from "@/lib/utils";

type RestockAlertRow = {
  id: string;
  email: string;
  phone?: string | null;
  productId: string;
  variantId?: string | null;
  sizeName?: string | null;
  notified: boolean;
  createdAt: string | Date;
  product: {
    id: string;
    name: string;
  };
  variant?: {
    id: string;
    color: string;
    size: string;
  } | null;
};

type StatusFilter = "all" | "pending" | "notified";
type SortOption = "newest" | "oldest" | "pending-first" | "product-az" | "email-az";

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All alerts" },
  { value: "pending", label: "Pending" },
  { value: "notified", label: "Notified" },
];

function getVariantLabel(notification: RestockAlertRow) {
  if (notification.variant) {
    return `${notification.variant.color}${notification.variant.size ? ` / ${notification.variant.size}` : ""}`;
  }

  return notification.sizeName || "Single item";
}

function getNotificationSearchHaystack(notification: RestockAlertRow) {
  return [
    notification.email,
    notification.phone || "",
    notification.product.name,
    getVariantLabel(notification),
    notification.notified ? "notified" : "pending",
  ]
    .join(" ")
    .toLowerCase();
}

function formatWaitTime(createdAt: string | Date) {
  const requestedAt = new Date(createdAt).getTime();
  const diffMs = Math.max(0, Date.now() - requestedAt);
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays}d waiting`;
  }

  if (diffHours > 0) {
    return `${diffHours}h waiting`;
  }

  const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  return `${diffMinutes}m waiting`;
}

function formatPhoneForWhatsApp(phone?: string | null) {
  const cleaned = (phone || "").replace(/[^\d+]/g, "");
  return cleaned.startsWith("+") ? cleaned.slice(1) : cleaned;
}

export function RestockAlertsManager({
  initialNotifications,
}: {
  initialNotifications: RestockAlertRow[];
}) {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("pending-first");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busyIds, setBusyIds] = useState<string[]>([]);
  const [bulkPending, setBulkPending] = useState(false);
  const deferredSearch = useDeferredValue(search);

  const filteredNotifications = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();

    const filtered = notifications.filter((notification) => {
      const matchesSearch =
        !normalizedSearch || getNotificationSearchHaystack(notification).includes(normalizedSearch);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "pending" ? !notification.notified : notification.notified);

      return matchesSearch && matchesStatus;
    });

    return filtered.sort((left, right) => {
      if (sortBy === "newest") {
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }

      if (sortBy === "oldest") {
        return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      }

      if (sortBy === "product-az") {
        return left.product.name.localeCompare(right.product.name);
      }

      if (sortBy === "email-az") {
        return left.email.localeCompare(right.email);
      }

      if (left.notified !== right.notified) {
        return Number(left.notified) - Number(right.notified);
      }

      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
  }, [deferredSearch, notifications, sortBy, statusFilter]);

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const filteredIdSet = useMemo(
    () => new Set(filteredNotifications.map((notification) => notification.id)),
    [filteredNotifications]
  );
  const visibleSelectedCount = useMemo(
    () => selectedIds.filter((id) => filteredIdSet.has(id)).length,
    [filteredIdSet, selectedIds]
  );

  const allVisibleSelected =
    filteredNotifications.length > 0 && visibleSelectedCount === filteredNotifications.length;

  const pendingCount = notifications.filter((notification) => !notification.notified).length;
  const notifiedCount = notifications.length - pendingCount;
  const uniqueProducts = new Set(notifications.map((notification) => notification.productId)).size;
  const phoneCoverageCount = notifications.filter((notification) => Boolean(notification.phone)).length;

  const productDemand = useMemo(() => {
    const grouped = new Map<
      string,
      { productName: string; total: number; pending: number; lastRequestedAt: number }
    >();

    for (const notification of notifications) {
      const current = grouped.get(notification.productId);
      const requestedAt = new Date(notification.createdAt).getTime();

      if (current) {
        current.total += 1;
        current.pending += notification.notified ? 0 : 1;
        current.lastRequestedAt = Math.max(current.lastRequestedAt, requestedAt);
        continue;
      }

      grouped.set(notification.productId, {
        productName: notification.product.name,
        total: 1,
        pending: notification.notified ? 0 : 1,
        lastRequestedAt: requestedAt,
      });
    }

    return [...grouped.entries()]
      .map(([productId, value]) => ({ productId, ...value }))
      .sort((left, right) => {
        if (right.pending !== left.pending) {
          return right.pending - left.pending;
        }

        if (right.total !== left.total) {
          return right.total - left.total;
        }

        return right.lastRequestedAt - left.lastRequestedAt;
      })
      .slice(0, 4);
  }, [notifications]);

  const setBusyState = (id: string, nextBusy: boolean) => {
    setBusyIds((current) =>
      nextBusy ? [...new Set([...current, id])] : current.filter((value) => value !== id)
    );
  };

  const updateStatus = async (id: string, notified: boolean) => {
    setBusyState(id, true);

    try {
      const response = await fetch(`/api/admin/restock-notifications/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notified }),
      });

      if (!response.ok) {
        throw new Error("Failed to update alert.");
      }

      setNotifications((current) =>
        current.map((item) => (item.id === id ? { ...item, notified } : item))
      );

      toast({
        title: notified ? "Marked notified" : "Moved back to pending",
        description: "The restock alert status was updated.",
      });
    } catch {
      toast({
        title: "Update failed",
        description: "The alert could not be updated right now.",
        variant: "destructive",
      });
    } finally {
      setBusyState(id, false);
    }
  };

  const deleteAlert = async (id: string) => {
    if (!window.confirm("Delete this restock alert?")) {
      return;
    }

    setBusyState(id, true);

    try {
      const response = await fetch(`/api/admin/restock-notifications/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete alert.");
      }

      setNotifications((current) => current.filter((item) => item.id !== id));
      setSelectedIds((current) => current.filter((value) => value !== id));
      toast({
        title: "Alert deleted",
        description: "The subscriber has been removed from the restock queue.",
      });
    } catch {
      toast({
        title: "Delete failed",
        description: "The alert could not be removed right now.",
        variant: "destructive",
      });
    } finally {
      setBusyState(id, false);
    }
  };

  const updateManyStatuses = async (notified: boolean) => {
    const idsToUpdate = filteredNotifications
      .filter((notification) => selectedIdSet.has(notification.id))
      .map((notification) => notification.id);

    if (idsToUpdate.length === 0) {
      return;
    }

    setBulkPending(true);

    try {
      await Promise.all(
        idsToUpdate.map((id) =>
          fetch(`/api/admin/restock-notifications/${id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ notified }),
          }).then((response) => {
            if (!response.ok) {
              throw new Error("Failed to update selected alerts.");
            }
          })
        )
      );

      setNotifications((current) =>
        current.map((item) => (selectedIdSet.has(item.id) ? { ...item, notified } : item))
      );
      toast({
        title: notified ? "Selected alerts marked notified" : "Selected alerts marked pending",
        description: `${idsToUpdate.length} alert(s) were updated.`,
      });
    } catch {
      toast({
        title: "Bulk update failed",
        description: "Some alerts could not be updated.",
        variant: "destructive",
      });
    } finally {
      setBulkPending(false);
    }
  };

  const deleteSelected = async () => {
    const idsToDelete = filteredNotifications
      .filter((notification) => selectedIdSet.has(notification.id))
      .map((notification) => notification.id);

    if (idsToDelete.length === 0) {
      return;
    }

    if (!window.confirm(`Delete ${idsToDelete.length} selected alert(s)?`)) {
      return;
    }

    setBulkPending(true);

    try {
      await Promise.all(
        idsToDelete.map((id) =>
          fetch(`/api/admin/restock-notifications/${id}`, {
            method: "DELETE",
          }).then((response) => {
            if (!response.ok) {
              throw new Error("Failed to delete selected alerts.");
            }
          })
        )
      );

      setNotifications((current) => current.filter((item) => !selectedIdSet.has(item.id)));
      setSelectedIds((current) => current.filter((id) => !selectedIdSet.has(id)));
      toast({
        title: "Alerts deleted",
        description: `${idsToDelete.length} alert(s) were removed.`,
      });
    } catch {
      toast({
        title: "Bulk delete failed",
        description: "Some alerts could not be removed.",
        variant: "destructive",
      });
    } finally {
      setBulkPending(false);
    }
  };

  const exportFilteredAlerts = () => {
    if (filteredNotifications.length === 0) {
      toast({
        title: "Nothing to export",
        description: "Adjust your filters or wait for new alerts.",
        variant: "destructive",
      });
      return;
    }

    const rows = [
      ["email", "phone", "product", "variant_or_size", "status", "date_requested"],
      ...filteredNotifications.map((notification) => [
        notification.email,
        notification.phone || "",
        notification.product.name,
        getVariantLabel(notification),
        notification.notified ? "Notified" : "Pending",
        new Date(notification.createdAt).toISOString(),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "restock-alerts.csv";
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export ready",
      description: `${filteredNotifications.length} alert(s) exported to CSV.`,
    });
  };

  const toggleVisibleSelection = () => {
    if (allVisibleSelected) {
      setSelectedIds((current) => current.filter((id) => !filteredIdSet.has(id)));
      return;
    }

    setSelectedIds((current) => [
      ...new Set([...current, ...filteredNotifications.map((notification) => notification.id)]),
    ]);
  };

  const toggleRowSelection = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Restock Alerts</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Search demand, follow up fast, and clear the queue as stock comes back.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={exportFilteredAlerts}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:border-orange-500/50 hover:text-white"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/40 p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            Total Alerts
          </p>
          <p className="mt-3 text-3xl font-black text-white">{notifications.length}</p>
          <p className="mt-2 text-sm text-zinc-400">Live demand waiting in the queue.</p>
        </div>
        <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/40 p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            Pending Follow-Up
          </p>
          <p className="mt-3 text-3xl font-black text-amber-300">{pendingCount}</p>
          <p className="mt-2 text-sm text-zinc-400">Subscribers still waiting for a restock.</p>
        </div>
        <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/40 p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            Products Requested
          </p>
          <p className="mt-3 text-3xl font-black text-white">{uniqueProducts}</p>
          <p className="mt-2 text-sm text-zinc-400">Unique products drawing waitlist demand.</p>
        </div>
        <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/40 p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            Phone Reach
          </p>
          <p className="mt-3 text-3xl font-black text-emerald-300">{phoneCoverageCount}</p>
          <p className="mt-2 text-sm text-zinc-400">Alerts with a direct WhatsApp follow-up path.</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr,0.7fr]">
        <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                Queue Controls
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                Filter by status, search subscribers, and sort the queue by urgency.
              </p>
            </div>
            <p className="text-sm font-semibold text-zinc-300">
              Showing {filteredNotifications.length} of {notifications.length}
            </p>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.3fr,0.9fr]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by email, phone, product, color, or size..."
                className="h-12 w-full rounded-[1.1rem] border border-zinc-800 bg-zinc-950/80 pl-11 pr-4 text-sm font-medium text-white outline-none transition focus:border-orange-500/50"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortOption)}
                className="h-12 rounded-[1.1rem] border border-zinc-800 bg-zinc-950/80 px-4 text-sm font-medium text-white outline-none transition focus:border-orange-500/50"
              >
                <option value="pending-first">Pending first</option>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="product-az">Product A-Z</option>
                <option value="email-az">Email A-Z</option>
              </select>

              <div className="flex items-center rounded-[1.1rem] border border-zinc-800 bg-zinc-950/80 p-1">
                {STATUS_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setStatusFilter(filter.value)}
                    className={cn(
                      "flex-1 rounded-[0.9rem] px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] transition",
                      statusFilter === filter.value
                        ? "bg-orange-500 text-white shadow-[0_10px_30px_rgba(249,115,22,0.24)]"
                        : "text-zinc-400 hover:text-zinc-100"
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                High Demand Products
              </p>
              <p className="mt-1 text-sm text-zinc-400">The products building the biggest queue.</p>
            </div>
            <Bell className="h-4 w-4 text-orange-300" />
          </div>

          <div className="mt-5 space-y-3">
            {productDemand.map((product) => (
              <div
                key={product.productId}
                className="rounded-[1.35rem] border border-zinc-800 bg-black/20 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{product.productName}</p>
                    <p className="mt-1 text-xs text-zinc-400">
                      Last request {new Date(product.lastRequestedAt).toLocaleDateString("en-KE")}
                    </p>
                  </div>
                  <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-300">
                    {product.pending} pending
                  </span>
                </div>
                <p className="mt-3 text-sm text-zinc-300">{product.total} total subscribers queued</p>
              </div>
            ))}

            {productDemand.length === 0 ? (
              <div className="rounded-[1.35rem] border border-dashed border-zinc-800 bg-black/20 p-4 text-sm text-zinc-500">
                No demand data yet.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {selectedIds.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-[1.5rem] border border-orange-500/20 bg-orange-500/10 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">{visibleSelectedCount} selected in current view</p>
            <p className="text-xs uppercase tracking-[0.16em] text-orange-200/80">
              Bulk queue actions
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void updateManyStatuses(true)}
              disabled={bulkPending}
              className="rounded-full border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:border-emerald-500/50 disabled:opacity-60"
            >
              Mark notified
            </button>
            <button
              type="button"
              onClick={() => void updateManyStatuses(false)}
              disabled={bulkPending}
              className="rounded-full border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:border-amber-500/50 disabled:opacity-60"
            >
              Mark pending
            </button>
            <button
              type="button"
              onClick={() => void deleteSelected()}
              disabled={bulkPending}
              className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 disabled:opacity-60"
            >
              Delete selected
            </button>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-900/40">
        <div className="overflow-x-auto">
          <table className="min-w-[1080px] w-full text-left">
            <thead className="border-b border-zinc-800">
              <tr className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                <th className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleVisibleSelection}
                    aria-label="Select visible alerts"
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 accent-orange-500"
                  />
                </th>
                <th className="px-4 py-4">Subscriber</th>
                <th className="px-4 py-4">Contact</th>
                <th className="px-4 py-4">Product</th>
                <th className="px-4 py-4">Request</th>
                <th className="px-4 py-4">Wait Time</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-sm text-zinc-200">
              {filteredNotifications.map((notification) => {
                const rowBusy = busyIds.includes(notification.id);
                const whatsappPhone = formatPhoneForWhatsApp(notification.phone);

                return (
                  <tr key={notification.id} className="transition-colors hover:bg-zinc-800/25">
                    <td className="px-4 py-4 align-top">
                      <input
                        type="checkbox"
                        checked={selectedIdSet.has(notification.id)}
                        onChange={() => toggleRowSelection(notification.id)}
                        aria-label={`Select ${notification.email}`}
                        className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-950 accent-orange-500"
                      />
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div>
                        <p className="font-semibold text-white">{notification.email}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-zinc-500">
                          Alert ID {notification.id.slice(0, 8)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="space-y-2">
                        <p className="text-zinc-300">{notification.phone || "-"}</p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              await navigator.clipboard.writeText(notification.email);
                              toast({
                                title: "Email copied",
                                description: notification.email,
                              });
                            }}
                            className="inline-flex items-center gap-1 rounded-full border border-zinc-700 px-2.5 py-1 text-[11px] font-semibold text-zinc-200 transition hover:border-orange-500/50"
                          >
                            <Clipboard className="h-3 w-3" />
                            Copy
                          </button>
                          <a
                            href={`mailto:${notification.email}`}
                            className="inline-flex items-center gap-1 rounded-full border border-zinc-700 px-2.5 py-1 text-[11px] font-semibold text-zinc-200 transition hover:border-orange-500/50"
                          >
                            <Mail className="h-3 w-3" />
                            Email
                          </a>
                          {whatsappPhone ? (
                            <a
                              href={`https://wa.me/${whatsappPhone}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 px-2.5 py-1 text-[11px] font-semibold text-emerald-200 transition hover:bg-emerald-500/10"
                            >
                              <MessageCircle className="h-3 w-3" />
                              WhatsApp
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div>
                        <p className="font-semibold text-white">{notification.product.name}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Product ID {notification.productId.slice(0, 8)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div>
                        <p className="font-semibold text-zinc-100">{getVariantLabel(notification)}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {notification.variantId ? "Variant-specific alert" : "Product-level alert"}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div>
                        <p className="font-semibold text-zinc-100">
                          {formatWaitTime(notification.createdAt)}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {new Date(notification.createdAt).toLocaleString("en-KE")}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em]",
                          notification.notified
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                            : "border-amber-500/20 bg-amber-500/10 text-amber-300"
                        )}
                      >
                        {notification.notified ? "Notified" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void updateStatus(notification.id, !notification.notified)}
                          disabled={rowBusy}
                          className="inline-flex items-center gap-1 rounded-full border border-zinc-700 px-3 py-1.5 text-[11px] font-semibold text-zinc-100 transition hover:border-orange-500/50 disabled:opacity-60"
                        >
                          <Check className="h-3 w-3" />
                          {notification.notified ? "Mark pending" : "Mark notified"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteAlert(notification.id)}
                          disabled={rowBusy}
                          className="inline-flex items-center gap-1 rounded-full border border-red-500/30 px-3 py-1.5 text-[11px] font-semibold text-red-200 transition hover:bg-red-500/10 disabled:opacity-60"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredNotifications.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="mx-auto max-w-md space-y-3">
                      <p className="text-lg font-semibold text-white">No alerts match the current view.</p>
                      <p className="text-sm text-zinc-500">
                        Try clearing the search box or switching back to all statuses.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-zinc-800 px-5 py-4 text-sm text-zinc-400 lg:flex-row lg:items-center lg:justify-between">
          <p>
            {pendingCount} pending, {notifiedCount} notified, {visibleSelectedCount} selected in view.
          </p>
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
            Searchable queue inspired by modern back-in-stock reporting workflows
          </p>
        </div>
      </div>
    </div>
  );
}
