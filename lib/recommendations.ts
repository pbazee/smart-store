import type { Product } from "@/types";

function scoreRecommendation(baseProduct: Product, candidate: Product) {
  let score = 0;

  if (candidate.category === baseProduct.category) {
    score += 4;
  }

  if (candidate.subcategory === baseProduct.subcategory) {
    score += 3;
  }

  if (candidate.gender === baseProduct.gender || candidate.gender === "unisex") {
    score += 2;
  }

  if (Math.abs(candidate.basePrice - baseProduct.basePrice) <= 2500) {
    score += 2;
  }

  if (candidate.tags.some((tag) => baseProduct.tags.includes(tag))) {
    score += 2;
  }

  if (candidate.isFeatured) {
    score += 1;
  }

  return score;
}

export function getCustomersAlsoBought(products: Product[], product: Product, limit = 8) {
  return products
    .filter((candidate) => candidate.id !== product.id)
    .sort((a, b) => scoreRecommendation(product, b) - scoreRecommendation(product, a))
    .slice(0, limit);
}

export function getCityInspiredProducts(
  products: Product[],
  city: string,
  limit = 8
) {
  const cityKeyword = city.toLowerCase();

  return [...products]
    .sort((a, b) => {
      const aScore =
        (a.description.toLowerCase().includes(cityKeyword) ? 3 : 0) +
        (a.tags.includes("trending") ? 2 : 0) +
        (a.isFeatured ? 1 : 0);
      const bScore =
        (b.description.toLowerCase().includes(cityKeyword) ? 3 : 0) +
        (b.tags.includes("trending") ? 2 : 0) +
        (b.isFeatured ? 1 : 0);
      return bScore - aScore;
    })
    .slice(0, limit);
}
