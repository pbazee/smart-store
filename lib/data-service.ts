import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { shouldSkipLiveDataDuringBuild } from "@/lib/live-data-mode";
import { prisma } from "@/lib/prisma";
import { buildValidCatalogProductWhere } from "@/lib/product-integrity";
import type { Order, Product } from "@/types";

export const PRODUCTS_CACHE_TAG = "products";
export const ADMIN_STATS_CACHE_TAG = "admin-stats";

export type AdminOrderDetail = Order & {
  user?: {
    id: string;
    fullName: string | null;
    email: string | null;
  } | null;
};

export type AdminOrderListItem = Pick<
  Order,
  | "id"
  | "orderNumber"
  | "customerName"
  | "customerEmail"
  | "paymentMethod"
  | "paymentStatus"
  | "status"
  | "total"
  | "createdAt"
>;

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
  skip?: number;
};

type LiveDataQueryOptions = {
  syncReservations?: boolean;
  timeoutMs?: number | null;
  cacheKey?: string;
  revalidateSeconds?: number;
  tags?: string[];
  disableCache?: boolean;
};

const DEFAULT_LIVE_DATA_TIMEOUT_MS = 10_000;
const DEFAULT_PRODUCTS_REVALIDATE_SECONDS = 300;
const DEFAULT_PRODUCT_DETAIL_REVALIDATE_SECONDS = 300;
const ADMIN_STATS_REVALIDATE_SECONDS = 60;
const LIVE_DATA_TIMEOUT_MS = getLiveDataTimeoutMs();

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
    skip: filters.skip,
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

const CATALOG_VARIANT_SELECT = {
  id: true,
  color: true,
  colorHex: true,
  size: true,
  stock: true,
  price: true,
} satisfies Prisma.VariantSelect;

const CATALOG_PRODUCT_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  category: true,
  subcategory: true,
  categoryId: true,
  gender: true,
  tags: true,
  basePrice: true,
  images: true,
  rating: true,
  reviewCount: true,
  isFeatured: true,
  isNew: true,
  isPopular: true,
  isTrending: true,
  isRecommended: true,
  createdAt: true,
  updatedAt: true,
  variants: {
    select: CATALOG_VARIANT_SELECT,
    orderBy: [{ stock: "desc" }, { price: "asc" }],
  },
} satisfies Prisma.ProductSelect;

type CatalogProductRow = Prisma.ProductGetPayload<{
  select: typeof CATALOG_PRODUCT_SELECT;
}>;

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
  return withLiveDataTimeout(
    context,
    query,
    shouldSkipLiveDataDuringBuild() ? null : options.timeoutMs
  );
}

function buildProductCacheTags(cacheKey: string, extraTags: string[] = []) {
  const tags = new Set<string>([PRODUCTS_CACHE_TAG, ...extraTags]);

  if (cacheKey.startsWith("homepage:")) {
    tags.add("homepage");
  }

  return Array.from(tags);
}

function toCatalogProduct(product: CatalogProductRow): Product {
  return {
    ...product,
    gender: product.gender as Product["gender"],
  };
}

async function loadProductsFromDb(
  filters: ProductQueryFilters,
  options: LiveDataQueryOptions = {}
): Promise<Product[]> {
  if (shouldSkipLiveDataDuringBuild()) {
    return [];
  }

  return withLiveData(
    "getProducts",
    async () =>
      (await prisma.product.findMany({
        where: buildProductWhere(filters),
        select: CATALOG_PRODUCT_SELECT,
        orderBy: productOrderBy,
        take: filters.take,
        skip: filters.skip,
      })).map(toCatalogProduct),
    options
  );
}

export async function getProducts(
  filters?: ProductQueryFilters,
  options: LiveDataQueryOptions = {}
): Promise<Product[]> {
  const normalizedFilters = normalizeProductFilters(filters);
  const cacheKey = options.cacheKey ?? `catalog:${JSON.stringify(normalizedFilters)}`;

  if (options.disableCache || shouldSkipLiveDataDuringBuild()) {
    return loadProductsFromDb(normalizedFilters, options);
  }

  return unstable_cache(
    () => loadProductsFromDb(normalizedFilters, options),
    ["products", cacheKey],
    {
      revalidate: options.revalidateSeconds ?? DEFAULT_PRODUCTS_REVALIDATE_SECONDS,
      tags: buildProductCacheTags(cacheKey, options.tags),
    }
  )();
}

async function loadProductBySlug(slug: string) {
  if (shouldSkipLiveDataDuringBuild()) {
    return null;
  }

  return withLiveData(
    "getProductBySlug",
    async () =>
      (await prisma.product.findFirst({
        where: buildValidCatalogProductWhere({ slug }),
        include: { variants: true },
      })) as Product | null
  );
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return unstable_cache(
    () => loadProductBySlug(slug),
    ["product-by-slug", slug],
    {
      revalidate: DEFAULT_PRODUCT_DETAIL_REVALIDATE_SECONDS,
      tags: [PRODUCTS_CACHE_TAG],
    }
  )();
}

