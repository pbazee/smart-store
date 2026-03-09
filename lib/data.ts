import productsData from "@/mock/products.json";
import ordersData from "@/mock/orders.json";
import type { Product, Order } from "@/types";

export const mockProducts: Product[] = productsData as Product[];
export const mockOrders: Order[] = ordersData as Order[];

export function getProductBySlug(slug: string): Product | undefined {
  return mockProducts.find((p) => p.slug === slug);
}

export function getProductsByCategory(category: string): Product[] {
  return mockProducts.filter((p) => p.category.toLowerCase() === category.toLowerCase());
}

export function getFeaturedProducts(): Product[] {
  return mockProducts.filter((p) => p.featured);
}

export function getTrendingProducts(): Product[] {
  return mockProducts.filter((p) => p.trending);
}

export function getNewArrivals(): Product[] {
  return mockProducts.filter((p) => p.newArrival);
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return mockProducts
    .filter((p) => p.id !== product.id && (p.category === product.category || p.gender === product.gender))
    .slice(0, limit);
}

export function getAdminStats() {
  const totalRevenue = mockOrders.reduce((s, o) => s + o.total, 0);
  const totalOrders = mockOrders.length;
  const deliveredOrders = mockOrders.filter((o) => o.status === "delivered").length;
  const pendingOrders = mockOrders.filter((o) => o.status === "pending").length;
  const lowStockProducts = mockProducts.filter((p) =>
    p.variants.some((v) => Object.values(v.stock).some((s) => s <= 3))
  );
  return { totalRevenue, totalOrders, deliveredOrders, pendingOrders, lowStockProducts };
}

export function getRevenueChartData() {
  return [
    { month: "Aug", revenue: 285000, orders: 23 },
    { month: "Sep", revenue: 342000, orders: 28 },
    { month: "Oct", revenue: 298000, orders: 25 },
    { month: "Nov", revenue: 489000, orders: 41 },
    { month: "Dec", revenue: 678000, orders: 57 },
    { month: "Jan", revenue: 423000, orders: 35 },
  ];
}
