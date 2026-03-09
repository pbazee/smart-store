import productsData from "@/mock/products.json";
import ordersData from "@/mock/orders.json";
import type { Product, Order } from "@/types";

export const mockProducts: Product[] = productsData as Product[];
export const mockOrders: Order[] = ordersData as Order[];

export function getProductBySlug(slug: string): Product | undefined {
  return mockProducts.find((p) => p.slug === slug);
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return mockProducts
    .filter(
      (p) =>
        p.id !== product.id &&
        (p.category === product.category || p.gender === product.gender)
    )
    .slice(0, limit);
}

export function getFeaturedProducts(): Product[] {
  return mockProducts.filter((p) => p.isFeatured);
}

export function getNewArrivals(): Product[] {
  return mockProducts.filter((p) => p.isNew);
}

export function getTrendingProducts(): Product[] {
  return mockProducts.filter((p) => p.tags.includes("trending"));
}

export function filterProducts(params: {
  category?: string;
  gender?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  colors?: string[];
  sizes?: string[];
}): Product[] {
  let products = [...mockProducts];

  if (params.search) {
    const q = params.search.toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }
  if (params.category && params.category !== "all") {
    products = products.filter((p) => p.category === params.category || p.subcategory === params.category);
  }
  if (params.gender && params.gender !== "all") {
    products = products.filter(
      (p) => p.gender === params.gender || p.gender === "unisex"
    );
  }
  if (params.minPrice !== undefined) {
    products = products.filter((p) => p.basePrice >= params.minPrice!);
  }
  if (params.maxPrice !== undefined) {
    products = products.filter((p) => p.basePrice <= params.maxPrice!);
  }
  if (params.colors && params.colors.length > 0) {
    products = products.filter((p) =>
      p.variants.some((v) =>
        params.colors!.some((c) =>
          v.color.toLowerCase().includes(c.toLowerCase())
        )
      )
    );
  }
  if (params.sizes && params.sizes.length > 0) {
    products = products.filter((p) =>
      p.variants.some((v) => params.sizes!.includes(v.size))
    );
  }
  return products;
}

export function getAdminStats() {
  const totalRevenue = mockOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = mockOrders.length;
  const totalProducts = mockProducts.length;
  const lowStockProducts = mockProducts.filter((p) =>
    p.variants.some((v) => v.stock > 0 && v.stock <= 5)
  );

  const revenueByMonth = [
    { month: "Jul", revenue: 145000 },
    { month: "Aug", revenue: 189000 },
    { month: "Sep", revenue: 167000 },
    { month: "Oct", revenue: 234000 },
    { month: "Nov", revenue: 312000 },
    { month: "Dec", revenue: totalRevenue },
  ];

  return {
    totalRevenue,
    totalOrders,
    totalProducts,
    lowStockProducts,
    revenueByMonth,
  };
}
