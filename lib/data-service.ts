import { mockProducts, mockOrders } from "@/lib/mock-data";
import type { Product, Order } from "@/types";

const USE_MOCK_DATA = process.env.USE_MOCK_DATA === "true";

/**
 * Get all products or filtered products
 */
export async function getProducts(
  filters?: {
    category?: string;
    search?: string;
  }
): Promise<Product[]> {
  if (USE_MOCK_DATA) {
    return mockProducts.filter((p) => {
      if (filters?.category && p.category !== filters.category) return false;
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }

  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    const where: any = {};
    if (filters?.category) where.category = filters.category;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: { variants: true },
    });

    await prisma.$disconnect();
    return products as Product[];
  } catch (error) {
    console.error("Error fetching products from database:", error);
    return mockProducts;
  }
}

/**
 * Get a single product by slug
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (USE_MOCK_DATA) {
    return mockProducts.find((p) => p.slug === slug) || null;
  }

  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    const product = await prisma.product.findUnique({
      where: { slug },
      include: { variants: true },
    });

    await prisma.$disconnect();
    return product as Product | null;
  } catch (error) {
    console.error("Error fetching product from database:", error);
    return mockProducts.find((p) => p.slug === slug) || null;
  }
}

/**
 * Get featured products
 */
export async function getFeaturedProducts(): Promise<Product[]> {
  if (USE_MOCK_DATA) {
    return mockProducts.filter((p) => p.isFeatured);
  }

  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    const products = await prisma.product.findMany({
      where: { isFeatured: true },
      include: { variants: true },
    });

    await prisma.$disconnect();
    return products as Product[];
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return mockProducts.filter((p) => p.isFeatured);
  }
}

/**
 * Get trending products
 */
export async function getTrendingProducts(): Promise<Product[]> {
  if (USE_MOCK_DATA) {
    return mockProducts.filter((p) => p.tags.includes("trending"));
  }

  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    const products = await prisma.product.findMany({
      where: {
        tags: {
          has: "trending",
        },
      },
      include: { variants: true },
    });

    await prisma.$disconnect();
    return products as Product[];
  } catch (error) {
    console.error("Error fetching trending products:", error);
    return mockProducts.filter((p) => p.tags.includes("trending"));
  }
}

/**
 * Get new arrivals
 */
export async function getNewArrivals(): Promise<Product[]> {
  if (USE_MOCK_DATA) {
    return mockProducts.filter((p) => p.isNew);
  }

  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    const products = await prisma.product.findMany({
      where: { isNew: true },
      include: { variants: true },
    });

    await prisma.$disconnect();
    return products as Product[];
  } catch (error) {
    console.error("Error fetching new arrivals:", error);
    return mockProducts.filter((p) => p.isNew);
  }
}

/**
 * Get all orders
 */
export async function getOrders(): Promise<Order[]> {
  if (USE_MOCK_DATA) {
    return mockOrders;
  }

  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
    });

    await prisma.$disconnect();
    return orders as Order[];
  } catch (error) {
    console.error("Error fetching orders:", error);
    return mockOrders;
  }
}

/**
 * Get related products for a given product
 */
export async function getRelatedProducts(
  product: Product,
  limit: number = 4
): Promise<Product[]> {
  if (USE_MOCK_DATA) {
    return mockProducts
      .filter(
        (p) =>
          p.id !== product.id &&
          (p.category === product.category || p.gender === product.gender)
      )
      .slice(0, limit);
  }

  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    const relatedProducts = await prisma.product.findMany({
      where: {
        AND: [
          { id: { not: product.id } },
          {
            OR: [
              { category: product.category },
              { gender: product.gender },
            ],
          },
        ],
      },
      include: { variants: true },
      take: limit,
    });

    await prisma.$disconnect();
    return relatedProducts as Product[];
  } catch (error) {
    console.error("Error fetching related products:", error);
    return mockProducts
      .filter(
        (p) =>
          p.id !== product.id &&
          (p.category === product.category || p.gender === product.gender)
      )
      .slice(0, limit);
  }
}
