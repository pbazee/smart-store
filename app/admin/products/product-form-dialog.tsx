"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  createAdminProductAction,
  updateAdminProductAction,
  type AdminProductInput,
} from "@/app/admin/products/actions";
import { useToast } from "@/lib/use-toast";
import { slugify } from "@/lib/utils";
import type { Product, Category } from "@/types";

type VariantFormState = {
  id?: string;
  color: string;
  colorHex: string;
  size: string;
  stock: string;
  price: string;
};

type ProductFormState = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  category: Product["category"]; // legacy
  subcategory: string; // legacy
  categoryId?: string | null;
  parentId?: string | null;
  subcategoryId?: string | null;
  gender: Product["gender"];
  basePrice: string;
  images: string[];
  tags: string;
  isFeatured: boolean;
  isNew: boolean;
  variants: VariantFormState[];
};

const defaultVariant: VariantFormState = {
  color: "Black",
  colorHex: "#111111",
  size: "M",
  stock: "12",
  price: "",
};

function createEmptyFormState(): ProductFormState {
  return {
    name: "",
    slug: "",
    description: "",
    category: "clothes",
    subcategory: "Streetwear",
    categoryId: null,
    parentId: null,
    subcategoryId: null,
    gender: "unisex",
    basePrice: "",
    images: [],
    tags: "trending, nairobi",
    isFeatured: false,
    isNew: true,
    variants: [{ ...defaultVariant }],
  };
}

function createFormState(product?: Product | null): ProductFormState {
  if (!product) {
    return createEmptyFormState();
  }

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    category: product.category,
    subcategory: product.subcategory,
    categoryId: product.categoryId ?? null,
    parentId: null,
    subcategoryId: null,
    gender: product.gender,
    basePrice: String(product.basePrice),
    images: product.images,
    tags: product.tags.join(", "),
    isFeatured: product.isFeatured,
    isNew: product.isNew,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      color: variant.color,
      colorHex: variant.colorHex,
      size: variant.size,
      stock: String(variant.stock),
      price: String(variant.price),
    })),
  };
}

async function readFilesAsDataUrls(files: FileList) {
  return Promise.all(
    Array.from(files).map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ""));
          reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
          reader.readAsDataURL(file);
        })
    )
  );
}

function toPayload(form: ProductFormState): AdminProductInput {
  const basePrice = Number(form.basePrice);

  return {
    id: form.id,
    name: form.name.trim(),
    slug: slugify(form.slug || form.name),
    description: form.description.trim(),
    category: form.category,
    subcategory: form.subcategory.trim(),
    categoryId: form.subcategoryId || form.parentId || null,
    gender: form.gender,
    basePrice,
    images: form.images.filter(Boolean),
    tags: form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    isFeatured: form.isFeatured,
    isNew: form.isNew,
    variants: form.variants.map((variant) => ({
      id: variant.id,
      color: variant.color.trim(),
      colorHex: variant.colorHex,
      size: variant.size.trim(),
      stock: Number(variant.stock),
      price: variant.price ? Number(variant.price) : basePrice,
    })),
  };
}

