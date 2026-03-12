import type { Product, ProductReview } from "@/types";
import { mockProducts } from "@/lib/mock-data";
import { slugify } from "@/lib/utils";

type DemoState = {
  products: Product[];
  reviewsByProduct: Map<string, ProductReview[]>;
  wishlistByUser: Map<string, Set<string>>;
};

const reviewTemplates = [
  {
    authorName: "Achieng O.",
    authorCity: "Kilimani",
    title: "Exactly the Nairobi energy I wanted",
    content:
      "Quality feels premium, fit is on point, and delivery landed before lunch.",
    rating: 5,
  },
  {
    authorName: "Brian M.",
    authorCity: "Westlands",
    title: "Easy win",
    content:
      "Looks clean in person and the sizing was accurate enough for daily wear.",
    rating: 4,
  },
  {
    authorName: "Njeri K.",
    authorCity: "Karen",
    title: "Streetwear, but polished",
    content:
      "Feels elevated without losing the casual edge. I would buy this again.",
    rating: 5,
  },
];

function cloneProducts() {
  return mockProducts.map((product) => ({
    ...product,
    images: [...product.images],
    tags: [...product.tags],
    variants: product.variants.map((variant) => ({ ...variant })),
  }));
}

function seedReviews(products: Product[]) {
  const reviewsByProduct = new Map<string, ProductReview[]>();

  for (const product of products) {
    reviewsByProduct.set(
      product.id,
      reviewTemplates.map((review, index) => ({
        id: `${slugify(product.slug)}-review-${index + 1}`,
        productId: product.id,
        userId: null,
        authorName: review.authorName,
        authorCity: review.authorCity,
        rating: review.rating,
        title: review.title,
        content: review.content,
        verifiedPurchase: index !== 1,
        createdAt: new Date(Date.now() - (index + 1) * 1000 * 60 * 60 * 18),
      }))
    );
  }

  return reviewsByProduct;
}

const state: DemoState = {
  products: cloneProducts(),
  reviewsByProduct: seedReviews(mockProducts),
  wishlistByUser: new Map(),
};

function syncProductRating(productId: string) {
  const reviews = state.reviewsByProduct.get(productId) ?? [];
  const average =
    reviews.length === 0
      ? 0
      : Number(
          (
            reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
          ).toFixed(1)
        );

  state.products = state.products.map((product) =>
    product.id === productId
      ? { ...product, rating: average, reviewCount: reviews.length }
      : product
  );
}

export function getDemoProducts() {
  return state.products.map((product) => ({
    ...product,
    images: [...product.images],
    tags: [...product.tags],
    variants: product.variants.map((variant) => ({ ...variant })),
  }));
}

export function getDemoProductById(productId: string) {
  return getDemoProducts().find((product) => product.id === productId) ?? null;
}

export function getDemoProductBySlug(slug: string) {
  return getDemoProducts().find((product) => product.slug === slug) ?? null;
}

export function createDemoProduct(product: Product) {
  state.products = [product, ...state.products];
  if (!state.reviewsByProduct.has(product.id)) {
    state.reviewsByProduct.set(product.id, []);
  }
  return product;
}

export function updateDemoProduct(productId: string, nextProduct: Product) {
  state.products = state.products.map((product) =>
    product.id === productId ? nextProduct : product
  );
  return nextProduct;
}

export function deleteDemoProducts(productIds: string[]) {
  state.products = state.products.filter((product) => !productIds.includes(product.id));

  for (const productId of productIds) {
    state.reviewsByProduct.delete(productId);
    for (const [userId, wishlist] of state.wishlistByUser.entries()) {
      wishlist.delete(productId);
      state.wishlistByUser.set(userId, wishlist);
    }
  }
}

export function getDemoReviews(productId: string) {
  return [...(state.reviewsByProduct.get(productId) ?? [])].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function addDemoReview(
  productId: string,
  review: Omit<ProductReview, "id" | "productId" | "createdAt">
) {
  const nextReview: ProductReview = {
    ...review,
    id: crypto.randomUUID(),
    productId,
    createdAt: new Date(),
  };

  const reviews = state.reviewsByProduct.get(productId) ?? [];
  state.reviewsByProduct.set(productId, [nextReview, ...reviews]);
  syncProductRating(productId);
  return nextReview;
}

export function getDemoWishlistProductIds(userId: string) {
  return Array.from(state.wishlistByUser.get(userId) ?? []);
}

export function toggleDemoWishlist(userId: string, productId: string) {
  const wishlist = state.wishlistByUser.get(userId) ?? new Set<string>();

  if (wishlist.has(productId)) {
    wishlist.delete(productId);
  } else {
    wishlist.add(productId);
  }

  state.wishlistByUser.set(userId, wishlist);
  return Array.from(wishlist);
}