async function loadProductByIdentifier(identifier: string) {
  return withLiveData(
    "getProductByIdentifier",
    async () =>
      (await prisma.product.findFirst({
        where: buildValidCatalogProductWhere({
          OR: [{ slug: identifier }, { id: identifier }],
        }),
        include: { variants: true },
      })) as Product | null
  );
}

export async function getProductByIdentifier(identifier: string): Promise<Product | null> {
  return unstable_cache(
    () => loadProductByIdentifier(identifier),
    ["product-by-identifier", identifier],
    {
      revalidate: DEFAULT_PRODUCT_DETAIL_REVALIDATE_SECONDS,
      tags: [PRODUCTS_CACHE_TAG],
    }
  )();
}

export async function getCountProducts(filters?: ProductQueryFilters) {
  const normalizedFilters = normalizeProductFilters(filters);

  return unstable_cache(
    () =>
      withLiveData(
        "getCountProducts",
        async () =>
          prisma.product.count({
            where: buildProductWhere(normalizedFilters),
          })
      ),
    ["product-count", JSON.stringify(normalizedFilters)],
    {
      revalidate: DEFAULT_PRODUCTS_REVALIDATE_SECONDS,
      tags: [PRODUCTS_CACHE_TAG],
    }
  )();
}

export async function getAllOrders(params?: { skip?: number; take?: number }) {
  const { skip, take } = params || {};
  const orders = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });

  return orders as unknown as Order[];
}

export async function getCountOrders() {
  return prisma.order.count();
}

export type AdminOrdersQuery = {
  search?: string;
  status?: string;
  skip?: number;
  take?: number;
};

const adminOrderListSelect = {
  id: true,
  orderNumber: true,
  customerName: true,
  customerEmail: true,
  paymentMethod: true,
  paymentStatus: true,
  status: true,
  total: true,
  createdAt: true,
} satisfies Prisma.OrderSelect;

function buildAdminOrdersWhere(query: AdminOrdersQuery = {}): Prisma.OrderWhereInput {
  const clauses: Prisma.OrderWhereInput[] = [];
  const search = query.search?.trim();
  const status = query.status?.trim().toLowerCase();
  const normalizedSearch = search?.toLowerCase();
  const orderStatuses = new Set(["pending", "processing", "shipped", "delivered", "cancelled"]);
  const paymentStatuses = new Set(["pending", "paid", "failed", "refunded"]);

  if (search) {
    const orClauses: Prisma.OrderWhereInput[] = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
      { customerEmail: { contains: search, mode: "insensitive" } },
      { paymentMethod: { contains: search, mode: "insensitive" } },
    ];

    if (normalizedSearch && orderStatuses.has(normalizedSearch)) {
      orClauses.push({ status: normalizedSearch as Order["status"] });
    }

    if (normalizedSearch && paymentStatuses.has(normalizedSearch)) {
      orClauses.push({ paymentStatus: normalizedSearch as Order["paymentStatus"] });
    }

    clauses.push({
      OR: orClauses,
    });
  }

  if (status && status !== "all") {
    if (status === "paid") {
      clauses.push({ paymentStatus: "paid" });
    } else if (
      status === "pending" ||
      status === "processing" ||
      status === "shipped" ||
      status === "delivered" ||
      status === "cancelled"
    ) {
      clauses.push({ status });
    }
  }

  if (clauses.length === 0) {
    return {};
  }

  if (clauses.length === 1) {
    return clauses[0];
  }

  return { AND: clauses };
}

export async function getAdminOrders(query: AdminOrdersQuery = {}): Promise<AdminOrderListItem[]> {
  const where = buildAdminOrdersWhere(query);

  return prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: query.skip,
    take: query.take,
    select: adminOrderListSelect,
  }) as Promise<AdminOrderListItem[]>;
}

