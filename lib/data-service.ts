import type { Prisma } from "@prisma/client";
import { shouldUseMockData } from "@/lib/live-data-mode";
import { getAdminStats, mockOrders } from "@/lib/mock-data";
import { releaseExpiredReservations } from "@/lib/order-reservations";
import { prisma } from "@/lib/prisma";
import { getDemoProductBySlug, getDemoProducts } from "@/lib/demo-catalog";
import type { Order, Product } from "@/types";

export type ProductQueryFilters = {
  category?: string;
  subcategory?: string;
  gender?: string;
  search?: string;
  tag?: string;
  isFeatured?: boolean;
  isNew?: boolean;
  take?: number;
};

const USE_MOCK_DATA = shouldUseMockData();
const DEFAULT_LIVE_DATA_TIMEOUT_MS = 8000;
const LIVE_DATA_TIMEOUT_MS = getLiveDataTimeoutMs();

let liveDataDisabled = USE_MOCK_DATA;
let loggedLiveDataFailure = false;
let liveDataVerified = USE_MOCK_DATA;
let liveDataCheckPromise: Promise<void> | null = null;
const productOrderBy: Prisma.ProductOrderByWithRelationInput[] = [
  { updatedAt: "desc" },
  { createdAt: "desc" },
];

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
    isFeatured: filters.isFeatured,
    isNew: filters.isNew,
    take: filters.take,
  };
}

function buildProductWhere(filters?: ProductQueryFilters): Prisma.ProductWhereInput {
  const normalizedFilters = normalizeProductFilters(filters);
  const where: Prisma.ProductWhereInput = {};

  if (normalizedFilters.category) {
    where.category = normalizedFilters.category;
  }

  if (normalizedFilters.subcategory) {
    where.subcategory = {
      contains: normalizedFilters.subcategory,
      mode: "insensitive",
    };
  }

  if (normalizedFilters.gender) {
    where.gender = normalizedFilters.gender;
  }

  if (normalizedFilters.tag) {
    where.tags = {
      has: normalizedFilters.tag,
    };
  }

  if (typeof normalizedFilters.isFeatured === "boolean") {
    where.isFeatured = normalizedFilters.isFeatured;
  }

  if (typeof normalizedFilters.isNew === "boolean") {
    where.isNew = normalizedFilters.isNew;
  }

  if (normalizedFilters.search) {
    where.OR = [
      { name: { contains: normalizedFilters.search, mode: "insensitive" } },
      { description: { contains: normalizedFilters.search, mode: "insensitive" } },
    ];
  }

  return where;
}

function filterDemoProducts(products: Product[], filters?: ProductQueryFilters) {
  const normalizedFilters = normalizeProductFilters(filters);
  let results = [...products];

  if (normalizedFilters.category) {
    results = results.filter((product) => product.category === normalizedFilters.category);
  }

  if (normalizedFilters.subcategory) {
    results = results.filter((product) =>
      product.subcategory.toLowerCase().includes(normalizedFilters.subcategory!)
    );
  }

  if (normalizedFilters.gender) {
    results = results.filter((product) => product.gender === normalizedFilters.gender);
  }

  if (normalizedFilters.tag) {
    results = results.filter((product) => product.tags.includes(normalizedFilters.tag!));
  }

  if (typeof normalizedFilters.isFeatured === "boolean") {
    results = results.filter((product) => product.isFeatured === normalizedFilters.isFeatured);
  }

  if (typeof normalizedFilters.isNew === "boolean") {
    results = results.filter((product) => product.isNew === normalizedFilters.isNew);
  }

  if (normalizedFilters.search) {
    const query = normalizedFilters.search.toLowerCase();
    results = results.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
    );
  }

  if (normalizedFilters.take) {
    results = results.slice(0, normalizedFilters.take);
  }

  return results;
}

function getLiveDataTimeoutMs() {
  const rawValue = process.env.LIVE_DATA_TIMEOUT_MS;
  const parsedValue = rawValue ? Number(rawValue) : DEFAULT_LIVE_DATA_TIMEOUT_MS;

  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : DEFAULT_LIVE_DATA_TIMEOUT_MS;
}

function createLiveDataTimeoutError(context: string) {
  return new Error(
    `Live data timed out after ${LIVE_DATA_TIMEOUT_MS}ms during ${context}.`
  );
}

function disableLiveData(context: string, error: unknown) {
  liveDataDisabled = true;
  liveDataVerified = false;
  liveDataCheckPromise = null;

  if (!loggedLiveDataFailure) {
    console.warn(`[WARN] Live database access disabled during ${context}; using mock data fallback.`, error);
    loggedLiveDataFailure = true;
  }
}

async function withLiveDataTimeout<T>(context: string, task: () => Promise<T>) {
  let timeoutHandle: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      task(),
      new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(createLiveDataTimeoutError(context));
        }, LIVE_DATA_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

