export function normalizeAdminGender(gender: "men" | "women" | "unisex" | "children" | "male" | "female") {
  if (gender === "male") {
    return "men";
  }

  if (gender === "female") {
    return "women";
  }

  return gender;
}

export function buildAdminProductCreateData(input: {
  name: string;
  slug: string;
  description: string;
  category: string;
  subcategory: string;
  categoryId?: string | null;
  gender: "men" | "women" | "unisex" | "children" | "male" | "female";
  basePrice: number;
  images: string[];
  tags?: string[];
  isFeatured?: boolean;
  isNew?: boolean;
  variants: Array<{
    color: string;
    colorHex: string;
    size: string;
    stock: number;
    price: number;
  }>;
}) {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description,
    category: input.category,
    subcategory: input.subcategory,
    categoryId: input.categoryId ?? null,
    gender: normalizeAdminGender(input.gender),
    basePrice: input.basePrice,
    images: input.images,
    tags: input.tags || [],
    isFeatured: input.isFeatured || false,
    isNew: input.isNew || false,
    rating: 0,
    reviewCount: 0,
    variants: {
      create: input.variants.map((variant) => ({
        color: variant.color,
        colorHex: variant.colorHex,
        size: variant.size,
        stock: variant.stock,
        price: variant.price,
      })),
    },
  };
}

export function buildAdminProductDeleteOperations(productId: string) {
  return {
    variantWhere: { productId },
    productWhere: { id: productId },
  };
}
