"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, Save, Trash, Pencil, MapPin, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  deleteShippingRuleAction,
  upsertShippingRuleAction,
} from "@/app/admin/shipping-rules/actions";
import { useToast } from "@/lib/use-toast";
import type { ShippingRule } from "@/types";
import { formatKES } from "@/lib/utils";

const formSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(3, "Name is required"),
  description: z.string().optional(),
  locationScope: z.enum(["Nairobi", "Kenya", "Other"]),
  minOrderAmount: z
    .union([z.string().optional(), z.number().optional()])
    .transform((val) => {
      const parsed = Number(val);
      if (!val || Number.isNaN(parsed)) return null;
      return parsed;
    })
    .nullable(),
  cost: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => !Number.isNaN(val) && val >= 0, "Cost must be 0 or higher"),
  isActive: z.boolean().default(true),
  priority: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => Number.isInteger(val), "Priority must be a whole number"),
});

type FormValues = z.infer<typeof formSchema>;

export function ShippingRulesView({ initialRules }: { initialRules: ShippingRule[] }) {
  const { toast } = useToast();
  const [rules, setRules] = useState<ShippingRule[]>(initialRules);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const currentEditRule = useMemo(
    () => rules.find((rule) => rule.id === editingId),
    [rules, editingId]
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      locationScope: "Nairobi",
      minOrderAmount: null,
      cost: 0,
      isActive: true,
      priority: 0,
    },
    values: currentEditRule
      ? {
          id: currentEditRule.id,
          name: currentEditRule.name,
          description: currentEditRule.description ?? "",
          locationScope: currentEditRule.locationScope as "Nairobi" | "Kenya" | "Other",
          minOrderAmount: currentEditRule.minOrderAmount ?? null,
          cost: currentEditRule.cost,
          isActive: currentEditRule.isActive,
          priority: currentEditRule.priority,
        }
      : undefined,
  });

  const onSubmit = async (values: FormValues) => {
    setIsSaving(true);
    try {
      const saved = await upsertShippingRuleAction({
        ...values,
        minOrderAmount: values.minOrderAmount,
      });
      setRules((prev) => {
        const exists = prev.find((rule) => rule.id === saved.id);
        if (exists) {
          return prev.map((rule) => (rule.id === saved.id ? (saved as ShippingRule) : rule));
        }
        return [saved as ShippingRule, ...prev];
      });
      setEditingId(null);
      reset({
        locationScope: "Nairobi",
        isActive: true,
        priority: 0,
        name: "",
        description: "",
        minOrderAmount: null,
        cost: 0,
      });
      toast({ title: "Shipping rule saved", description: saved.name });
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (rule: ShippingRule) => {
    setEditingId(rule.id);
  };

  const handleDelete = async (id: number) => {
    setIsSaving(true);
    try {
      await deleteShippingRuleAction(id);
      setRules((prev) => prev.filter((rule) => rule.id !== id));
      if (editingId === id) {
        setEditingId(null);
      }
      toast({ title: "Deleted", description: "Shipping rule removed" });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const scopeBadge = (scope: string) => {
    const base = "rounded-full px-3 py-1 text-xs font-semibold border";
    if (scope.toLowerCase() === "nairobi") return `${base} bg-green-500/10 text-green-300 border-green-500/30`;
    if (scope.toLowerCase() === "kenya") return `${base} bg-blue-500/10 text-blue-300 border-blue-500/30`;
    return `${base} bg-amber-500/10 text-amber-200 border-amber-500/30`;
  };

  const sortedRules = [...rules].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-400">
            Shipping Intelligence
          </p>
          <h1 className="mt-1 text-3xl font-black text-white">Shipping Rules</h1>
          <p className="text-sm text-zinc-400">
            Location-based pricing for Kenya — prioritize Nairobi, free thresholds, and tiered upcountry.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-400">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          Priority applies top-down
        </div>
      </div>

      <div className="grid lg:grid-cols-[360px,minmax(0,1fr)] gap-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="h-4 w-4 text-brand-400" />
            <p className="font-semibold text-sm">{editingId ? "Edit rule" : "Add new rule"}</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm text-zinc-300">Name</label>
              <input
                {...register("name")}
                className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white"
                placeholder="Free Nairobi Same-Day"
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm text-zinc-300">Description</label>
              <textarea
                {...register("description")}
                rows={2}
                className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white"
                placeholder="Displayed to admins only"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-zinc-300">Location scope</label>
              <select
                {...register("locationScope")}
                className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white"
              >
                <option value="Nairobi">Nairobi</option>
                <option value="Kenya">Kenya (all counties)</option>
                <option value="Other">Other (fallback)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm text-zinc-300">Min order (KSh)</label>
                <input
                  {...register("minOrderAmount")}
                  type="number"
                  step="100"
                  min="0"
                  className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white"
                  placeholder="e.g. 5000 for free shipping"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-zinc-300">Cost (KSh)</label>
                <input
                  {...register("cost")}
                  type="number"
                  step="50"
                  min="0"
                  className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white"
                  placeholder="0 for free"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm text-zinc-300">Priority</label>
                <input
                  {...register("priority")}
                  type="number"
                  step="1"
                  className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white"
                  placeholder="Higher runs first"
                />
              </div>
              <label className="flex items-center gap-3 text-sm text-zinc-300 mt-6">
                <input type="checkbox" {...register("isActive")} className="accent-brand-500 h-4 w-4" />
                Active
              </label>
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editingId ? "Update rule" : "Save rule"}
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <MapPin className="h-4 w-4 text-brand-400" />
              <span>Priority order (top first)</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="pb-3 pr-4 text-left">Name</th>
                  <th className="pb-3 pr-4 text-left">Scope</th>
                  <th className="pb-3 pr-4 text-left">Min</th>
                  <th className="pb-3 pr-4 text-left">Cost</th>
                  <th className="pb-3 pr-4 text-left">Priority</th>
                  <th className="pb-3 pr-4 text-left">Active</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {sortedRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-zinc-900/50">
                    <td className="py-3 pr-4 font-semibold text-white">{rule.name}</td>
                    <td className="py-3 pr-4">
                      <span className={scopeBadge(rule.locationScope)}>{rule.locationScope}</span>
                    </td>
                    <td className="py-3 pr-4 text-zinc-300">
                      {rule.minOrderAmount ? formatKES(rule.minOrderAmount) : "—"}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-brand-400">
                      {rule.cost === 0 ? "Free" : formatKES(rule.cost)}
                    </td>
                    <td className="py-3 pr-4 text-zinc-300">{rule.priority}</td>
                    <td className="py-3 pr-4 text-zinc-300">{rule.isActive ? "Yes" : "No"}</td>
                    <td className="py-3 pr-2 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(rule)}
                          className="rounded-lg border border-zinc-800 px-2 py-1 text-xs text-zinc-300 hover:border-brand-500 hover:text-brand-300"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(rule.id)}
                          className="rounded-lg border border-zinc-800 px-2 py-1 text-xs text-zinc-300 hover:border-red-500 hover:text-red-300"
                          disabled={isSaving}
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {sortedRules.length === 0 && (
            <div className="text-center text-sm text-zinc-500 py-8">No shipping rules yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
