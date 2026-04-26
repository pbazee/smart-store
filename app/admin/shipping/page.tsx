"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  MapPin,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { InlineLoader } from "@/components/ui/ripple-loader";
import { jsonFetcher } from "@/lib/fetcher";
import { KENYA_COUNTIES } from "@/lib/kenya-counties";
import { useToast } from "@/lib/use-toast";

type ShippingZone = {
  id?: number | string;
  name: string;
  county?: string;
  counties: string[];
  deliveryFeeKES: number;
  estimatedDays: number;
  freeAboveKES?: number | null;
  isActive: boolean;
};

type ShippingZonesResponse = {
  success: boolean;
  data: ShippingZone[];
};

const DEFAULT_ZONES: ShippingZone[] = [
  {
    name: "Nairobi Express",
    county: "Nairobi",
    counties: ["Nairobi"],
    deliveryFeeKES: 150,
    estimatedDays: 1,
    freeAboveKES: 5000,
    isActive: true,
  },
];

function createEmptyZone(): ShippingZone {
  return {
    name: "",
    county: "",
    counties: [],
    deliveryFeeKES: 0,
    estimatedDays: 1,
    freeAboveKES: null,
    isActive: true,
  };
}

function isZoneValid(zone: ShippingZone) {
  return Boolean(
    zone.name.trim() &&
      zone.counties.length > 0 &&
      Number.isFinite(zone.deliveryFeeKES) &&
      zone.deliveryFeeKES >= 0 &&
      Number.isFinite(zone.estimatedDays) &&
      zone.estimatedDays > 0
  );
}

