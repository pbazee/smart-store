"use client";

import { memo, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { GripVertical, ImagePlus, Info, Plus, Trash2, Upload, X } from "lucide-react";
import {
  cleanupProductVariantImageAction,
  cleanupProductImageAction,
  uploadProductVariantImageAction,
  uploadProductImageAction,
} from "@/app/admin/products/actions";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RippleSpinner } from "@/components/ui/ripple-loader";
import { jsonFetcher } from "@/lib/fetcher";
import {
  apparelSizeOptions,
  getQuickFillSizesForProductType,
  inferAdminVariantProductType,
  isFootwearProductLike,
  type AdminVariantProductType,
} from "@/lib/size-guide";
import { useToast } from "@/lib/use-toast";
import { slugify } from "@/lib/utils";
import type { Category, Product } from "@/types";

type VariantFormState = {
  id?: string;
  color: string;
  colorHex: string;
  size: string;
  stock: string;
  price: string;
  variantImageUrl: string;
};

type ProductFormState = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  category: Product["category"];
  subcategory: string;
  categoryId?: string | null;
  parentId?: string | null;
  subcategoryId?: string | null;
  gender: Product["gender"];
  basePrice: string;
  images: string[];
  tags: string;
  isFeatured: boolean;
  isNew: boolean;
  isPopular: boolean;
  isTrending: boolean;
  isRecommended: boolean;
  singleItemStock: string;
  variants: VariantFormState[];
};

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

function createProductDraftKey() {
  return `product-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createVariantDraftId() {
  return `variant-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createDefaultVariant(): VariantFormState {
  return {
    id: createVariantDraftId(),
    color: "",
    colorHex: "#000000",
    size: "",
    stock: "0",
    price: "",
    variantImageUrl: "",
  };
}

function createEmptyFormState(): ProductFormState {
  return {
    name: "",
    slug: "",
    description: "",
    category: "",
    subcategory: "",
    categoryId: null,
    parentId: null,
    subcategoryId: null,
    gender: "unisex",
    basePrice: "",
    images: [],
    tags: "trending, nairobi",
    isFeatured: false,
    isNew: true,
    isPopular: true,
    isTrending: true,
    isRecommended: true,
    singleItemStock: "0",
    variants: [],
  };
}

const variantProductTypeOptions: Array<{
  value: AdminVariantProductType;
  label: string;
  description: string;
}> = [
  { value: "clothing", label: "Clothing", description: "Tops, dresses, jackets, trousers, hoodies" },
  { value: "footwear", label: "Footwear", description: "Shoes, sneakers, boots, sandals" },
  { value: "kids-clothing", label: "Kids Clothing", description: "Children's apparel sizes" },
  { value: "kids-footwear", label: "Kids Footwear", description: "Children's shoe sizes" },
  { value: "accessories", label: "Accessories", description: "Bags, hats, belts, jewellery" },
  { value: "custom", label: "Custom", description: "Admin defines custom sizes" },
];

type VariantFieldErrors = {
  size?: string;
  stock?: string;
  price?: string;
  duplicate?: string;
};

function createQuickFillVariant(size: string): VariantFormState {
  return {
    id: createVariantDraftId(),
    color: "",
    colorHex: "#000000",
    size,
    stock: "0",
    price: "",
    variantImageUrl: "",
  };
}

function normalizeVariantKey(color: string, size: string) {
  return `${color.trim().toLowerCase()}::${size.trim().toLowerCase()}`;
}

function validateVariantRows(variants: VariantFormState[]) {
  const errors: VariantFieldErrors[] = variants.map(() => ({}));
  const duplicateMap = new Map<string, number[]>();

  variants.forEach((variant, index) => {
    if (!variant.size.trim()) {
      errors[index].size = "Size is required";
    }

    if (!/^\d+$/.test(variant.stock.trim())) {
      errors[index].stock = "Enter a valid stock number";
    }

    if (variant.price.trim() && (!Number.isFinite(Number(variant.price)) || Number(variant.price) <= 0)) {
      errors[index].price = "Enter a valid price or leave blank";
    }

    const key = normalizeVariantKey(variant.color, variant.size);
    if (variant.color.trim() && variant.size.trim()) {
      duplicateMap.set(key, [...(duplicateMap.get(key) ?? []), index]);
    }
  });

  duplicateMap.forEach((indexes) => {
    if (indexes.length > 1) {
      indexes.forEach((index) => {
        errors[index].duplicate = "Duplicate variant - each color/size combination must be unique";
      });
    }
  });

  return errors;
}

function hasVariantErrors(errors: VariantFieldErrors[]) {
  return errors.some((error) => Object.keys(error).length > 0);
}

function inferProductTypeFromForm(form: ProductFormState, categories: Category[]) {
  const parentCategory = categories.find((category) => category.id === form.parentId) ?? null;
  const subcategory = categories.find((category) => category.id === form.subcategoryId) ?? null;

  return inferAdminVariantProductType({
    category: parentCategory?.name ?? form.category,
    subcategory: subcategory?.name ?? form.subcategory,
    tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
  });
}

function createFormState(product?: Product | null): ProductFormState {
  if (!product) {
    return createEmptyFormState();
  }

  const hiddenDefaultVariant =
    product.variants.length === 1 &&
    product.variants[0]?.color.trim().toLowerCase() === "default" &&
    product.variants[0]?.size.trim().toLowerCase() === "one size"
      ? product.variants[0]
      : null;

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
    isPopular: product.isPopular,
    isTrending: product.isTrending,
    isRecommended: product.isRecommended,
    singleItemStock: hiddenDefaultVariant ? String(hiddenDefaultVariant.stock) : "0",
    variants: hiddenDefaultVariant
      ? []
      : product.variants.map((variant) => ({
          id: variant.id || createVariantDraftId(),
          color: variant.color,
          colorHex: variant.colorHex,
          size: variant.size,
          stock: String(variant.stock),
          price: String(variant.price),
          variantImageUrl: variant.variantImageUrl ?? "",
        })),
  };
}

