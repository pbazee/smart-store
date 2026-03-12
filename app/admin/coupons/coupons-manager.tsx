"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { Loader2, Plus, Search, TicketPercent, Trash2, Pencil } from "lucide-react";
import { CouponFormDialog } from "@/app/admin/coupons/coupon-form-dialog";
import { deleteAdminCouponAction } from "@/app/admin/coupons/actions";
import { useToast } from "@/lib/use-toast";
import { formatKES } from "@/lib/utils";
import type { Coupon } from "@/types";

export function CouponsManager({
  initialCoupons,
}: {
  initialCoupons: Coupon[];
}) {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState(initialCoupons);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const deferredSearch = useDeferredValue(search);

  const visibleCoupons = useMemo(() => {
    return [...coupons]
      .filter((coupon) => {
        const matchesSearch =
          !deferredSearch.trim() ||
          [coupon.code, coupon.discountType]
            .join(" ")
            .toLowerCase()
            .includes(deferredSearch.trim().toLowerCase());

        const matchesFilter =
          filter === "all" || (filter === "active" ? coupon.isActive : !coupon.isActive);

        return matchesSearch && matchesFilter;
      })
      .sort((left, right) => left.code.localeCompare(right.code));
  }, [coupons, deferredSearch, filter]);

  const handleSavedCoupon = (coupon: Coupon) => {
    setCoupons((current) => {
      const exists = current.some((item) => item.id === coupon.id);
      if (exists) {
        return current.map((item) => (item.id === coupon.id ? coupon : item));
      }

      return [coupon, ...current];
    });
  };

  const handleDelete = async (coupon: Coupon) => {
    const confirmed = window.confirm(`Delete coupon "${coupon.code}"?`);

    if (!confirmed) {
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          await deleteAdminCouponAction(coupon.id);
          setCoupons((current) => current.filter((item) => item.id !== coupon.id));
          toast({
            title: "Coupon deleted",
            description: "The discount code was removed successfully.",
          });
        } catch (error) {
          toast({
            title: "Delete failed",
            description: error instanceof Error ? error.message : "Please try again.",
            variant: "destructive",
          });
        }
      })();
    });
  };

  const activeCount = coupons.filter((coupon) => coupon.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-400">
            Promotion control
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">Admin Coupons</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Launch discount campaigns, minimum spend offers, and expiry-based promos from admin.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingCoupon(null);
            setDialogOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" />
          Create Coupon
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Total coupons</p>
          <p className="mt-2 text-3xl font-black text-white">{coupons.length}</p>
        </div>
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Active coupons</p>
          <p className="mt-2 text-3xl font-black text-white">{activeCount}</p>
        </div>
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Visible results</p>
          <p className="mt-2 text-3xl font-black text-white">{visibleCoupons.length}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search coupon codes"
            className="h-12 w-full rounded-full border border-zinc-800 bg-zinc-900 pl-11 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(["all", "active", "inactive"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                filter === value
                  ? "bg-brand-500 text-white"
                  : "border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-600"
              }`}
            >
              {value[0].toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b border-zinc-800 bg-zinc-950/70">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Code
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Type
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Value
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Min Order
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Expires
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Usage / Limit
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Active?
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleCoupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-zinc-400">
                    No coupons match the current filters.
                  </td>
                </tr>
              ) : (
                visibleCoupons.map((coupon) => (
                  <tr
                    key={coupon.id}
                    className="border-b border-zinc-800/70 transition-colors hover:bg-zinc-800/40"
                  >
                    <td className="px-4 py-4 align-middle font-semibold text-zinc-100">
                      {coupon.code}
                    </td>
                    <td className="px-4 py-4 align-middle text-sm text-zinc-300 capitalize">
                      {coupon.discountType}
                    </td>
                    <td className="px-4 py-4 align-middle text-sm text-zinc-300">
                      {coupon.discountType === "percentage"
                        ? `${coupon.discountValue}%`
                        : formatKES(Math.round(coupon.discountValue))}
                    </td>
                    <td className="px-4 py-4 align-middle text-sm text-zinc-300">
                      {coupon.minOrderAmount !== null && coupon.minOrderAmount !== undefined
                        ? formatKES(Math.round(coupon.minOrderAmount))
                        : "None"}
                    </td>
                    <td className="px-4 py-4 align-middle text-sm text-zinc-300">
                      {coupon.expiresAt
                        ? new Date(coupon.expiresAt).toLocaleDateString("en-KE", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "No expiry"}
                    </td>
                    <td className="px-4 py-4 align-middle text-sm text-zinc-300">
                      {coupon.usedCount} / {coupon.maxUsage ?? "Unlimited"}
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          coupon.isActive
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {coupon.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCoupon(coupon);
                            setDialogOpen(true);
                          }}
                          className="rounded-xl border border-zinc-800 p-2 text-zinc-300 transition-colors hover:border-brand-400 hover:text-white"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => void handleDelete(coupon)}
                          className="rounded-xl border border-zinc-800 p-2 text-zinc-300 transition-colors hover:border-red-400 hover:text-red-400 disabled:opacity-50"
                        >
                          {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-brand-500/15 p-3 text-brand-300">
            <TicketPercent className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-sm text-zinc-400">
            <p className="font-semibold text-zinc-100">Checkout behavior</p>
            <p>
              Valid coupons are checked against active status, minimum order, expiry, and usage
              limits before checkout applies them.
            </p>
          </div>
        </div>
      </div>

      <CouponFormDialog
        open={dialogOpen}
        coupon={editingCoupon}
        onOpenChange={setDialogOpen}
        onSaved={handleSavedCoupon}
      />
    </div>
  );
}