export default function ShippingAdminPage() {
  const { toast } = useToast();
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [saving, setSaving] = useState(false);
  const { data, error, isLoading, mutate } = useSWR<ShippingZonesResponse>(
    "/api/admin/shipping-zones",
    jsonFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300_000,
    }
  );

  useEffect(() => {
    if (data?.data?.length) {
      setZones(data.data);
      return;
    }

    if (!isLoading && !data?.data?.length) {
      setZones(DEFAULT_ZONES);
    }
  }, [data, isLoading]);

  const updateZone = (index: number, patch: Partial<ShippingZone>) => {
    setZones((current) =>
      current.map((zone, zoneIndex) =>
        zoneIndex === index
          ? {
              ...zone,
              ...patch,
              county: patch.counties?.[0] ?? patch.county ?? zone.counties[0] ?? zone.county,
            }
          : zone
      )
    );
  };

  const addCountyToZone = (index: number, county: string) => {
    if (!county) {
      return;
    }

    setZones((current) =>
      current.map((zone, zoneIndex) => {
        if (zoneIndex !== index || zone.counties.includes(county)) {
          return zone;
        }

        const counties = [...zone.counties, county];
        return {
          ...zone,
          counties,
          county: counties[0],
        };
      })
    );
  };

  const removeCountyFromZone = (index: number, county: string) => {
    setZones((current) =>
      current.map((zone, zoneIndex) => {
        if (zoneIndex !== index) {
          return zone;
        }

        const counties = zone.counties.filter((item) => item !== county);
        return {
          ...zone,
          counties,
          county: counties[0] ?? "",
        };
      })
    );
  };

  const addZone = () => {
    setZones((current) => [...current, createEmptyZone()]);
  };

  const removeZone = async (index: number) => {
    const target = zones[index];
    const confirmed = window.confirm("Delete this shipping zone?");
    if (!confirmed) {
      return;
    }

    if (target?.id) {
      try {
        const response = await fetch(`/api/admin/shipping-zones/${target.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Delete failed");
        }
      } catch (error) {
        toast({
          title: "Delete failed",
          description: "The shipping zone could not be deleted right now.",
          variant: "destructive",
        });
        return;
      }
    }

    const nextZones = zones.filter((_, zoneIndex) => zoneIndex !== index);
    setZones(nextZones);
    await mutate({ success: true, data: nextZones }, { revalidate: false });
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const payload = zones.map((zone) => ({
        ...zone,
        county: zone.counties[0] ?? zone.county ?? "",
        counties: zone.counties,
        freeAboveKES: zone.freeAboveKES || null,
      }));

      const response = await fetch("/api/admin/shipping-zones", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zones: payload }),
      });
      const result = (await response.json().catch(() => null)) as ShippingZonesResponse | null;

      if (!response.ok || !result?.data) {
        throw new Error("Failed to save shipping zones");
      }

      setZones(result.data);
      await mutate(result, { revalidate: false });
      toast({
        title: "Shipping zones saved",
        description: "County-based checkout delivery rules are now live.",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Could not save shipping zones.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading && zones.length === 0) {
    return <InlineLoader label="Loading shipping zones..." />;
  }

  if (error && zones.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-zinc-800 bg-zinc-900/40 px-6 py-16 text-center">
        <h1 className="text-2xl font-black text-white">Could not load shipping zones</h1>
        <p className="mt-3 text-sm text-zinc-400">
          The editor could not refresh shipping data right now.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Shipping Zones</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Kenya-only delivery setup. Add one county per zone or group multiple counties under the same flat fee.
          </p>
        </div>
        <button
          onClick={addZone}
          className="flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-black text-white transition-colors hover:bg-orange-600"
        >
          <Plus className="h-4 w-4" />
          Add Zone
        </button>
      </div>

      <div className="space-y-6">
        <AnimatePresence initial={false}>
          {zones.map((zone, index) => {
            const availableCounties = KENYA_COUNTIES.filter(
              (county) => !zone.counties.includes(county)
            );
            const valid = isZoneValid(zone);

            return (
              <motion.div
                key={zone.id ?? `zone-${index}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="relative rounded-[2.5rem] border border-zinc-800 bg-zinc-900/50 p-8 shadow-2xl"
              >
                <div className="absolute left-10 top-0 -translate-y-1/2">
                  <span className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    Zone #{index + 1}
                  </span>
                </div>

                <button
                  onClick={() => void removeZone(index)}
                  className="absolute right-8 top-8 rounded-full border border-zinc-700 p-2 text-zinc-400 transition hover:border-red-500 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <div className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-[minmax(0,1fr),180px,180px]">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        Zone Name
                      </label>
                      <input
                        value={zone.name}
                        onChange={(event) => updateZone(index, { name: event.target.value })}
                        placeholder="e.g. Nairobi Express"
                        className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        Fee (KES)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={zone.deliveryFeeKES}
                        onChange={(event) =>
                          updateZone(index, { deliveryFeeKES: Number(event.target.value || 0) })
                        }
                        className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        Days
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={zone.estimatedDays}
                        onChange={(event) =>
                          updateZone(index, { estimatedDays: Number(event.target.value || 1) })
                        }
                        className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),220px]">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        County
                      </label>
                      <div className="flex gap-3">
                        <select
                          value=""
                          onChange={(event) => addCountyToZone(index, event.target.value)}
                          className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="">Select a county</option>
                          {availableCounties.map((county) => (
                            <option key={county} value={county}>
                              {county}
                            </option>
                          ))}
                        </select>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-950 text-zinc-400">
                          <MapPin className="h-4 w-4" />
                        </div>
                      </div>

                      {zone.counties.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {zone.counties.map((county) => (
                            <span
                              key={county}
                              className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-100"
                            >
                              {county}
                              <button
                                type="button"
                                onClick={() => removeCountyFromZone(index, county)}
                                className="text-orange-200 transition hover:text-white"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-500">
                          Add at least one Kenya county to activate this zone in checkout.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        Free Above (KSh)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={zone.freeAboveKES ?? ""}
                        onChange={(event) =>
                          updateZone(index, {
                            freeAboveKES: event.target.value ? Number(event.target.value) : null,
                          })
                        }
                        placeholder="0 = never free"
                        className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-800 pt-6">
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={zone.isActive}
                        onChange={(event) => updateZone(index, { isActive: event.target.checked })}
                        className="h-5 w-5 rounded border-zinc-700 bg-zinc-950 accent-orange-500"
                      />
                      <span className="text-xs font-bold uppercase tracking-widest text-zinc-200">
                        Active During Checkout
                      </span>
                    </label>

                    <div
                      className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
                        valid ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {valid ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      {valid ? "Validating Live" : "Missing Required Fields"}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="sticky bottom-8 z-10 flex justify-end">
        <button
          onClick={saveAll}
          disabled={saving}
          className="flex items-center gap-3 rounded-full bg-white px-10 py-4 text-sm font-black text-black shadow-2xl transition hover:scale-[1.01] disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save All Changes
        </button>
      </div>
    </div>
  );
}
