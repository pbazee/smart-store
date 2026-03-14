"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, Trash2, Pencil, ChevronRight, ChevronDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { deleteCategoryAction, upsertCategoryAction } from "@/app/admin/categories/actions";
import { slugify } from "@/lib/utils";
import type { Category } from "@/types";
import { useToast } from "@/lib/use-toast";

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  order: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

function CategoryNode({
  category,
  byParent,
  onEdit,
  onDelete,
  saving,
}: {
  category: Category;
  byParent: Map<string | null, Category[]>;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  saving: boolean;
}) {
  const children = byParent.get(category.id) || [];
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-2 text-left text-sm text-zinc-200"
        >
          {children.length > 0 ? (
            open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          ) : (
            <span className="w-4" />
          )}
          <span className="font-semibold">{category.name}</span>
          {!category.isActive && <span className="text-xs text-amber-400">(inactive)</span>}
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(category.id)}
            className="rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-200"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => void onDelete(category.id)}
            className="rounded-lg border border-zinc-800 px-2 py-1 text-xs text-red-300"
            disabled={saving}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {open && children.length > 0 && (
        <div className="mt-2 space-y-2 pl-5">
          {children.map((child) => (
            <div key={child.id} className="border border-zinc-800 rounded-lg p-2 bg-zinc-950/60">
              <CategoryNode
                category={child}
                byParent={byParent}
                onEdit={onEdit}
                onDelete={onDelete}
                saving={saving}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoriesView({ initialCategories }: { initialCategories: Category[] }) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const byParent = useMemo(() => {
    const map = new Map<string | null, Category[]>();
    categories.forEach((c) => {
      const key = c.parentId ?? null;
      map.set(key, [...(map.get(key) || []), c]);
    });
    map.forEach((list, key) =>
      map.set(
        key,
        list.sort((a, b) =>
          (a.order ?? 0) === (b.order ?? 0)
            ? a.name.localeCompare(b.name)
            : (a.order ?? 0) - (b.order ?? 0)
        )
      )
    );
    return map;
  }, [categories]);

  const roots = byParent.get(null) || [];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { isActive: true, order: 0 },
    values:
      editing != null
        ? (categories.find((c) => c.id === editing) as any)
        : { id: undefined, name: "", slug: "", description: "", parentId: null, isActive: true, order: 0 },
  });

  const handleSave = form.handleSubmit(async (values) => {
    setSaving(true);
    try {
      const payload = { ...values, slug: slugify(values.slug || values.name) };
      const saved = await upsertCategoryAction(payload);
      setCategories((prev) => {
        const existing = prev.find((c) => c.id === saved.id);
        if (existing) return prev.map((c) => (c.id === saved.id ? (saved as any) : c));
        return [...prev, saved as any];
      });
      setEditing(null);
      toast({ title: "Category saved", description: saved.name });
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  });

  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      await deleteCategoryAction(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      if (editing === id) setEditing(null);
      toast({ title: "Category deleted" });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="font-bold mb-2">{editing ? "Edit Category" : "Add Category"}</h2>
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="text-sm text-zinc-300">Name</label>
            <input
              {...form.register("name")}
              className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="text-sm text-zinc-300">Slug</label>
            <input
              {...form.register("slug")}
              className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="text-sm text-zinc-300">Description</label>
            <textarea
              rows={2}
              {...form.register("description")}
              className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="text-sm text-zinc-300">Parent</label>
            <select
              {...form.register("parentId", { setValueAs: (v) => (v === "" ? null : v) })}
              className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white"
            >
              <option value="">Top-level</option>
              {roots.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm text-zinc-300">Order</label>
              <input
                type="number"
                {...form.register("order")}
                className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white"
              />
            </div>
            <label className="flex items-center gap-2 mt-6 text-sm text-zinc-200">
              <input type="checkbox" {...form.register("isActive")} />
              Active
            </label>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Save
          </button>
        </form>
      </div>

      <div className="space-y-3">
        {roots.length === 0 ? (
          <p className="text-sm text-zinc-400">No categories yet.</p>
        ) : (
          roots.map((c) => (
            <CategoryNode
              key={c.id}
              category={c}
              byParent={byParent}
              onEdit={setEditing}
              onDelete={handleDelete}
              saving={saving}
            />
          ))
        )}
      </div>
    </div>
  );
}