function hydrateFormState(product: Product | null, categories: Category[]) {
  const base = createFormState(product);

  if (product?.categoryId) {
    const matchedCategory = categories.find((category) => category.id === product.categoryId);
    if (matchedCategory) {
      const parentCategory = matchedCategory.parentId
        ? categories.find((category) => category.id === matchedCategory.parentId)
        : matchedCategory;
      const resolvedParent = parentCategory ?? matchedCategory;
      base.parentId = resolvedParent.id;
      base.categoryId = resolvedParent.id;
      base.category = resolvedParent.slug;
    }
  }

  return base;
}

function toPayload(form: ProductFormState): AdminProductInput {
  const basePrice = Number(form.basePrice);

  return {
    id: form.id,
    name: form.name.trim(),
    slug: slugify(form.slug || form.name),
    description: form.description.trim(),
    category: form.category.trim(),
    subcategory: form.subcategory.trim() || "",
    categoryId: form.parentId || form.categoryId || null,
    gender: form.gender,
    basePrice,
    images: form.images.filter(Boolean),
    tags: form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    isFeatured: form.isFeatured,
    isNew: form.isNew,
    isPopular: form.isPopular,
    isTrending: form.isTrending,
    isRecommended: form.isRecommended,
    variants:
      form.variants.length > 0
        ? form.variants.map((variant) => ({
            id: variant.id,
            color: variant.color.trim(),
            colorHex: variant.colorHex,
            size: variant.size.trim(),
            stock: Number(variant.stock),
            price: variant.price ? Number(variant.price) : basePrice,
            variantImageUrl: variant.variantImageUrl.trim() || null,
          }))
        : [
            {
              color: "Default",
              colorHex: "#000000",
              size: "One Size",
              stock: Number(form.singleItemStock || "0"),
              price: basePrice,
              variantImageUrl: null,
            },
          ],
  };
}

type AdminProductInput = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  subcategory: string;
  categoryId?: string | null;
  gender: Product["gender"];
  basePrice: number;
  images: string[];
  tags: string[];
  isFeatured: boolean;
  isNew: boolean;
  isPopular: boolean;
  isTrending: boolean;
  isRecommended: boolean;
  variants: Array<{
    id?: string;
    color: string;
    colorHex: string;
    size: string;
    stock: number;
    price: number;
    variantImageUrl?: string | null;
  }>;
};

function normalizeProductSubcategory(value?: string | null) {
  return slugify(value || "").replace(/-/g, "");
}

type VariantRowProps = {
  index: number;
  variant: VariantFormState;
  errors: VariantFieldErrors;
  isFootwearCategory: boolean;
  basePrice: string;
  draggedVariantIndex: number | null;
  onDragStart: (index: number) => void;
  onDragEnd: () => void;
  onDrop: (index: number) => void;
  onCommit: (index: number, field: keyof VariantFormState, value: string) => void;
  onUploadImage: (index: number, file: File) => Promise<void>;
  onRemoveImage: (index: number) => Promise<void>;
  onRemove: (index: number) => void;
};

