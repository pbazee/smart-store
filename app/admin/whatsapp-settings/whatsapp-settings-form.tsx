"use client";

import { useState, useTransition } from "react";
import { Loader2, MessageCircleMore, Save } from "lucide-react";
import {
  updateAdminWhatsAppSettingsAction,
  type AdminWhatsAppSettingsInput,
} from "@/app/admin/whatsapp-settings/actions";
import { useToast } from "@/lib/use-toast";
import type { WhatsAppSettings } from "@/types";

export function WhatsAppSettingsForm({
  initialSettings,
  showHeading = true,
}: {
  initialSettings: WhatsAppSettings | null;
  showHeading?: boolean;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<AdminWhatsAppSettingsInput>({
    phoneNumber: initialSettings?.phoneNumber || "",
    defaultMessage: initialSettings?.defaultMessage || "",
    isActive: initialSettings?.isActive ?? true,
    position: initialSettings?.position ?? "right",
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(() => {
      void (async () => {
        const result = await updateAdminWhatsAppSettingsAction(form);
        if (result.success) {
          toast({
            title: "WhatsApp settings saved",
            description: "The floating chat button is now updated across the storefront.",
          });
        } else {
          toast({
            title: "Save failed",
            description: result.error || "Please try again.",
            variant: "destructive",
          });
        }
      })();
    });
  };

  return (
    <div className="space-y-6">
      {showHeading && (
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-400">
            Direct support
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">WhatsApp Settings</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Control the floating WhatsApp button, destination number, and pre-filled message.
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr),340px]"
      >
        <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900 p-6">
          <div className="grid gap-4">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300">WhatsApp phone number</span>
              <input
                required
                value={form.phoneNumber}
                onChange={(event) =>
                  setForm((current) => ({ ...current, phoneNumber: event.target.value }))
                }
                placeholder="+254700000000"
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300">Default message</span>
              <textarea
                required
                rows={5}
                value={form.defaultMessage}
                onChange={(event) =>
                  setForm((current) => ({ ...current, defaultMessage: event.target.value }))
                }
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300">Widget position</span>
              <select
                value={form.position}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    position: event.target.value as AdminWhatsAppSettingsInput["position"],
                  }))
                }
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              >
                <option value="right">Bottom right</option>
                <option value="left">Bottom left</option>
              </select>
              <p className="text-xs text-zinc-500">
                Choose which side of the storefront the floating WhatsApp shortcut should sit on.
              </p>
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((current) => ({ ...current, isActive: event.target.checked }))
                }
              />
              Enable floating WhatsApp widget
            </label>
          </div>

          <div className="mt-6 flex justify-end">
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
            <MessageCircleMore className="h-6 w-6" />
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.24em] text-emerald-300">
            Preview
          </p>
          <p className="mt-3 text-lg font-black text-white">
            {form.isActive ? "Widget enabled" : "Widget disabled"}
          </p>
          <p className="mt-3 text-sm text-emerald-100/80">
            {form.phoneNumber || "No phone number set"}
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/70">
            {form.position === "left" ? "Bottom left" : "Bottom right"}
          </p>
          <p className="mt-4 rounded-[1.5rem] bg-black/20 p-4 text-sm text-emerald-50/90">
            {form.defaultMessage || "The saved default message will appear here."}
          </p>
        </div>
      </form>
    </div>
  );
}
