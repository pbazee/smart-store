import Fuse from "fuse.js";
import type { ParsedSearchIntent } from "@/types";

type SearchableProduct = {
  id: string;
  name: string;
  description: string;
  subcategory: string;
  category: string;
  gender: string;
  tags: string[];
  basePrice: number;
  variants: Array<{
    color: string;
  }>;
};

const categoryKeywords: Record<string, string[]> = {
  shoes: ["shoes", "sneakers", "kicks", "boots", "loafers", "slides"],
  clothes: [
    "clothes",
    "hoodie",
    "hoodies",
    "tees",
    "shirt",
    "shirts",
    "dress",
    "dresses",
    "cargos",
    "cargo",
    "jeans",
    "jackets",
    "bomber",
    "bombers",
  ],
  accessories: ["bag", "bags", "watch", "watches", "belt", "beanie", "accessories"],
};

const colorKeywords = [
  "black",
  "white",
  "orange",
  "green",
  "blue",
  "brown",
  "grey",
  "gray",
  "red",
  "pink",
  "cream",
];

const genderKeywords = ["men", "women", "unisex"];

function parseKESValue(value: string) {
  const normalized = value.toLowerCase().replace(/,/g, "").trim();
  const numeric = Number.parseFloat(normalized.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(numeric)) {
    return undefined;
  }

  return normalized.includes("k") ? Math.round(numeric * 1000) : Math.round(numeric);
}

export function parseSmartSearchIntent(query: string): ParsedSearchIntent {
  const normalizedQuery = query.toLowerCase().trim();
  const colors = colorKeywords.filter((color) => normalizedQuery.includes(color));
  const genders = genderKeywords.filter((gender) => normalizedQuery.includes(gender));
  const categories = Object.entries(categoryKeywords)
    .filter(([, keywords]) => keywords.some((keyword) => normalizedQuery.includes(keyword)))
    .map(([category]) => category);
  const tags = ["trending", "new-arrival", "streetwear", "bestseller"].filter((tag) =>
    normalizedQuery.includes(tag.replace("-", " "))
  );

  let priceMin: number | undefined;
  let priceMax: number | undefined;

  const underMatch = normalizedQuery.match(
    /(under|below|less than|max)\s+k?sh?\s*([\d.,]+k?)/i
  );
  const overMatch = normalizedQuery.match(
    /(over|above|more than|min)\s+k?sh?\s*([\d.,]+k?)/i
  );
  const betweenMatch = normalizedQuery.match(
    /between\s+k?sh?\s*([\d.,]+k?)\s+and\s+k?sh?\s*([\d.,]+k?)/i
  );

  if (betweenMatch) {
    priceMin = parseKESValue(betweenMatch[1]);
    priceMax = parseKESValue(betweenMatch[2]);
  } else {
    if (underMatch) {
      priceMax = parseKESValue(underMatch[2]);
    }

    if (overMatch) {
      priceMin = parseKESValue(overMatch[2]);
    }
  }

  const terms = normalizedQuery
    .replace(/under|below|less than|max|over|above|more than|min|between|and/gi, " ")
    .replace(/ksh|kes/g, " ")
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);

  return {
    rawQuery: query,
    normalizedQuery,
    priceMin,
    priceMax,
    colors,
    categories,
    genders,
    tags,
    terms,
  };
}

export function smartSearchProducts<T extends SearchableProduct>(products: T[], query: string) {
  const intent = parseSmartSearchIntent(query);
  const fuse = new Fuse<T>(products, {
    includeScore: true,
    threshold: 0.34,
    keys: ["name", "description", "subcategory", "tags", "category", "gender"],
  });

  let results: T[] = intent.terms.length
    ? fuse.search(intent.terms.join(" ")).map((result) => result.item)
    : [...products];

  if (intent.categories.length > 0) {
    results = results.filter((product) =>
      intent.categories.includes(product.category) ||
      intent.categories.includes(product.subcategory)
    );
  }

  if (intent.genders.length > 0) {
    results = results.filter(
      (product) =>
        intent.genders.includes(product.gender) || product.gender === "unisex"
    );
  }

  if (intent.colors.length > 0) {
    results = results.filter((product) =>
      product.variants.some((variant) =>
        intent.colors.some((color) =>
          variant.color.toLowerCase().includes(color.toLowerCase())
        )
      )
    );
  }

  if (intent.tags.length > 0) {
    results = results.filter((product) =>
      intent.tags.some((tag) => product.tags.includes(tag))
    );
  }

  if (intent.priceMin !== undefined) {
    results = results.filter((product) => product.basePrice >= intent.priceMin!);
  }

  if (intent.priceMax !== undefined) {
    results = results.filter((product) => product.basePrice <= intent.priceMax!);
  }

  if (!intent.terms.length) {
    return { intent, results };
  }

  const deduped = new Map(results.map((product) => [product.id, product]));
  return { intent, results: Array.from(deduped.values()) };
}
