"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Bell,
  ImagePlus,
  Loader2,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Store,
  Trash2,
} from "lucide-react";
import {
  type AdminStoreSettingsInput,
  submitAdminStoreSettingsFormAction,
  type SaveSettingsFormState,
} from "@/app/admin/settings/actions";
import { DEFAULT_STORE_SETTINGS } from "@/lib/default-store-settings";
import { useToast } from "@/lib/use-toast";
import { cn } from "@/lib/utils";
import type { StoreSettings } from "@/types";

type BrandingSlot = "logoUrl" | "logoDarkUrl" | "faviconUrl";

const SLOT_CONFIG: Array<{
  key: BrandingSlot;
  label: string;
  description: string;
  recommendedSize: string;
  accept: string;
}> = [
  {
    key: "logoUrl",
    label: "Primary Logo",
    description: "Shown in the navbar for light mode storefront sessions.",
    recommendedSize: "200 x 60px",
    accept: ".png,.jpg,.jpeg,.svg",
  },
  {
    key: "logoDarkUrl",
    label: "Dark Mode Logo",
    description: "Optional. Falls back to the primary logo when unset.",
    recommendedSize: "200 x 60px",
    accept: ".png,.jpg,.jpeg,.svg",
  },
  {
    key: "faviconUrl",
    label: "Favicon",
    description: "Used in the browser tab and saved bookmarks.",
    recommendedSize: "32 x 32px or 64 x 64px",
    accept: ".png,.jpg,.jpeg,.svg,.ico",
  },
];

function buildInitialForm(settings: StoreSettings | null): AdminStoreSettingsInput {
  const resolvedSettings = settings ?? DEFAULT_STORE_SETTINGS;

  return {
    storeName: resolvedSettings.storeName ?? DEFAULT_STORE_SETTINGS.storeName ?? "",
    storeTagline: resolvedSettings.storeTagline ?? DEFAULT_STORE_SETTINGS.storeTagline ?? "",
    logoUrl: resolvedSettings.logoUrl || "",
    logoDarkUrl: resolvedSettings.logoDarkUrl || "",
    faviconUrl: resolvedSettings.faviconUrl || "",
    supportEmail: resolvedSettings.supportEmail || "",
    supportPhone: resolvedSettings.supportPhone || "",
    adminNotificationEmail: resolvedSettings.adminNotificationEmail || "",
    contactPhone: resolvedSettings.contactPhone || resolvedSettings.supportPhone || "",
    footerContactPhone:
      resolvedSettings.footerContactPhone || resolvedSettings.contactPhone || "",
  };
}

