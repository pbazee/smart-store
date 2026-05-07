import { slugify } from "@/lib/utils";

type ProductShape = {
  category?: string | null;
  subcategory?: string | null;
  tags?: string[] | null;
};

const footwearTokens = [
  "shoe",
  "shoes",
  "sneaker",
  "sneakers",
  "boot",
  "boots",
  "sandal",
  "sandals",
  "heel",
  "heels",
  "loafer",
  "loafers",
  "slipper",
  "slippers",
  "footwear",
];

const kidsTokens = ["kid", "kids", "child", "children", "toddler", "youth", "junior"];
const accessoryTokens = ["accessory", "accessories", "bag", "bags", "hat", "hats", "belt", "belts", "jewellery", "jewelry", "cap", "caps"];
const clothingLetterSizes = ["XS", "S", "M", "L", "XL", "XXL", "2XL"];

export const apparelSizeOptions = ["XS", "S", "M", "L", "XL", "XXL"];
export const footwearSizeOptions = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"];
export const kidsClothingSizeOptions = ["2-3Y", "3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y", "8-10Y"];
export const kidsFootwearSizeOptions = ["26", "28", "30", "32", "33", "35"];
export const accessorySizeOptions = ["One Size"];

export type AdminVariantProductType =
  | "clothing"
  | "footwear"
  | "kids-clothing"
  | "kids-footwear"
  | "accessories"
  | "custom";

export const apparelSizeRows = [
  ["XS", "84-88 cm", "66-70 cm", "88-92 cm"],
  ["S", "89-94 cm", "71-76 cm", "93-98 cm"],
  ["M", "95-100 cm", "77-82 cm", "99-104 cm"],
  ["L", "101-108 cm", "83-90 cm", "105-112 cm"],
  ["XL", "109-116 cm", "91-98 cm", "113-120 cm"],
];

export const footwearSizeRows = [
  ["36", "3.5", "22.1-22.5 cm", "Compact fit"],
  ["37", "4.5", "22.9-23.3 cm", "True to size"],
  ["38", "5", "23.8 cm", "True to size"],
  ["39", "6", "24.2-24.6 cm", "Most common women's fit"],
  ["40", "6.5", "25.0-25.5 cm", "Balanced everyday fit"],
  ["41", "7.5", "25.9-26.3 cm", "Great for unisex styles"],
  ["42", "8", "26.7-27.1 cm", "Most common men's fit"],
  ["43", "9", "27.6-28.0 cm", "True to size"],
  ["44", "9.5", "28.4-28.8 cm", "Roomier forefoot"],
  ["45", "10.5", "29.3-29.7 cm", "Longer daily fit"],
  ["46", "11", "30.1-30.5 cm", "Best for larger sizes"],
];

function normalizeToken(value?: string | null) {
  return slugify(value || "");
}

function collectTokens(product: ProductShape) {
  return [
    normalizeToken(product.category),
    normalizeToken(product.subcategory),
    ...(product.tags ?? []).map((tag) => normalizeToken(tag)),
  ].filter(Boolean);
}

export function isFootwearProductLike(product: ProductShape) {
  const tokens = collectTokens(product);

  return tokens.some((token) => footwearTokens.some((footwearToken) => token.includes(footwearToken)));
}

export function isKidsProductLike(product: ProductShape) {
  const tokens = collectTokens(product);
  return tokens.some((token) => kidsTokens.some((kidsToken) => token.includes(kidsToken)));
}

export function isAccessoryProductLike(product: ProductShape) {
  const tokens = collectTokens(product);
  return tokens.some((token) => accessoryTokens.some((accessoryToken) => token.includes(accessoryToken)));
}

export function getRecommendedVariantSizes(product: ProductShape) {
  return isFootwearProductLike(product) ? footwearSizeOptions : apparelSizeOptions;
}

export function inferAdminVariantProductType(product: ProductShape): AdminVariantProductType {
  if (isAccessoryProductLike(product)) {
    return "accessories";
  }

  if (isFootwearProductLike(product) && isKidsProductLike(product)) {
    return "kids-footwear";
  }

  if (isFootwearProductLike(product)) {
    return "footwear";
  }

  if (isKidsProductLike(product)) {
    return "kids-clothing";
  }

  return "clothing";
}

export function getQuickFillSizesForProductType(productType: AdminVariantProductType) {
  switch (productType) {
    case "clothing":
      return apparelSizeOptions;
    case "footwear":
      return ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"];
    case "kids-clothing":
      return kidsClothingSizeOptions;
    case "kids-footwear":
      return kidsFootwearSizeOptions;
    case "accessories":
      return accessorySizeOptions;
    case "custom":
    default:
      return [];
  }
}

export function isAgeBasedSize(size: string) {
  return /\d+\s*-\s*\d+\s*Y/i.test(size.trim());
}

export function isNumericSize(size: string) {
  return /^\d+(\.\d+)?$/.test(size.trim());
}

export function isOneSize(size: string) {
  return normalizeToken(size) === "one-size";
}

export function isLetterSize(size: string) {
  return clothingLetterSizes.includes(size.trim().toUpperCase());
}

export function shouldUseCompactSizeButton(size: string) {
  const trimmed = size.trim();
  return trimmed.length <= 2 && !isNumericSize(trimmed);
}
