"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import {
  createAdminCouponAction,
  updateAdminCouponAction,
  type AdminCouponInput,
} from "@/app/admin/coupons/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/lib/use-toast";
import type { Coupon } from "@/types";

type CouponFormState = {
  id?: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: string;
  minOrderAmount: string;
  maxUsage: string;
  expiresAt: string;
  isActive: boolean;
};

function formatDateForInput(value?: string | Date | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function createEmptyFormState(): CouponFormState {
  return {
    code: "",
    discountType: "percentage",
    discountValue: "",
    minOrderAmount: "",
    maxUsage: "",
    expiresAt: "",
    isActive: true,
  };
}

function createFormState(coupon?: Coupon | null): CouponFormState {
  if (!coupon) {
    return createEmptyFormState();
  }

  return {
    id: coupon.id,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: String(coupon.discountValue),
    minOrderAmount:
      coupon.minOrderAmount !== null && coupon.minOrderAmount !== undefined
        ? String(coupon.minOrderAmount)
        : "",
    maxUsage:
      coupon.maxUsage !== null && coupon.maxUsage !== undefined
        ? String(coupon.maxUsage)
        : "",
    expiresAt: formatDateForInput(coupon.expiresAt),
    isActive: coupon.isActive,
  };
}

function toPayload(form: CouponFormState): AdminCouponInput {
  return {
    id: form.id,
    code: form.code.trim(),
    discountType: form.discountType,
    discountValue: Number(form.discountValue),
    minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
    maxUsage: form.maxUsage ? Number(form.maxUsage) : null,
    expiresAt: form.expiresAt,
    isActive: form.isActive,
  };
}

export function CouponFormDialog({
  open,
  coupon,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  coupon: Coupon | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (coupon: Coupon) => void;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<CouponFormState>(() => createFormState(coupon));

  useEffect(() => {
    setForm(createFormState(coupon));
  }, [coupon, open]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(() => {
      void (async () => {
        try {
          const payload = toPayload(form);
          const savedCoupon = form.id
            ? await updateAdminCouponAction(payload)
            : await createAdminCouponAction(payload);

          onSaved(savedCoupon);
          onOpenChange(false);
          toast({
            title: form.id ? "Coupon updated" : "Coupon created",
            description: "Checkout will reflect this coupon configuration immediately.",
          });
        } catch (error) {
          toast({
            title: "Save failed",
            description:
              error instanceof Error ? error.message : "Please review the form and try again.",
            variant: "destructive",
          });
        }
      })();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-zinc-800 bg-zinc-950 text-zinc-100">
        <DialogHeader>
          <DialogTitle>{coupon ? "Edit coupon" : "Create coupon"}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Launch discount codes and limited offers without touching checkout code.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300">Coupon code</span>
              <input
                required
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))
                }
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100 uppercase"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300">Discount type</span>
              <select
                value={form.discountType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    discountType: event.target.value as Coupon["discountType"],
                  }))
                }
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300">
                {form.discountType === "percentage" ? "Discount %" : "Discount value (KSh)"}
              </span>
              <input
                required
                min="0"
                step="0.01"
                type="number"
                value={form.discountValue}
                onChange={(event) =>
                  setForm((current) => ({ ...current, discountValue: event.target.value }))
                }
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300">Minimum order (optional)</span>
              <input
                min="0"
                step="0.01"
                type="number"
                value={form.minOrderAmount}
                onChange={(event) =>
                  setForm((current) => ({ ...current, minOrderAmount: event.target.value }))
                }
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300">Max uses (optional)</span>
              <input
                min="0"
                step="1"
                type="number"
                value={form.maxUsage}
                onChange={(event) =>
                  setForm((current) => ({ ...current, maxUsage: event.target.value }))
                }
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300">Expiry date (optional)</span>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(event) =>
                  setForm((current) => ({ ...current, expiresAt: event.target.value }))
                }
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              />
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300 md:col-span-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((current) => ({ ...current, isActive: event.target.checked }))
                }
              />
              Active at checkout
            </label>
          </div>

          <div className="rounded-[1.75rem] border border-zinc-800 bg-black/50 p-5 text-sm text-zinc-400">
            <p className="font-medium text-zinc-300">Preview</p>
            <p className="mt-3 text-base font-semibold text-white">{form.code || "CODE"}</p>
            <p className="mt-2">
              {form.discountType === "percentage"
                ? `${form.discountValue || "0"}% off`
                : `KSh ${form.discountValue || "0"} off`}
            </p>
            <p className="mt-1">
              {form.minOrderAmount ? `Minimum order: KSh ${form.minOrderAmount}` : "No minimum order"}
            </p>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isPending ? "Saving..." : coupon ? "Save changes" : "Create coupon"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
