"use client";

import { useState, useTransition } from "react";
import { Loader2, Mail, Phone, ShieldCheck, Save, Bell } from "lucide-react";
import {
  type AdminStoreSettingsInput,
  updateAdminStoreSettingsAction,
} from "@/app/admin/settings/actions";
import { useToast } from "@/lib/use-toast";
import type { StoreSettings } from "@/types";

export function StoreSettingsForm({ initialSettings }: { initialSettings: StoreSettings | null }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<AdminStoreSettingsInput>({
    supportEmail: initialSettings?.supportEmail || "",
    supportPhone: initialSettings?.supportPhone || "",
    adminNotificationEmail: initialSettings?.adminNotificationEmail || "",
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(() => {
      void (async () => {
        try {
          await updateAdminStoreSettingsAction(form);
          toast({
            title: "Store settings saved",
            description: "Support contacts and admin notifications updated across the storefront.",
          });
        } catch (error) {
          toast({
            title: "Save failed",
            description: error instanceof Error ? error.message : "Please try again.",
            variant: "destructive",
          });
        }
      })();
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-400">
          Trust & Support
        </p>
        <h1 className="mt-2 text-3xl font-black text-white">Store Settings</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Control customer-facing support details and where new order alerts get delivered.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr),340px]"
      >
        <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900 p-6 space-y-4">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-zinc-300 flex items-center gap-2">
              <Mail className="h-4 w-4 text-brand-400" />
              Customer Support Email
            </span>
            <input
              required
              type="email"
              value={form.supportEmail}
              onChange={(event) =>
                setForm((current) => ({ ...current, supportEmail: event.target.value }))
              }
              placeholder="support@smarteststore.ke"
              className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-zinc-300 flex items-center gap-2">
              <Phone className="h-4 w-4 text-brand-400" />
              Customer Support Phone
            </span>
            <input
              required
              value={form.supportPhone}
              onChange={(event) =>
                setForm((current) => ({ ...current, supportPhone: event.target.value }))
              }
              placeholder="+254700123456"
              className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
            />
            <p className="text-xs text-zinc-500">
              Displayed in the storefront footer and used in email footers (tap-to-call friendly).
            </p>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-zinc-300 flex items-center gap-2">
              <Bell className="h-4 w-4 text-brand-400" />
              Admin Notification Email
            </span>
            <input
              required
              type="email"
              value={form.adminNotificationEmail}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  adminNotificationEmail: event.target.value,
                }))
              }
              placeholder="orders@smarteststore.ke"
              className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
            />
            <p className="text-xs text-zinc-500">
              New order alerts will be sent here right after payment succeeds.
            </p>
          </label>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isPending ? "Saving..." : "Save settings"}
            </button>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-emerald-500/20 bg-emerald-500/10 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_0_25px_rgba(34,197,94,0.3)]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.24em] text-emerald-300">
            Live Preview
          </p>
          <p className="mt-3 text-lg font-black text-white">Footer contact</p>
          <div className="mt-3 rounded-[1.5rem] bg-black/20 p-4 text-sm text-emerald-50/90 space-y-2">
            <p>Email: {form.supportEmail || "support@smarteststore.ke"}</p>
            <p>Phone: {form.supportPhone || "+254 700 123 456"}</p>
            <p>Admin alerts: {form.adminNotificationEmail || "orders@smarteststore.ke"}</p>
          </div>
          <p className="mt-4 text-xs text-emerald-200/80">
            These values power trust badges, footer contact, and email notification routing.
          </p>
        </div>
      </form>
    </div>
  );
}