async function ensureLiveDataAvailable(context: string) {
  if (liveDataDisabled) {
    return false;
  }

  if (liveDataVerified) {
    return true;
  }

  if (!liveDataCheckPromise) {
    liveDataCheckPromise = withLiveDataTimeout(
      "database connectivity check",
      async () => {
        await prisma.$queryRaw`SELECT 1`;
      }
    ).then(() => {
      liveDataVerified = true;
    });
  }

  try {
    await liveDataCheckPromise;
    return true;
  } catch (error) {
    disableLiveData(context, error);
    return false;
  } finally {
    liveDataCheckPromise = null;
  }
}

async function syncReservationState() {
  if (!liveDataDisabled) {
    await withLiveDataTimeout("reservation sync", () => releaseExpiredReservations());
  }
}

async function withLiveData<T>(
  context: string,
  query: () => Promise<T>,
  fallback: () => T,
  options?: { syncReservations?: boolean }
): Promise<T> {
  if (liveDataDisabled) {
    return fallback();
  }

  if (!(await ensureLiveDataAvailable(context))) {
    return fallback();
  }

  try {
    if (options?.syncReservations) {
      await syncReservationState();
    }

    return await withLiveDataTimeout(context, query);
  } catch (error) {
    disableLiveData(context, error);
    return fallback();
  }
}

export async function getProducts(filters?: ProductQueryFilters): Promise<Product[]> {
  const normalizedFilters = normalizeProductFilters(filters);

  return withLiveData(
    "getProducts",
    async () => {
      const products = await prisma.product.findMany({
        where: buildProductWhere(normalizedFilters),
        include: { variants: true },
        orderBy: productOrderBy,
        take: normalizedFilters.take,
      });

      return products as Product[];
    },
    () => filterDemoProducts(getDemoProducts(), normalizedFilters),
    { syncReservations: true }
  );
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return withLiveData(
    "getProductBySlug",
    async () => {
      const product = await prisma.product.findUnique({
        where: { slug },
        include: { variants: true },
      });

      return product as Product | null;
    },
    () => getDemoProductBySlug(slug),
    { syncReservations: true }
  );
}

export async function getProductByIdentifier(identifier: string): Promise<Product | null> {
  return withLiveData(
    "getProductByIdentifier",
    async () => {
      const product = await prisma.product.findFirst({
        where: {
          OR: [{ slug: identifier }, { id: identifier }],
        },
        include: { variants: true },
      });

      return product as Product | null;
    },
    () =>
      getDemoProducts().find(
        (product) => product.slug === identifier || product.id === identifier
      ) ?? getDemoProductBySlug(identifier),
    { syncReservations: true }
  );
}

export async function getFeaturedProducts(take?: number): Promise<Product[]> {
  return getProducts({ isFeatured: true, take });
}

export async function getTrendingProducts(take?: number): Promise<Product[]> {
  return getProducts({ tag: "trending", take });
}

export async function getNewArrivals(take?: number): Promise<Product[]> {
  return getProducts({ isNew: true, take });
}

export async function getAllOrders(): Promise<Order[]> {
  return withLiveData(
    "getAllOrders",
    async () => {
      const orders = await prisma.order.findMany({
        include: { items: true },
        orderBy: { createdAt: "desc" },
      });

      return orders as unknown as Order[];
    },
    () => mockOrders
  );
}

export async function getAdminDashboardStats() {
  return withLiveData(
    "getAdminDashboardStats",
    async () => {
      const [paidOrders, totalOrders, totalProducts, lowStockProducts] = await Promise.all([
        prisma.order.findMany({
          where: { paymentStatus: "paid" },
          select: { total: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        }),
        prisma.order.count(),
        prisma.product.count(),
        prisma.product.findMany({
          where: {
            variants: {
              some: {
                stock: {
                  gt: 0,
                  lte: 5,
                },
              },
            },
          },
          include: { variants: true },
          take: 6,
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
      };
    },
    () => getAdminStats()
  );
}

export async function getRelatedProducts(
  product: Product,
  limit: number = 4
): Promise<Product[]> {
  return withLiveData(
    "getRelatedProducts",
    async () => {
      const relatedProducts = await prisma.product.findMany({
        where: {
          AND: [
            { id: { not: product.id } },
            {
              OR: [{ category: product.category }, { gender: product.gender }],
            },
          ],
        },
        include: { variants: true },
        take: limit,
      });

      return relatedProducts as Product[];
    },
    () =>
      getDemoProducts()
        .filter(
          (candidate) =>
            candidate.id !== product.id &&
            (candidate.category === product.category || candidate.gender === product.gender)
        )
        .slice(0, limit),
    { syncReservations: true }
  );
}