export function ProductFormDialog({
  open,
  product,
  categories,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  product: Product | null;
  categories: Category[];
  onOpenChange: (open: boolean) => void;
  onSaved: (product: Product) => void;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<ProductFormState>(() => createFormState(product));
  const [slugTouched, setSlugTouched] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");

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

  const topLevelCategories = byParent.get(null) || [];
  const childCategories = form.parentId ? byParent.get(form.parentId) || [] : [];

  useEffect(() => {
    const base = createFormState(product);
    if (product?.categoryId) {
      const cat = categories.find((c) => c.id === product.categoryId);
      if (cat) {
        const parentId = cat.parentId ?? cat.id;
        const subId = cat.parentId ? cat.id : null;
        base.parentId = parentId;
        base.subcategoryId = subId;
        base.categoryId = subId || parentId;
      }
    }
    setForm(base);
    setSlugTouched(false);
    setImageUrlInput("");
  }, [product, open, categories]);

  const updateVariant = (
    index: number,
    field: keyof VariantFormState,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [field]: value } : variant
      ),
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(() => {
      void (async () => {
        try {
          const payload = toPayload(form);
          const savedProduct = form.id
            ? await updateAdminProductAction(payload)
            : await createAdminProductAction(payload);

          onSaved(savedProduct);
          onOpenChange(false);
          toast({
            title: form.id ? "Product updated" : "Product created",
            description: `${savedProduct.name} is now live in the catalog.`,
          });
        } catch (error) {
          toast({
            title: "Product save failed",
            description: error instanceof Error ? error.message : "Please review the form and try again.",
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
          <DialogTitle>{product ? "Edit product" : "Add new product"}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Build premium product records without leaving the admin surface.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300">Name</span>
              <input
                required
                value={form.name}
                onChange={(event) => {
                  const name = event.target.value;
                  setForm((current) => ({
                    ...current,
                    name,
                    slug: slugTouched ? current.slug : slugify(name),
                  }));
                }}
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300">Slug</span>
              <input
                required
                value={form.slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  setForm((current) => ({ ...current, slug: slugify(event.target.value) }));
                }}
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              />
            </label>

            <label className="space-y-2 text-sm md:col-span-2">
              <span className="font-medium text-zinc-300">Description</span>
              <textarea
                required
                rows={5}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300">Category</span>
              <select
                value={form.parentId ?? ""}
                onChange={(event) => {
                  const parentId = event.target.value ? event.target.value : null;
                  const parent = categories.find((c) => c.id === parentId);
                  setForm((current) => ({
                    ...current,
                    parentId,
                    subcategoryId: null,
                    category: parent ? parent.slug : current.category,
                    subcategory: parent ? parent.name : current.subcategory,
                  }));
                }}
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              >
                <option value="">Select top-level</option>
                {topLevelCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300">Subcategory</span>
              <select
                value={form.subcategoryId ?? ""}
                onChange={(event) => {
                  const subId = event.target.value ? event.target.value : null;
                  const sub = categories.find((c) => c.id === subId);
                  setForm((current) => ({
                    ...current,
                    subcategoryId: subId,
                    categoryId: subId || current.parentId || null,
                    subcategory: sub ? sub.name : current.subcategory,
                  }));
                }}
                disabled={!form.parentId}
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              >
                <option value="">{form.parentId ? "Use parent only" : "Select parent first"}</option>
                {childCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300">Gender</span>
              <select
                value={form.gender}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    gender: event.target.value as Product["gender"],
                  }))
                }
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              >
                <option value="unisex">Unisex</option>
                <option value="men">Men</option>
                <option value="women">Women</option>
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300">Base price (KES)</span>
              <input
                required
                min="1"
                type="number"
                value={form.basePrice}
                onChange={(event) =>
                  setForm((current) => ({ ...current, basePrice: event.target.value }))
                }
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              />
            </label>

            <label className="space-y-2 text-sm md:col-span-2">
              <span className="font-medium text-zinc-300">Tags</span>
              <input
                value={form.tags}
                onChange={(event) =>
                  setForm((current) => ({ ...current, tags: event.target.value }))
                }
                placeholder="trending, nairobi, bestseller"
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) =>
                  setForm((current) => ({ ...current, isFeatured: event.target.checked }))
                }
              />
              Featured on homepage
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={form.isNew}
                onChange={(event) =>
                  setForm((current) => ({ ...current, isNew: event.target.checked }))
                }
              />
              Mark as new arrival
            </label>
          </div>

          <div className="rounded-[1.75rem] border border-zinc-800 bg-black/50 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold">Images</h3>
                <p className="text-sm text-zinc-400">Upload files or paste hosted image URLs.</p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200">
                <Upload className="h-4 w-4" />
                Upload
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    void (async () => {
                      const files = event.target.files;
                      if (!files?.length) return;
                      const nextImages = await readFilesAsDataUrls(files);
                      setForm((current) => ({
                        ...current,
                        images: [...current.images, ...nextImages.filter(Boolean)],
                      }));
                    })();
                  }}
                />
              </label>
            </div>

            <div className="mt-4 flex gap-3">
              <input
                value={imageUrlInput}
                onChange={(event) => setImageUrlInput(event.target.value)}
                placeholder="https://..."
                className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
              />
              <button
                type="button"
                onClick={() => {
                  if (!imageUrlInput.trim()) return;
                  setForm((current) => ({
                    ...current,
                    images: [...current.images, imageUrlInput.trim()],
                  }));
                  setImageUrlInput("");
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-950"
              >
                <ImagePlus className="h-4 w-4" />
                Add URL
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {form.images.map((image, index) => (
                <div key={`${image}-${index}`} className="relative overflow-hidden rounded-2xl border border-zinc-800">
                  <div className="relative aspect-square">
                    <Image src={image} alt="" fill className="object-cover" sizes="180px" />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        images: current.images.filter((_, imageIndex) => imageIndex !== index),
                      }))
                    }
                    className="absolute right-2 top-2 rounded-full bg-black/70 p-2 text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-zinc-800 bg-black/50 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold">Variants</h3>
                <p className="text-sm text-zinc-400">Color, swatch, size, stock, and price override.</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    variants: [...current.variants, { ...defaultVariant, color: "", price: "" }],
                  }))
                }
                className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200"
              >
                Add variant
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {form.variants.map((variant, index) => (
                <div
                  key={`${variant.id || index}-${variant.color}-${variant.size}`}
                  className="grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 md:grid-cols-[1.2fr,0.9fr,0.9fr,0.8fr,0.9fr,auto]"
                >
                  <input
                    required
                    value={variant.color}
                    onChange={(event) => updateVariant(index, "color", event.target.value)}
                    placeholder="Color name"
                    className="rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-zinc-100"
                  />
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={variant.colorHex}
                      onChange={(event) => updateVariant(index, "colorHex", event.target.value)}
                      className="h-11 w-12 rounded-xl border border-zinc-800 bg-black p-1"
                    />
                    <input
                      value={variant.colorHex}
                      onChange={(event) => updateVariant(index, "colorHex", event.target.value)}
                      className="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-zinc-100"
                    />
                  </div>
                  <input
                    required
                    value={variant.size}
                    onChange={(event) => updateVariant(index, "size", event.target.value)}
                    placeholder="Size"
                    className="rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-zinc-100"
                  />
                  <input
                    required
                    min="0"
                    type="number"
                    value={variant.stock}
                    onChange={(event) => updateVariant(index, "stock", event.target.value)}
                    placeholder="Stock"
                    className="rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-zinc-100"
                  />
                  <input
                    min="0"
                    type="number"
                    value={variant.price}
                    onChange={(event) => updateVariant(index, "price", event.target.value)}
                    placeholder="Price override"
                    className="rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        variants:
                          current.variants.length === 1
                            ? current.variants
                            : current.variants.filter((_, variantIndex) => variantIndex !== index),
                      }))
                    }
                    className="inline-flex items-center justify-center rounded-xl border border-zinc-800 px-3 text-zinc-400 transition-colors hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
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
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {isPending ? "Saving..." : product ? "Save changes" : "Create product"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
