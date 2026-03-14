import productsData from "@/mock/products.json";
import ordersData from "@/mock/orders.json";
import type { Order, Product } from "@/types";

type RawMockOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: Order["status"];
  paymentStatus: Order["paymentStatus"];
  paymentMethod: Order["paymentMethod"];
  total: number;
  address: string;
  createdAt: string;
  items: Array<{
    productId: string;
    variantId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
};

export type MockOrder = Order;

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1542291026-7eec264c27ff";

export const mockProducts: Product[] = (productsData as Product[]).map((product) => ({
  ...product,
  images: Array.isArray(product.images) && product.images.length > 0 
    ? product.images 
    : [DEFAULT_IMAGE],
}));

function normalizeAddress(value: string) {
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return {
      address: parts.slice(0, -1).join(", "),
      city: parts[parts.length - 1],
    };
  }

  return {
    address: value,
    city: "Nairobi",
  };
}

export const mockOrders: MockOrder[] = (ordersData as RawMockOrder[]).map((order) => {
  const normalizedAddress = normalizeAddress(order.address);

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    total: order.total,
    address: normalizedAddress.address,
    city: normalizedAddress.city,
    createdAt: order.createdAt,
    items: order.items.map((item, index) => ({
      id: `${order.id}-${index}`,
      productId: item.productId,
      variantId: item.variantId,
      productName: item.name,
      quantity: item.quantity,
      price: item.price,
    })),
  };
});

export function getProductBySlug(slug: string): Product | undefined {
  return mockProducts.find((product) => product.slug === slug);
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return mockProducts
    .filter(
      (candidate) =>
        candidate.id !== product.id &&
        (candidate.category === product.category || candidate.gender === product.gender)
    )
    .slice(0, limit);
}

export function getFeaturedProducts(): Product[] {
  return mockProducts.filter((product) => product.isFeatured);
}

export function getNewArrivals(): Product[] {
  return mockProducts.filter((product) => product.isNew);
}

export function getTrendingProducts(): Product[] {
  return mockProducts.filter((product) => product.tags.includes("trending"));
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
  const minPrice = params.minPrice;
  const maxPrice = params.maxPrice;
  const colors = params.colors;
  const sizes = params.sizes;

  if (params.search) {
    const query = params.search.toLowerCase();
    products = products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
    );
  }

  if (params.category && params.category !== "all") {
    products = products.filter(
      (product) =>
        product.category === params.category || product.subcategory === params.category
    );
  }

  if (params.gender && params.gender !== "all") {
    products = products.filter(
      (product) => product.gender === params.gender || product.gender === "unisex"
    );
  }

  if (minPrice !== undefined) {
    products = products.filter((product) => product.basePrice >= minPrice);
  }

  if (maxPrice !== undefined) {
    products = products.filter((product) => product.basePrice <= maxPrice);
  }

  if (colors && colors.length > 0) {
    products = products.filter((product) =>
      product.variants.some((variant) =>
        colors.some((color) => variant.color.toLowerCase().includes(color.toLowerCase()))
      )
    );
  }

  if (sizes && sizes.length > 0) {
    products = products.filter((product) =>
      product.variants.some((variant) => sizes.includes(variant.size))
    );
  }

  return products;
}

export function getAdminStats() {
  const totalRevenue = mockOrders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = mockOrders.length;
  const totalProducts = mockProducts.length;
  const lowStockProducts = mockProducts.filter((product) =>
    product.variants.some((variant) => variant.stock > 0 && variant.stock <= 5)
  );
  const recentOrders = mockOrders.slice(0, 8).map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    total: order.total,
    paymentMethod: order.paymentMethod,
    status: order.status,
    createdAt: new Date(order.createdAt),
  }));

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
    recentOrders,
  };
}
