import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { releaseExpiredReservations } from "@/lib/order-reservations";
import { prisma } from "@/lib/prisma";
import { buildValidCatalogProductWhere } from "@/lib/product-integrity";
import type { Order, Product } from "@/types";

export type AdminOrderDetail = Order & {
  user?: {
    id: string;
    fullName: string | null;
    email: string | null;
  } | null;
};

export type ProductQueryFilters = {
  category?: string;
  subcategory?: string;
  gender?: string;
  search?: string;
  tag?: string;
  collection?: string;
  isFeatured?: boolean;
  isNew?: boolean;
  isPopular?: boolean;
  isTrending?: boolean;
  isRecommended?: boolean;
  take?: number;
};

type LiveDataQueryOptions = {
  syncReservations?: boolean;
  timeoutMs?: number | null;
  cacheKey?: string;
  revalidateSeconds?: number;
};

const DEFAULT_LIVE_DATA_TIMEOUT_MS = 10000;
const HOMEPAGE_QUERY_REVALIDATE_SECONDS = 60;

function normalizeProductFilters(filters?: ProductQueryFilters): ProductQueryFilters {
  if (!filters) {
    return {};
  }

  return {
    category: filters.category?.trim().toLowerCase(),
    subcategory: filters.subcategory?.trim().toLowerCase(),
    gender: filters.gender?.trim().toLowerCase(),
    search: filters.search?.trim(),
    tag: filters.tag?.trim().toLowerCase(),
    collection: filters.collection?.trim().toLowerCase(),
    isFeatured: filters.isFeatured,
    isNew: filters.isNew,
    isPopular: filters.isPopular,
    isTrending: filters.isTrending,
    isRecommended: filters.isRecommended,
    take: filters.take,
  };
}

function buildProductWhere(filters?: ProductQueryFilters): Prisma.ProductWhereInput {
  const normalizedFilters = normalizeProductFilters(filters);
  const clauses: Prisma.ProductWhereInput[] = [];

  if (normalizedFilters.collection) {
    switch (normalizedFilters.collection) {
      case "new-arrivals":
        clauses.push({ isNew: true });
        break;
      case "popular":
        clauses.push({ isPopular: true });
        break;
      case "trending":
        clauses.push({ isTrending: true });
        break;
      case "recommended":
        clauses.push({ isRecommended: true });
        break;
      case "featured":
        clauses.push({ isFeatured: true });
        break;
    }
  }

  if (normalizedFilters.category) {
    clauses.push({
      category: {
        equals: normalizedFilters.category,
        mode: "insensitive",
      },
    });
  }

  if (normalizedFilters.subcategory) {
    clauses.push({
      subcategory: {
        contains: normalizedFilters.subcategory,
        mode: "insensitive",
      },
    });
  }

  if (normalizedFilters.gender) {
    clauses.push(
      normalizedFilters.gender === "unisex"
        ? {
            gender: {
              equals: normalizedFilters.gender,
              mode: "insensitive",
            },
          }
        : {
            OR: [
              {
                gender: {
                  equals: normalizedFilters.gender,
                  mode: "insensitive",
                },
              },
              {
                gender: {
                  equals: "unisex",
                  mode: "insensitive",
                },
              },
            ],
          }
    );
  }

  if (normalizedFilters.tag) {
    clauses.push({
      tags: {
        has: normalizedFilters.tag,
      },
    });
  }

  if (typeof normalizedFilters.isFeatured === "boolean") {
    clauses.push({ isFeatured: normalizedFilters.isFeatured });
  }

  if (typeof normalizedFilters.isNew === "boolean") {
    clauses.push({ isNew: normalizedFilters.isNew });
  }

  if (typeof normalizedFilters.isPopular === "boolean") {
    clauses.push({ isPopular: normalizedFilters.isPopular });
  }

  if (typeof normalizedFilters.isTrending === "boolean") {
    clauses.push({ isTrending: normalizedFilters.isTrending });
  }

  if (typeof normalizedFilters.isRecommended === "boolean") {
    clauses.push({ isRecommended: normalizedFilters.isRecommended });
  }

  if (normalizedFilters.search) {
    clauses.push({
      OR: [
        { name: { contains: normalizedFilters.search, mode: "insensitive" } },
        { description: { contains: normalizedFilters.search, mode: "insensitive" } },
      ],
    });
  }

  if (clauses.length === 0) {
    return buildValidCatalogProductWhere();
  }

  if (clauses.length === 1) {
    return buildValidCatalogProductWhere(clauses[0]);
  }

  return buildValidCatalogProductWhere({
    AND: clauses,
  });
}

const productOrderBy: Prisma.ProductOrderByWithRelationInput[] = [
  { updatedAt: "desc" },
  { createdAt: "desc" },
];

const LIVE_DATA_TIMEOUT_MS = getLiveDataTimeoutMs();

function getLiveDataTimeoutMs() {
  const rawValue = process.env.LIVE_DATA_TIMEOUT_MS;
  if (process.env.NODE_ENV === "development" && rawValue === "0") {
    return null;
  }

  const parsedValue = rawValue ? Number(rawValue) : DEFAULT_LIVE_DATA_TIMEOUT_MS;

  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : DEFAULT_LIVE_DATA_TIMEOUT_MS;
}

