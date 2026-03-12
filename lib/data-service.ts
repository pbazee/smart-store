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

type LiveDataQueryOptions = {
  syncReservations?: boolean;
  timeoutMs?: number | null;
  cacheKey?: string;
};

const USE_MOCK_DATA = shouldUseMockData();
const DEFAULT_LIVE_DATA_TIMEOUT_MS = 10000;
const DEFAULT_LIVE_DATA_TRANSACTION_TIMEOUT_MS = 10000;
const DEFAULT_RESERVATION_SYNC_INTERVAL_MS = 60_000;
const LIVE_DATA_TIMEOUT_MS = getLiveDataTimeoutMs();
const LIVE_DATA_TRANSACTION_TIMEOUT_MS = getLiveDataTransactionTimeoutMs();
const RESERVATION_SYNC_INTERVAL_MS = getReservationSyncIntervalMs();
const ENABLE_RESERVATION_SYNC_ON_READ = getEnableReservationSyncOnRead();

let liveDataDisabled = USE_MOCK_DATA;
let loggedLiveDataFailure = false;
let liveDataVerified = USE_MOCK_DATA;
let liveDataCheckPromise: Promise<void> | null = null;
let reservationSyncPromise: Promise<void> | null = null;
let lastReservationSyncAt = 0;
const loggedLiveDataWarnings = new Set<string>();
const liveQueryFallbackCache = new Map<string, { value: unknown; cachedAt: number }>();
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
  if (process.env.NODE_ENV === "development" && rawValue === "0") {
    return null;
  }

  const parsedValue = rawValue ? Number(rawValue) : DEFAULT_LIVE_DATA_TIMEOUT_MS;

  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : DEFAULT_LIVE_DATA_TIMEOUT_MS;
}

function getLiveDataTransactionTimeoutMs() {
  const rawValue = process.env.LIVE_DATA_TRANSACTION_TIMEOUT_MS;
  const parsedValue = rawValue ? Number(rawValue) : DEFAULT_LIVE_DATA_TRANSACTION_TIMEOUT_MS;

  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : DEFAULT_LIVE_DATA_TRANSACTION_TIMEOUT_MS;
}

function getReservationSyncIntervalMs() {
  const rawValue = process.env.RESERVATION_SYNC_INTERVAL_MS;
  const parsedValue = rawValue ? Number(rawValue) : DEFAULT_RESERVATION_SYNC_INTERVAL_MS;

  return Number.isFinite(parsedValue) && parsedValue >= 0
    ? parsedValue
    : DEFAULT_RESERVATION_SYNC_INTERVAL_MS;
}

function getEnableReservationSyncOnRead() {
  if (process.env.ENABLE_RESERVATION_SYNC_ON_READ) {
    return process.env.ENABLE_RESERVATION_SYNC_ON_READ === "true";
  }

  return process.env.NODE_ENV === "production";
}

function createLiveDataTimeoutError(context: string, timeoutMs: number) {
  return new Error(
    `Live data timed out after ${timeoutMs}ms during ${context}.`
  );
}

function disableLiveData(context: string, error: unknown) {
  liveDataDisabled = true;
  liveDataVerified = false;
  liveDataCheckPromise = null;

  if (shouldLogLiveDataWarnings() && !loggedLiveDataFailure) {
    console.warn(
      `[live-data] Database access disabled during ${context}; using fallback data.`,
      error
    );
    loggedLiveDataFailure = true;
  }
}

function logLiveDataFallback(context: string, error: unknown) {
  if (!shouldLogLiveDataWarnings() || loggedLiveDataWarnings.has(context)) {
    return;
  }

  console.warn(`[live-data] Falling back during ${context}.`, error);
  loggedLiveDataWarnings.add(context);
}

function shouldLogLiveDataWarnings() {
  return process.env.NODE_ENV === "development" && process.env.DEBUG_LIVE_DATA === "true";
}

function getLiveQueryCache<T>(cacheKey?: string) {
  if (!cacheKey) {
    return undefined;
  }

  return liveQueryFallbackCache.get(cacheKey)?.value as T | undefined;
}

function setLiveQueryCache<T>(cacheKey: string | undefined, value: T) {
  if (!cacheKey) {
    return;
  }

  liveQueryFallbackCache.set(cacheKey, { value, cachedAt: Date.now() });
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
          reject(createLiveDataTimeoutError(context, timeoutMs));
        }, timeoutMs);
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

async function syncReservationState(force = false) {
  if (liveDataDisabled || !ENABLE_RESERVATION_SYNC_ON_READ) {
    return;
  }

  const now = Date.now();
  if (!force && now - lastReservationSyncAt < RESERVATION_SYNC_INTERVAL_MS) {
    return;
  }

  if (reservationSyncPromise) {
    return reservationSyncPromise;
  }

  reservationSyncPromise = withLiveDataTimeout(
    "reservation sync",
    () =>
      releaseExpiredReservations({
        timeoutMs: LIVE_DATA_TRANSACTION_TIMEOUT_MS,
      }),
    LIVE_DATA_TRANSACTION_TIMEOUT_MS
  )
    .then(() => {
      lastReservationSyncAt = Date.now();
    })
    .catch((error) => {
      logLiveDataFallback("reservation sync", error);
    })
    .finally(() => {
      reservationSyncPromise = null;
    });

  await reservationSyncPromise;
}

async function withLiveData<T>(
  context: string,
  query: () => Promise<T>,
  fallback: () => T,
  options: LiveDataQueryOptions = {}
): Promise<T> {
  if (liveDataDisabled) {
    return getLiveQueryCache<T>(options.cacheKey) ?? fallback();
  }

  if (!(await ensureLiveDataAvailable(context))) {
    return getLiveQueryCache<T>(options.cacheKey) ?? fallback();
  }

  try {
    if (options?.syncReservations) {
      await syncReservationState();
    }

    const result = await withLiveDataTimeout(context, query, options.timeoutMs);
    setLiveQueryCache(options.cacheKey, result);
    return result;
  } catch (error) {
    logLiveDataFallback(context, error);
    return getLiveQueryCache<T>(options.cacheKey) ?? fallback();
  }
}

export async function getProducts(
  filters?: ProductQueryFilters,
  options: LiveDataQueryOptions = {}
): Promise<Product[]> {
  const normalizedFilters = normalizeProductFilters(filters);
  const cacheKey = options.cacheKey ?? `products:${JSON.stringify(normalizedFilters)}`;

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
    {
      syncReservations: options.syncReservations ?? false,
      timeoutMs: options.timeoutMs,
      cacheKey,
    }
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
    {
      syncReservations: false,
      cacheKey: `product:slug:${slug}`,
    }
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
    {
      syncReservations: false,
      cacheKey: `product:identifier:${identifier}`,
    }
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
    {
      syncReservations: false,
      cacheKey: `related:${product.id}:${limit}`,
    }
  );
}