export function StoreSettingsForm({
  initialSettings,
  showHeading = true,
}: {
  initialSettings: StoreSettings | null;
  showHeading?: boolean;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<AdminStoreSettingsInput>(() => buildInitialForm(initialSettings));
  const [actionState, formAction] = useActionState<SaveSettingsFormState, FormData>(
    submitAdminStoreSettingsFormAction,
    { success: false, error: null, data: null }
  );
  const [uploadingSlot, setUploadingSlot] = useState<BrandingSlot | null>(null);
  const [removingSlot, setRemovingSlot] = useState<BrandingSlot | null>(null);
  const fileInputRefs = useRef<Record<BrandingSlot, HTMLInputElement | null>>({
    logoUrl: null,
    logoDarkUrl: null,
    faviconUrl: null,
  });

  const updateForm = (patch: Partial<AdminStoreSettingsInput>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  useEffect(() => {
    if (!actionState.data && !actionState.error) {
      return;
    }

    if (actionState.success && actionState.data) {
      setForm(buildInitialForm(actionState.data));
      router.refresh();
      toast({
        title: "Store settings saved",
        description: "Branding, support details, and storefront labels are now updated.",
      });
      return;
    }

    if (actionState.error) {
      toast({
        title: "Save failed",
        description: actionState.error,
        variant: "destructive",
      });
    }
  }, [actionState, router, toast]);

  useEffect(() => {
    setForm(buildInitialForm(initialSettings));
  }, [initialSettings]);

  const handleUpload = async (slot: BrandingSlot, file?: File | null) => {
    if (!file) {
      return;
    }

    setUploadingSlot(slot);
    try {
      const payload = new FormData();
      payload.append("slot", slot);
      payload.append("file", file);
      payload.append("previousUrl", form[slot] || "");

      const response = await fetch("/api/admin/store-settings", {
        method: "POST",
        body: payload,
      });
      const data = await response.json();

      if (!response.ok || !data?.data) {
        throw new Error(data?.error || "Upload failed");
      }

      setForm(buildInitialForm(data.data));
      router.refresh();
      toast({
        title: "Asset uploaded",
        description: `${SLOT_CONFIG.find((item) => item.key === slot)?.label} updated successfully.`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingSlot(null);
      const input = fileInputRefs.current[slot];
      if (input) {
        input.value = "";
      }
    }
  };

  const handleRemove = async (slot: BrandingSlot) => {
    if (!form[slot]) {
      return;
    }

    setRemovingSlot(slot);
    try {
      const response = await fetch("/api/admin/store-settings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot,
          previousUrl: form[slot],
        }),
      });
      const data = await response.json();

      if (!response.ok || !data?.data) {
        throw new Error(data?.error || "Remove failed");
      }

      setForm(buildInitialForm(data.data));
      router.refresh();
      toast({
        title: "Asset removed",
        description: `${SLOT_CONFIG.find((item) => item.key === slot)?.label} removed.`,
      });
    } catch (error) {
      toast({
        title: "Remove failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setRemovingSlot(null);
    }
  };

  return (
    <div className="space-y-6">
      {showHeading && (
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-400">
            Brand & Support
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">Store Settings</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Control storefront branding, public contact details, and admin notification routing.
          </p>
        </div>
      )}

      <form action={formAction} className="grid gap-6 lg:grid-cols-[minmax(0,1fr),340px]">
        <div className="space-y-6">
          <section className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-300">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Store Branding</h3>
                <p className="mt-1 text-sm text-zinc-400">
                  Upload logos for light and dark mode, plus the storefront favicon.
                </p>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              {SLOT_CONFIG.map((slot) => {
                const previewUrl = form[slot.key];
                const busy = uploadingSlot === slot.key || removingSlot === slot.key;

                return (
                  <div
                    key={slot.key}
                    className="rounded-[1.5rem] border border-zinc-800 bg-zinc-950/90 p-4"
                  >
                    <div
                      className={cn(
                        "relative flex h-36 items-center justify-center overflow-hidden rounded-[1.25rem] border border-dashed border-zinc-700 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900",
                        slot.key === "faviconUrl" && "h-28"
                      )}
                    >
                      {previewUrl ? (
                        <Image
                          src={previewUrl}
                          alt={slot.label}
                          fill
                          sizes="(max-width: 1280px) 100vw, 320px"
                          className={cn(
                            "object-contain p-4",
                            slot.key === "logoDarkUrl" && "dark:bg-zinc-950"
                          )}
                        />
                      ) : (
                        <div className="text-center">
                          <ImagePlus className="mx-auto h-8 w-8 text-zinc-600" />
                          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                            No asset
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-black text-white">{slot.label}</p>
                      <p className="text-xs text-zinc-400">{slot.description}</p>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                        Recommended: {slot.recommendedSize}
                      </p>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <input
                        ref={(node) => {
                          fileInputRefs.current[slot.key] = node;
                        }}
                        type="file"
                        accept={slot.accept}
                        className="hidden"
                        onChange={(event) => {
                          void handleUpload(slot.key, event.target.files?.[0]);
                        }}
                      />
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => fileInputRefs.current[slot.key]?.click()}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {uploadingSlot === slot.key ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ImagePlus className="h-4 w-4" />
                        )}
                        Upload
                      </button>
                      <button
                        type="button"
                        disabled={!previewUrl || busy}
                        onClick={() => void handleRemove(slot.key)}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-red-500/50 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {removingSlot === slot.key ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900 p-6 space-y-4">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300 flex items-center gap-2">
                <Store className="h-4 w-4 text-brand-400" />
                Store Name
              </span>
              <input
                required
                name="storeName"
                value={form.storeName}
                onChange={(event) => updateForm({ storeName: event.target.value })}
                placeholder="Smartest Store KE"
                className="w-full rounded-2xl border border-zinc-700 bg-black px-4 py-3 text-zinc-100 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300 flex items-center gap-2">
                <Store className="h-4 w-4 text-brand-400" />
                Store Tagline
              </span>
              <input
                required
                name="storeTagline"
                value={form.storeTagline}
                onChange={(event) => updateForm({ storeTagline: event.target.value })}
                placeholder="Kenya's smartest fashion destination"
                className="w-full rounded-2xl border border-zinc-700 bg-black px-4 py-3 text-zinc-100 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
              />
            </label>

            <input type="hidden" name="logoUrl" value={form.logoUrl || ""} readOnly />
            <input type="hidden" name="logoDarkUrl" value={form.logoDarkUrl || ""} readOnly />
            <input type="hidden" name="faviconUrl" value={form.faviconUrl || ""} readOnly />
            <input type="hidden" name="contactPhone" value={form.contactPhone || ""} readOnly />

            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300 flex items-center gap-2">
                <Mail className="h-4 w-4 text-brand-400" />
                Customer Support Email
              </span>
              <input
                required
                type="email"
                name="supportEmail"
                value={form.supportEmail}
                onChange={(event) => updateForm({ supportEmail: event.target.value })}
                placeholder="support@smarteststore.ke"
                className="w-full rounded-2xl border border-zinc-700 bg-black px-4 py-3 text-zinc-100 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300 flex items-center gap-2">
                <Phone className="h-4 w-4 text-brand-400" />
                Customer Support Phone
              </span>
              <input
                required
                name="supportPhone"
                value={form.supportPhone}
                onChange={(event) =>
                  updateForm({
                    supportPhone: event.target.value,
                    contactPhone: event.target.value,
                  })
                }
                placeholder="+254700123456"
                className="w-full rounded-2xl border border-zinc-700 bg-black px-4 py-3 text-zinc-100 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300 flex items-center gap-2">
                <Bell className="h-4 w-4 text-brand-400" />
                Admin Notification Email
              </span>
              <input
                required
                type="email"
                name="adminNotificationEmail"
                value={form.adminNotificationEmail}
                onChange={(event) => updateForm({ adminNotificationEmail: event.target.value })}
                placeholder="orders@smarteststore.ke"
                className="w-full rounded-2xl border border-zinc-700 bg-black px-4 py-3 text-zinc-100 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300 flex items-center gap-2">
                <Phone className="h-4 w-4 text-brand-400" />
                Footer Contact Phone
              </span>
              <input
                name="footerContactPhone"
                value={form.footerContactPhone}
                onChange={(event) => updateForm({ footerContactPhone: event.target.value })}
                placeholder="+254 700 123 456"
                className="w-full rounded-2xl border border-zinc-700 bg-black px-4 py-3 text-zinc-100 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
              />
            </label>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isPending ? "Saving..." : "Save settings"}
              </button>
            </div>
          </section>
        </div>

        <div className="rounded-[1.75rem] border border-emerald-500/20 bg-emerald-500/10 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_0_25px_rgba(34,197,94,0.3)]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.24em] text-emerald-300">
            Live Preview
          </p>
          <p className="mt-3 text-lg font-black text-white">{form.storeName}</p>
          <p className="mt-1 text-sm text-emerald-100/90">{form.storeTagline}</p>
          <div className="mt-4 rounded-[1.5rem] bg-black/20 p-4 text-sm text-emerald-50/90 space-y-2">
            <p>Email: {form.supportEmail || "support@smarteststore.ke"}</p>
            <p>Phone: {form.supportPhone || "+254 700 123 456"}</p>
            <p>
              Contact:{" "}
              {form.footerContactPhone || form.contactPhone || form.supportPhone || "+254 700 123 456"}
            </p>
            <p>Admin alerts: {form.adminNotificationEmail || "orders@smarteststore.ke"}</p>
          </div>
          <p className="mt-4 text-xs text-emerald-200/80">
            Uploads are stored in the `store-assets` bucket and reflected in the navbar and favicon.
          </p>
        </div>
      </form>
    </div>
  );
}