async function withLiveDataTimeout<T>(
  context: string,
  task: () => Promise<T>,
  timeoutMs: number | null = LIVE_DATA_TIMEOUT_MS
) {
  if (!timeoutMs) {
    return task();
  }

  let timeoutHandle: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      task(),
      new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error(`Live data timed out after ${timeoutMs}ms during ${context}.`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

async function withLiveData<T>(
  context: string,
  query: () => Promise<T>,
  options: LiveDataQueryOptions = {}
): Promise<T> {
  return withLiveDataTimeout(context, query, options.timeoutMs);
}

export async function getProducts(
  filters?: ProductQueryFilters,
  options: LiveDataQueryOptions = {}
): Promise<Product[]> {
  const normalizedFilters = normalizeProductFilters(filters);
  const loadProducts = async () =>
    (await prisma.product.findMany({
      where: buildProductWhere(normalizedFilters),
      include: { variants: true },
      orderBy: productOrderBy,
      take: normalizedFilters.take,
    })) as Product[];

  if (options.cacheKey) {
    return unstable_cache(
      loadProducts,
      ["products", options.cacheKey, JSON.stringify(normalizedFilters)],
      {
        revalidate: options.revalidateSeconds ?? HOMEPAGE_QUERY_REVALIDATE_SECONDS,
        tags: ["homepage", options.cacheKey],
      }
    )();
  }

  return loadProducts();
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return prisma.product.findFirst({
    where: buildValidCatalogProductWhere({ slug }),
    include: { variants: true },
  }) as Promise<Product | null>;
}

export async function getProductByIdentifier(identifier: string): Promise<Product | null> {
  return prisma.product.findFirst({
    where: buildValidCatalogProductWhere({
      OR: [{ slug: identifier }, { id: identifier }],
    }),
    include: { variants: true },
  }) as Promise<Product | null>;
}

export async function getFeaturedProducts(take?: number): Promise<Product[]> {
  return getProducts({ isFeatured: true, take });
}

export async function getTrendingProducts(take?: number): Promise<Product[]> {
  return getProducts({ isTrending: true, take });
}

export async function getPopularProducts(take?: number): Promise<Product[]> {
  return getProducts({ isPopular: true, take });
}

export async function getRecommendedProducts(take?: number): Promise<Product[]> {
  return getProducts({ isRecommended: true, take });
}

export async function getNewArrivals(take?: number): Promise<Product[]> {
  return getProducts({ isNew: true, take });
}

export async function getAllOrders(): Promise<Order[]> {
  const orders = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return orders as unknown as Order[];
}

export async function getAdminOrderByIdentifier(
  identifier: string
): Promise<AdminOrderDetail | null> {
  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id: identifier }, { orderNumber: identifier }],
    },
    include: {
      items: true,
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  return (order as unknown as AdminOrderDetail | null) ?? null;
}

export async function getAdminDashboardStats() {
  const [paidOrders, totalOrders, totalProducts, lowStockProducts, recentOrders] =
    await Promise.all([
      prisma.order.findMany({
        where: { paymentStatus: "paid" },
        select: { total: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    prisma.order.count(),
    prisma.product.count({
      where: buildValidCatalogProductWhere(),
    }),
    prisma.product.findMany({
      where: buildValidCatalogProductWhere({
        variants: {
          some: {
            stock: {
              gt: 0,
              lte: 5,
            },
          },
        },
      }),
        include: { variants: true },
        take: 6,
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          orderNumber: true,
          customerEmail: true,
          customerName: true,
          total: true,
          paymentMethod: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

  const totalRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);
  const now = new Date();
  const monthBuckets = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - index), 1));

    return {
      key: `${date.getUTCFullYear()}-${date.getUTCMonth()}`,
      month: date.toLocaleString("en-KE", { month: "short", timeZone: "UTC" }),
      revenue: 0,
    };
  });
  const revenueByMonth = new Map(monthBuckets.map((bucket) => [bucket.key, bucket]));

  for (const order of paidOrders) {
    const key = `${order.createdAt.getUTCFullYear()}-${order.createdAt.getUTCMonth()}`;
    const bucket = revenueByMonth.get(key);
    if (bucket) {
      bucket.revenue += order.total;
    }
  }

    return {
      totalRevenue,
      totalOrders,
      totalProducts,
      lowStockProducts: lowStockProducts as Product[],
      revenueByMonth: monthBuckets.map(({ key: _key, ...bucket }) => bucket),
      recentOrders,
    };
}

export async function getRelatedProducts(
  product: Product,
  limit: number = 4
): Promise<Product[]> {
  const relatedProducts = await prisma.product.findMany({
    where: buildValidCatalogProductWhere({
      AND: [
        { id: { not: product.id } },
        {
          OR: [{ category: product.category }, { gender: product.gender }],
        },
      ],
    }),
    include: { variants: true },
    take: limit,
  });

  return relatedProducts as Product[];
}