export async function getAdminOrdersCount(query: AdminOrdersQuery = {}) {
  return prisma.order.count({
    where: buildAdminOrdersWhere(query),
  });
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

async function loadAdminDashboardStats() {
  if (shouldSkipLiveDataDuringBuild()) {
    return {
      totalRevenue: 0,
      revenueTrend: 0,
      totalOrders: 0,
      totalProducts: 0,
      lowStockProducts: [],
      revenueByMonth: [],
      recentOrders: [],
      topProducts: [],
      ordersTrend: [],
      todayOrders: 0,
      pendingOrdersCount: 0,
      needsAttentionCount: 0,
      lastUpdated: new Date().toISOString(),
    };
  }

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const lastSevenDaysStart = new Date(startOfToday);
  lastSevenDaysStart.setDate(lastSevenDaysStart.getDate() - 6);

  // All queries fire simultaneously — no sequential waits
  const results = await Promise.allSettled([
    prisma.order.findMany({
      where: { paymentStatus: "paid" },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.order.findMany({
      select: { createdAt: true },
    }),
    prisma.order.findMany({
      where: {
        createdAt: {
          gte: lastSevenDaysStart,
        },
      },
      select: { createdAt: true },
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
      take: 5,
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
    prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 3,
    }),
    prisma.order.count({ where: { status: "pending" } }),
    prisma.order.count({
      where: {
        status: "pending",
        createdAt: { lt: yesterday },
      },
    }),
  ]);

  const [
    paidOrdersResult,
    allOrderDatesResult,
    weeklyOrdersResult,
    totalOrdersResult,
    totalProductsResult,
    lowStockProductsResult,
    recentOrdersResult,
    topProductsGroupedResult,
    pendingOrdersCountResult,
    needsAttentionCountResult,
  ] = results;

  const paidOrders = paidOrdersResult.status === "fulfilled" ? paidOrdersResult.value : [];
  const allOrderDates = allOrderDatesResult.status === "fulfilled" ? allOrderDatesResult.value : [];
  const weeklyOrders = weeklyOrdersResult.status === "fulfilled" ? weeklyOrdersResult.value : [];
  const totalOrders = totalOrdersResult.status === "fulfilled" ? totalOrdersResult.value : 0;
  const totalProducts = totalProductsResult.status === "fulfilled" ? totalProductsResult.value : 0;
  const lowStockProducts = lowStockProductsResult.status === "fulfilled" ? lowStockProductsResult.value : [];
  const recentOrders = recentOrdersResult.status === "fulfilled" ? recentOrdersResult.value : [];
  const topProductsGrouped = topProductsGroupedResult.status === "fulfilled" ? topProductsGroupedResult.value : [];
  const pendingOrdersCount = pendingOrdersCountResult.status === "fulfilled" ? pendingOrdersCountResult.value : 0;
  const needsAttentionCount = needsAttentionCountResult.status === "fulfilled" ? needsAttentionCountResult.value : 0;

  const totalRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);
  const now = new Date();
  const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const lastMonthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
  const thisMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const lastMonthRevenue = paidOrders
    .filter((order) => order.createdAt >= lastMonthStart && order.createdAt <= lastMonthEnd)
    .reduce((sum, order) => sum + order.total, 0);
  const thisMonthRevenue = paidOrders
    .filter((order) => order.createdAt >= thisMonthStart)
    .reduce((sum, order) => sum + order.total, 0);
  const revenueTrend =
    lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

  const monthBuckets = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - index), 1));

    return {
      key: `${date.getUTCFullYear()}-${date.getUTCMonth()}`,
      month: date.toLocaleString("en-KE", { month: "short", timeZone: "UTC" }),
      revenue: 0,
      orderCount: 0,
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

  for (const order of allOrderDates) {
    const key = `${order.createdAt.getUTCFullYear()}-${order.createdAt.getUTCMonth()}`;
    const bucket = revenueByMonth.get(key);

    if (bucket) {
      bucket.orderCount += 1;
    }
  }

  // Optimized: Use a single findMany with where: { id: { in: ids } } to avoid N separate queries
  const topProductIds = topProductsGrouped.map((p) => p.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: topProductIds } },
    select: { id: true, name: true, images: true, basePrice: true },
  });

  const topProductDetails = topProductsGrouped.map((item) => {
    const details = products.find((p) => p.id === item.productId);
    return {
      name: details?.name || "Unknown Product",
      images: details?.images || [],
      basePrice: details?.basePrice || 0,
      unitsSold: item._sum.quantity || 0,
    };
  });

  const ordersTrendBuckets = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(lastSevenDaysStart);
    date.setDate(lastSevenDaysStart.getDate() + index);
    const key = date.toISOString().slice(0, 10);

    return {
      key,
      day: date.toLocaleDateString("en-KE", {
        weekday: "short",
      }),
      orders: 0,
    };
  });
  const ordersTrendMap = new Map(ordersTrendBuckets.map((bucket) => [bucket.key, bucket]));

  for (const order of weeklyOrders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    const bucket = ordersTrendMap.get(key);
    if (bucket) {
      bucket.orders += 1;
    }
  }

  const todayOrders = allOrderDates.filter((order) => order.createdAt >= startOfToday).length;

  return {
    totalRevenue,
    revenueTrend,
    totalOrders,
    totalProducts,
    lowStockProducts: lowStockProducts as Product[],
    revenueByMonth: monthBuckets.map(({ key: _key, ...bucket }) => bucket),
    recentOrders,
    topProducts: topProductDetails,
    ordersTrend: ordersTrendBuckets.map(({ key: _key, ...bucket }) => bucket),
    todayOrders,
    pendingOrdersCount,
    needsAttentionCount,
    lastUpdated: new Date().toISOString(),
  };
}

export async function getAdminDashboardStats() {
  return unstable_cache(loadAdminDashboardStats, ["admin-dashboard-stats"], {
    revalidate: ADMIN_STATS_REVALIDATE_SECONDS,
    tags: [ADMIN_STATS_CACHE_TAG],
  })();
}

export const getCachedAdminDashboardStats = getAdminDashboardStats;

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