const VariantRow = memo(function VariantRow({
  index,
  variant,
  errors,
  isFootwearCategory,
  basePrice,
  draggedVariantIndex,
  onDragStart,
  onDragEnd,
  onDrop,
  onCommit,
  onUploadImage,
  onRemoveImage,
  onRemove,
}: VariantRowProps) {
  const fieldBorder = (fieldError?: string) =>
    fieldError
      ? "border-red-500/70 focus-within:border-red-500"
      : "border-zinc-800 focus-within:border-orange-400";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.18 }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => {
        if (draggedVariantIndex === null) return;
        onDrop(index);
      }}
      onDragEnd={onDragEnd}
      className={`group grid gap-4 rounded-2xl border bg-zinc-950/80 p-4 transition ${
        errors.duplicate ? "border-red-500/60" : "border-zinc-800"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            draggable
            onDragStart={() => onDragStart(index)}
            className="inline-flex cursor-grab rounded-xl border border-zinc-800 bg-black p-2 text-zinc-500 transition hover:text-white active:cursor-grabbing"
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </span>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
            Variant {index + 1}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onRemove(index)}
          className="inline-flex items-center justify-center rounded-xl border border-red-500/25 px-3 py-2 text-red-400 transition hover:bg-red-500/10 hover:border-red-500/40"
          aria-label="Delete variant"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-[auto,1fr]">
        <div className="space-y-2">
          <span className="text-sm font-medium text-zinc-300">Variant image</span>
          <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-zinc-800 bg-black">
            {variant.variantImageUrl ? (
              <Image
                src={variant.variantImageUrl}
                alt={variant.color || "Variant image"}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[10px] text-zinc-500">
                No image
              </div>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-800 px-3 py-2 text-sm text-zinc-100">
              <Upload className="h-4 w-4" />
              Upload Image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    return;
                  }

                  void onUploadImage(index, file);
                  event.currentTarget.value = "";
                }}
              />
            </label>
            {variant.variantImageUrl ? (
              <button
                type="button"
                onClick={() => void onRemoveImage(index)}
                className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-3 py-2 text-sm text-red-300"
              >
                <X className="h-4 w-4" />
                Remove
              </button>
            ) : null}
          </div>
          <input
            value={variant.variantImageUrl}
            onChange={(event) => onCommit(index, "variantImageUrl", event.target.value)}
            placeholder="Paste URL"
            className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-orange-400"
          />
          <p className="text-xs text-zinc-500">
            Color photo - customers see this when they select this color.
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.35fr),5.25rem,minmax(0,0.95fr),minmax(0,1fr),minmax(0,0.9fr),minmax(0,1fr)]">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-zinc-300">Color name</span>
          <input
            required
            value={variant.color}
            onChange={(event) => onCommit(index, "color", event.target.value)}
            placeholder="Black, Navy Blue, Cream"
            className={`w-full rounded-xl border bg-black px-3 py-2.5 text-sm text-zinc-100 outline-none ${fieldBorder(errors.duplicate)}`}
          />
          {errors.duplicate ? <p className="text-xs text-red-400">{errors.duplicate}</p> : null}
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-zinc-300">Swatch</span>
          <input
            type="color"
            value={variant.colorHex}
            onChange={(event) => onCommit(index, "colorHex", event.target.value)}
            className="h-12 w-full cursor-pointer rounded-2xl border border-zinc-800 bg-black p-1"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-zinc-300">Hex code</span>
          <input
            value={variant.colorHex}
            onChange={(event) => onCommit(index, "colorHex", event.target.value)}
            className="min-w-0 rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-100 outline-none focus:border-orange-400"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-zinc-300">{isFootwearCategory ? "Size (EU)" : "Size"}</span>
          <input
            required
            list={isFootwearCategory ? "footwear-size-options" : "apparel-size-options"}
            value={variant.size}
            onChange={(event) => onCommit(index, "size", event.target.value)}
            placeholder={isFootwearCategory ? "42" : "M"}
            className={`w-full rounded-xl border bg-black px-4 py-3 text-sm text-zinc-100 outline-none ${fieldBorder(errors.size || errors.duplicate)}`}
          />
          {errors.size ? <p className="text-xs text-red-400">{errors.size}</p> : null}
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-zinc-300">Stock</span>
          <input
            required
            min="0"
            type="number"
            value={variant.stock}
            onChange={(event) => onCommit(index, "stock", event.target.value)}
            placeholder="0"
            className={`w-full rounded-xl border bg-black px-4 py-3 text-sm text-zinc-100 outline-none ${fieldBorder(errors.stock)}`}
          />
          {errors.stock ? <p className="text-xs text-red-400">{errors.stock}</p> : null}
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-zinc-300">Price override</span>
          <input
            min="0"
            type="number"
            value={variant.price}
            onChange={(event) => onCommit(index, "price", event.target.value)}
            placeholder={basePrice || "0"}
            className={`w-full rounded-xl border bg-black px-4 py-3 text-sm text-zinc-100 outline-none ${fieldBorder(errors.price)}`}
          />
          <p className="text-xs text-zinc-500">
            Blank uses base price: Ksh {Number(basePrice || 0).toLocaleString()}
          </p>
          {errors.price ? <p className="text-xs text-red-400">{errors.price}</p> : null}
        </label>
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.index === nextProps.index &&
    prevProps.isFootwearCategory === nextProps.isFootwearCategory &&
    prevProps.basePrice === nextProps.basePrice &&
    prevProps.draggedVariantIndex === nextProps.draggedVariantIndex &&
    prevProps.variant.id === nextProps.variant.id &&
    prevProps.variant.color === nextProps.variant.color &&
    prevProps.variant.colorHex === nextProps.variant.colorHex &&
    prevProps.variant.size === nextProps.variant.size &&
    prevProps.variant.stock === nextProps.variant.stock &&
    prevProps.variant.price === nextProps.variant.price &&
    prevProps.variant.variantImageUrl === nextProps.variant.variantImageUrl &&
    prevProps.errors.size === nextProps.errors.size &&
    prevProps.errors.stock === nextProps.errors.stock &&
    prevProps.errors.price === nextProps.errors.price &&
    prevProps.errors.duplicate === nextProps.errors.duplicate
  );
});

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
  const [availableCategories, setAvailableCategories] = useState<Category[]>(categories);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [variantProductType, setVariantProductType] = useState<AdminVariantProductType>(() =>
    inferProductTypeFromForm(createFormState(product), categories)
  );
  const [variantErrors, setVariantErrors] = useState<VariantFieldErrors[]>([]);
  const [draggedVariantIndex, setDraggedVariantIndex] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [productAssetKey, setProductAssetKey] = useState(() => product?.id ?? createProductDraftKey());
  const topLevelCategories = useMemo(() => {
    return availableCategories
      .filter((category) => !category.parentId && category.isActive !== false)
      .sort((left, right) =>
        (left.order ?? 0) === (right.order ?? 0)
          ? left.name.localeCompare(right.name)
          : (left.order ?? 0) - (right.order ?? 0)
      );
  }, [availableCategories]);

  const subcategoryOptions = useMemo(
    () =>
      availableCategories
        .filter((category) => category.parentId === form.parentId && category.isActive !== false)
        .sort((left, right) =>
          (left.order ?? 0) === (right.order ?? 0)
            ? left.name.localeCompare(right.name)
            : (left.order ?? 0) - (right.order ?? 0)
        ),
    [availableCategories, form.parentId]
  );
  const selectedParentCategory = useMemo(
    () => topLevelCategories.find((category) => category.id === form.parentId) ?? null,
    [form.parentId, topLevelCategories]
  );
  const selectedSubcategory = useMemo(
    () => subcategoryOptions.find((category) => category.id === form.subcategoryId) ?? null,
    [form.subcategoryId, subcategoryOptions]
  );
  const sizeSuggestions = useMemo(
    () => getQuickFillSizesForProductType(variantProductType),
    [variantProductType]
  );
  const isFootwearCategory = useMemo(
    () =>
      isFootwearProductLike({
        category: selectedParentCategory?.name ?? form.category,
        subcategory: selectedSubcategory?.name ?? form.subcategory,
      }),
    [form.category, form.subcategory, selectedParentCategory, selectedSubcategory]
  );

  useEffect(() => {
    const base = hydrateFormState(product, availableCategories);
    setForm(base);
    setSlugTouched(false);
    setImageUrlInput("");
    setVariantProductType(inferProductTypeFromForm(base, availableCategories));
    setVariantErrors(validateVariantRows(base.variants));
    setSaveState("idle");
    setProductAssetKey(product?.id ?? createProductDraftKey());
  }, [availableCategories, open, product]);

  useEffect(() => {
    setAvailableCategories(categories);
  }, [categories]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    setIsCategoriesLoading(true);

    void fetch("/api/admin/categories", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { categories?: Category[]; data?: Category[] }) => {
        if (cancelled) {
          return;
        }

        const nextCategories = data.categories || data.data || [];
        if (nextCategories.length > 0) {
          setAvailableCategories(nextCategories);
        }
      })
      .catch((error) => {
        console.error("[ProductFormDialog] Failed to load categories:", error);
      })
      .finally(() => {
        if (!cancelled) {
          setIsCategoriesLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!form.parentId || form.subcategoryId || subcategoryOptions.length === 0) {
      return;
    }

      const matchedOption = subcategoryOptions.find((option) => {
      const optionToken = normalizeProductSubcategory(option.name);
      const linkToken = normalizeProductSubcategory(option.slug);
      const currentToken = normalizeProductSubcategory(form.subcategory);
      return currentToken === optionToken || currentToken === linkToken;
    });

    if (!matchedOption) {
      return;
    }

    setForm((current) => ({
      ...current,
      subcategoryId: matchedOption.id,
      subcategory: matchedOption.name,
    }));
  }, [form.parentId, form.subcategory, form.subcategoryId, subcategoryOptions]);

  useEffect(() => {
    setVariantErrors(validateVariantRows(form.variants));
  }, [form.variants]);

  const setFormDirty = useCallback((updater: (current: ProductFormState) => ProductFormState) => {
    setSaveState((current) => (current === "saving" ? current : "dirty"));
    setForm(updater);
  }, []);

  const updateVariant = useCallback((
    index: number,
    field: keyof VariantFormState,
    value: string
  ) => {
    setFormDirty((current) => {
      const nextVariants = current.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [field]: value } : variant
      );
      setVariantErrors(validateVariantRows(nextVariants));
      return {
        ...current,
        variants: nextVariants,
      };
    });
  }, [setFormDirty]);

  const addVariantRows = (sizes: string[]) => {
    setFormDirty((current) => {
      const existingSizes = new Set(current.variants.map((variant) => variant.size.trim().toLowerCase()));
      const nextVariants = [
        ...current.variants,
        ...sizes
          .filter((size) => {
            const normalizedSize = size.trim().toLowerCase();
            return normalizedSize && !existingSizes.has(normalizedSize);
          })
          .map((size) => createQuickFillVariant(size)),
      ];

      if (nextVariants.length === current.variants.length) {
        toast({
          title: "Sizes already added",
          description: "Those quick-fill sizes are already in the variant list.",
        });
        return current;
      }

      setVariantErrors(validateVariantRows(nextVariants));
      return {
        ...current,
        variants: nextVariants,
      };
    });
  };

  const removeVariant = useCallback((index: number) => {
    setFormDirty((current) => {
      const nextVariants = current.variants.filter((_, variantIndex) => variantIndex !== index);
      setVariantErrors(validateVariantRows(nextVariants));
      return {
        ...current,
        variants: nextVariants,
      };
    });
  }, [setFormDirty]);

  const uploadVariantImage = useCallback(
    async (index: number, file: File) => {
      if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
        throw new Error("Please use JPG, PNG, or WebP images only.");
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Each image must be under 5MB.");
      }

      const variantId = form.variants[index]?.id;
      if (!variantId) {
        throw new Error("Variant is missing an identifier.");
      }

      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("productId", productAssetKey);
      uploadFormData.append("variantId", variantId);

      const uploadResult = await uploadProductVariantImageAction(uploadFormData);
      if (!uploadResult.imageUrl) {
        throw new Error("Variant image upload failed.");
      }

      updateVariant(index, "variantImageUrl", uploadResult.imageUrl);
    },
    [form.variants, productAssetKey, updateVariant]
  );

  const removeVariantImage = useCallback(
    async (index: number) => {
      const imageUrl = form.variants[index]?.variantImageUrl?.trim() || "";
      updateVariant(index, "variantImageUrl", "");

      if (!imageUrl) {
        return;
      }

      try {
        await cleanupProductVariantImageAction(imageUrl);
      } catch (error) {
        console.error("Variant image cleanup failed:", error);
      }
    },
    [form.variants, updateVariant]
  );

  const uploadProductImages = useCallback(
    async (files: FileList) => {
      const uploadedImages: string[] = [];

      for (const file of Array.from(files)) {
        if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
          throw new Error("Please use JPG, PNG, or WebP images only.");
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error("Each image must be under 5MB.");
        }

        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        uploadFormData.append("productId", productAssetKey);

        const uploadResult = await uploadProductImageAction(uploadFormData);
        if (uploadResult.imageUrl) {
          uploadedImages.push(uploadResult.imageUrl);
        }
      }

      if (uploadedImages.length > 0) {
        setFormDirty((current) => ({
          ...current,
          images: [...current.images, ...uploadedImages],
        }));
      }
    },
    [productAssetKey, setFormDirty]
  );

  const removeProductImage = useCallback(
    async (index: number) => {
      const currentImageUrl = form.images[index]?.trim();
      setFormDirty((current) => ({
        ...current,
        images: current.images.filter((_, imageIndex) => imageIndex !== index),
      }));

      if (!currentImageUrl) {
        return;
      }

      try {
        await cleanupProductImageAction(currentImageUrl);
      } catch (error) {
        console.error("Product image cleanup failed:", error);
      }
    },
    [form.images, setFormDirty]
  );

  const moveVariant = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) {
      return;
    }

    setFormDirty((current) => {
      const nextVariants = [...current.variants];
      const [movedVariant] = nextVariants.splice(fromIndex, 1);
      nextVariants.splice(toIndex, 0, movedVariant);
      setVariantErrors(validateVariantRows(nextVariants));
      return {
        ...current,
        variants: nextVariants,
      };
    });
  }, [setFormDirty]);

  const handleVariantDragStart = useCallback((index: number) => {
    setDraggedVariantIndex(index);
  }, []);

  const handleVariantDragEnd = useCallback(() => {
    setDraggedVariantIndex(null);
  }, []);

  const handleVariantDrop = useCallback((toIndex: number) => {
    if (draggedVariantIndex === null) {
      return;
    }

    moveVariant(draggedVariantIndex, toIndex);
    setDraggedVariantIndex(null);
  }, [draggedVariantIndex, moveVariant]);

  const variantValidation = useMemo(() => validateVariantRows(form.variants), [form.variants]);
  const hasValidationErrors = hasVariantErrors(variantValidation);
  const hasUnsavedChanges = !form.id || saveState === "dirty" || saveState === "error";
  const footwearLetterSizeWarning = useMemo(
    () =>
      isFootwearCategory &&
      form.variants.some((variant) => apparelSizeOptions.includes(variant.size.trim().toUpperCase())),
    [form.variants, isFootwearCategory]
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateVariantRows(form.variants);
    setVariantErrors(nextErrors);

    if (hasVariantErrors(nextErrors)) {
      toast({
        title: "Fix variant errors first",
        description: "Resolve the highlighted variant issues before saving.",
        variant: "destructive",
      });
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          setSaveState("saving");
          const payload = toPayload(form);
          const response = await jsonFetcher<{ success: boolean; data: Product }>(
            form.id ? `/api/admin/products/${form.id}` : "/api/admin/products",
            {
              method: form.id ? "PATCH" : "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            }
          );
          const savedProduct = response.data;
          const nextForm = hydrateFormState(savedProduct, availableCategories);

          setForm(nextForm);
          setProductAssetKey(savedProduct.id);
          setSlugTouched(false);
          setVariantProductType(inferProductTypeFromForm(nextForm, availableCategories));
          setVariantErrors(validateVariantRows(nextForm.variants));
          setSaveState("saved");
          onSaved(savedProduct);
          toast({
            title: form.id ? "Product updated" : "Product created",
            description: form.id
              ? `${savedProduct.name} and its variants were saved successfully.`
              : `${savedProduct.name} is now live in the catalog.`,
          });
          if (!form.id) {
            onOpenChange(false);
          }
        } catch (error) {
          setSaveState("error");
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
                  setFormDirty((current) => ({
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
                  setFormDirty((current) => ({ ...current, slug: slugify(event.target.value) }));
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
                  setFormDirty((current) => ({ ...current, description: event.target.value }))
                }
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300">Category</span>
              <select
                required
                value={form.parentId ?? ""}
                onChange={(event) => {
                  const parentId = event.target.value ? event.target.value : null;
                  const parentCategory = topLevelCategories.find((category) => category.id === parentId) || null;

                  setFormDirty((current) => ({
                    ...current,
                    parentId,
                    categoryId: parentId,
                    subcategoryId: null,
                    category: parentCategory?.slug || "",
                    subcategory: "",
                    variants: current.variants.map((variant) => ({
                      ...variant,
                      size:
                        parentCategory &&
                        isFootwearProductLike({ category: parentCategory.name }) &&
                        (!variant.size || ["XS", "S", "M", "L", "XL", "XXL"].includes(variant.size))
                          ? "42"
                          : variant.size,
                    })),
                  }));
                  setVariantProductType(
                    inferAdminVariantProductType({
                      category: parentCategory?.name ?? "",
                      subcategory: "",
                    })
                  );
                }}
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              >
                <option value="">
                  {isCategoriesLoading ? "Loading categories..." : "Select top-level"}
                </option>
                {topLevelCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300">Subcategory</span>
              <select
                value={form.subcategoryId ?? ""}
                onChange={(event) => {
                  const selectedId = event.target.value || null;
                  const selectedSubcategory = subcategoryOptions.find((option) => option.id === selectedId);

                  setFormDirty((current) => ({
                    ...current,
                    subcategoryId: selectedId,
                    subcategory: selectedSubcategory?.name || "",
                  }));
                }}
                disabled={!form.parentId}
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              >
                <option value="">
                  {isCategoriesLoading
                    ? "Loading subcategories..."
                    : form.parentId
                      ? "Use parent only"
                      : "Select category first"}
                </option>
                {subcategoryOptions.map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-zinc-300">Gender</span>
              <select
                value={form.gender}
                onChange={(event) =>
                  setFormDirty((current) => ({
                    ...current,
                    gender: event.target.value as Product["gender"],
                  }))
                }
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              >
                <option value="unisex">Unisex</option>
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="children">Children</option>
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
                  setFormDirty((current) => ({ ...current, basePrice: event.target.value }))
                }
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
              />
            </label>

            <label className="space-y-2 text-sm md:col-span-2">
              <span className="font-medium text-zinc-300">Tags</span>
              <input
                value={form.tags}
                onChange={(event) =>
                  setFormDirty((current) => ({ ...current, tags: event.target.value }))
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
                  setFormDirty((current) => ({ ...current, isFeatured: event.target.checked }))
                }
              />
              Featured on homepage
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={form.isNew}
                onChange={(event) =>
                  setFormDirty((current) => ({ ...current, isNew: event.target.checked }))
                }
              />
              Mark as new arrival
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={form.isPopular}
                onChange={(event) =>
                  setFormDirty((current) => ({ ...current, isPopular: event.target.checked }))
                }
              />
              Popular product
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={form.isTrending}
                onChange={(event) =>
                  setFormDirty((current) => ({ ...current, isTrending: event.target.checked }))
                }
              />
              Trending
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.isRecommended}
                onChange={(event) =>
                  setFormDirty((current) => ({ ...current, isRecommended: event.target.checked }))
                }
              />
              Recommended for you
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
                      try {
                        await uploadProductImages(files);
                      } catch (error) {
                        toast({
                          title: "Upload failed",
                          description:
                            error instanceof Error
                              ? error.message
                              : "The product images could not be uploaded.",
                          variant: "destructive",
                        });
                      }
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
                  setFormDirty((current) => ({
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
                    onClick={() => {
                      void removeProductImage(index);
                    }}
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
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Variants</h3>
                  <div className="group relative inline-flex">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-700 text-zinc-400">
                      <Info className="h-3.5 w-3.5" />
                    </span>
                    <div className="pointer-events-none absolute left-1/2 top-[calc(100%+0.5rem)] z-20 hidden w-72 -translate-x-1/2 rounded-2xl border border-zinc-800 bg-zinc-950 p-3 text-xs leading-5 text-zinc-300 shadow-2xl group-hover:block group-focus-within:block">
                      Each variant is a unique version of this product - e.g. a different size or color.
                      Each has its own stock count. Use price override only if a specific variant costs more or less than the base price.
                    </div>
                  </div>
                </div>
                <p className="text-sm text-zinc-400">
                  {isFootwearCategory
                    ? "Color, swatch, EU shoe size, stock, and optional price override."
                    : "Color, swatch, size, stock, and optional price override."}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormDirty((current) => ({
                    ...current,
                    variants: [
                      ...current.variants,
                      {
                        ...createDefaultVariant(),
                        size:
                          variantProductType === "accessories"
                            ? "One Size"
                            : variantProductType === "footwear"
                              ? "42"
                              : variantProductType === "kids-footwear"
                                ? "30"
                                : "",
                      },
                    ],
                  }))
                }
                className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200"
              >
                Add variant
              </button>
            </div>

            <div className="mt-5">
              <p className="text-sm font-semibold text-zinc-200">Product Type</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {variantProductTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setVariantProductType(option.value)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                      variantProductType === option.value
                        ? "border-orange-400 bg-orange-500 text-white shadow-[0_10px_24px_rgba(249,115,22,0.25)]"
                        : "border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-zinc-500 hover:text-white"
                    }`}
                    title={option.description}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {variantProductType !== "custom" && (
              <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Quick fill sizes</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {sizeSuggestions.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => addVariantRows([size])}
                      className="rounded-full border border-zinc-700 bg-black px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:border-orange-400 hover:text-white"
                    >
                      + {size}
                    </button>
                  ))}

                  {variantProductType === "clothing" && (
                    <button
                      type="button"
                      onClick={() => addVariantRows(["XS", "S", "M", "L", "XL", "XXL"])}
                      className="rounded-full border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm font-semibold text-orange-200"
                    >
                      + Add all (XS → XXL)
                    </button>
                  )}
                  {variantProductType === "footwear" && (
                    <>
                      <button
                        type="button"
                        onClick={() => addVariantRows(["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"])}
                        className="rounded-full border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm font-semibold text-orange-200"
                      >
                        + Add all (36 → 45)
                      </button>
                      <button
                        type="button"
                        onClick={() => addVariantRows(["35", "36", "37", "38", "39", "40", "41", "42"])}
                        className="rounded-full border border-zinc-700 bg-black px-3 py-2 text-sm font-semibold text-zinc-200"
                      >
                        + Women's range (35 → 42)
                      </button>
                      <button
                        type="button"
                        onClick={() => addVariantRows(["39", "40", "41", "42", "43", "44", "45", "46"])}
                        className="rounded-full border border-zinc-700 bg-black px-3 py-2 text-sm font-semibold text-zinc-200"
                      >
                        + Men's range (39 → 46)
                      </button>
                    </>
                  )}
                  {variantProductType === "kids-clothing" && (
                    <button
                      type="button"
                      onClick={() => addVariantRows(["2-3Y", "3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y", "8-10Y"])}
                      className="rounded-full border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm font-semibold text-orange-200"
                    >
                      + Add all kids sizes
                    </button>
                  )}
                  {variantProductType === "kids-footwear" && (
                    <button
                      type="button"
                      onClick={() => addVariantRows(["26", "28", "30", "32", "33", "35"])}
                      className="rounded-full border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm font-semibold text-orange-200"
                    >
                      + Add all kids shoe sizes
                    </button>
                  )}
                </div>
              </div>
            )}

            {footwearLetterSizeWarning && (
              <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                <p className="font-semibold">For shoe products: sizes should be EU numbers (e.g. 39, 40, 41).</p>
                <p className="mt-1 text-amber-200/90">
                  Using clothing sizes (S, M, L) on shoe products will confuse customers.
                </p>
              </div>
            )}

            {form.variants.length === 0 ? (
              <div className="mt-5 rounded-[1.75rem] border border-dashed border-zinc-700 bg-zinc-950/50 px-6 py-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-400">
                  <Plus className="h-6 w-6" />
                </div>
                <h4 className="mt-4 text-lg font-semibold text-zinc-100">No variants added</h4>
                <div className="mx-auto mt-6 max-w-sm text-left">
                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-zinc-300">How many units do you have?</span>
                    <input
                      type="number"
                      min="0"
                      value={form.singleItemStock}
                      onChange={(event) =>
                        setFormDirty((current) => ({
                          ...current,
                          singleItemStock: event.target.value,
                        }))
                      }
                      placeholder="e.g. 50"
                      className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100"
                    />
                  </label>
                </div>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-400">
                  No variants added — this product will be sold as a single item. Add variants if this product comes in multiple sizes or colors.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <AnimatePresence initial={false}>
                  {form.variants.map((variant, index) => {
                    const currentErrors = variantErrors[index] ?? variantValidation[index] ?? {};

                    return (
                      <VariantRow
                        key={variant.id || `variant-${index}`}
                        index={index}
                        variant={variant}
                        errors={currentErrors}
                        isFootwearCategory={isFootwearCategory}
                        basePrice={form.basePrice}
                        draggedVariantIndex={draggedVariantIndex}
                        onDragStart={handleVariantDragStart}
                        onDragEnd={handleVariantDragEnd}
                        onDrop={handleVariantDrop}
                        onCommit={updateVariant}
                        onUploadImage={uploadVariantImage}
                        onRemoveImage={removeVariantImage}
                        onRemove={removeVariant}
                      />
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
            <datalist id="footwear-size-options">
              {["35", ...getQuickFillSizesForProductType("footwear"), "46"].map((size) => (
                <option key={size} value={size} />
              ))}
            </datalist>
            <datalist id="apparel-size-options">
              {apparelSizeOptions.map((size) => (
                <option key={size} value={size} />
              ))}
            </datalist>
            <p className="mt-3 text-xs text-zinc-500">
              {isFootwearCategory
                ? `Suggested shoe sizes: ${sizeSuggestions.join(", ")}. Major footwear stores usually anchor fit on foot length, so this form now defaults to numeric EU sizing for shoes.`
                : `Suggested apparel sizes: ${sizeSuggestions.join(", ")}.`}
            </p>
          </div>

          <div className="flex items-center justify-end gap-3">
            {form.id ? (
              <p
                className={`mr-auto text-sm ${
                  saveState === "saved"
                    ? "text-emerald-400"
                    : saveState === "error"
                      ? "text-red-400"
                      : saveState === "dirty"
                        ? "text-amber-300"
                        : "text-zinc-500"
                }`}
              >
                {saveState === "saved"
                  ? "All product and variant changes are saved."
                  : saveState === "error"
                    ? "Save failed. Your edits are still here."
                    : saveState === "dirty"
                      ? "You have unsaved changes."
                      : "No unsaved changes yet."}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveState === "saving" || hasValidationErrors || !hasUnsavedChanges}
              className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saveState === "saving" ? <RippleSpinner size={28} color="currentColor" label="Saving" /> : <Plus className="h-4 w-4" />}
              {saveState === "saving"
                ? "Saving..."
                : form.id
                  ? saveState === "saved"
                    ? "Saved"
                    : "Save changes"
                  : "Create product"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
