import { PrismaClient, Prisma } from "@prisma/client";

// Prisma 7+ configuration
// Database connection URLs are configured here instead of schema.prisma

const BUILD_TIME_DATABASE_PLACEHOLDER =
  "postgresql://placeholder:placeholder@localhost:5432/placeholder";

export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;

  if (url) {
    return url;
  }

  const isBuildLikePhase =
    process.env.NODE_ENV === "production" ||
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_RUNTIME === "edge";

  if (isBuildLikePhase || typeof window !== "undefined") {
    return BUILD_TIME_DATABASE_PLACEHOLDER;
  }

  throw new Error(
    "DATABASE_URL environment variable is not set. Please add it to your .env file."
  );
}

function getDirectUrl(): string | undefined {
  return process.env.DIRECT_URL;
}

// Helper to configure database URL with SSL for Supabase
function resolveDatabaseUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    const isSupabaseUrl = url.hostname.includes("supabase");
    const isSupabasePooler = url.hostname.includes("pooler.supabase.com") || url.port === "6543";

    if (isSupabaseUrl && !url.searchParams.has("sslmode")) {
      url.searchParams.set("sslmode", "require");
    }

    if (isSupabasePooler) {
      if (!url.searchParams.has("pgbouncer")) {
        url.searchParams.set("pgbouncer", "true");
      }
      if (!url.searchParams.has("connection_limit")) {
        url.searchParams.set("connection_limit", "10");
      }
      if (!url.searchParams.has("connect_timeout")) {
        url.searchParams.set("connect_timeout", "30");
      }
      if (!url.searchParams.has("pool_timeout")) {
        url.searchParams.set("pool_timeout", "60");
      }
    }

    return url.toString();
  } catch {
    return rawUrl;
  }
}

// Lazy initialization of database URLs
let resolvedDatabaseUrl: string | undefined;
let resolvedDirectUrl: string | undefined;

export function getResolvedDatabaseUrl(): string {
  if (!resolvedDatabaseUrl) {
    resolvedDatabaseUrl = resolveDatabaseUrl(getDatabaseUrl());
  }
  return resolvedDatabaseUrl;
}

function getResolvedDirectUrl(): string | undefined {
  if (!resolvedDirectUrl && getDirectUrl()) {
    resolvedDirectUrl = resolveDatabaseUrl(getDirectUrl()!);
  }
  return resolvedDirectUrl;
}

// PrismaClient configuration for Prisma 7+
export function getPrismaConfig() {
  return {
    datasources: {
      db: {
        url: getResolvedDatabaseUrl(),
      },
    },
    log: ["error", "warn"] as Prisma.LogLevel[],
  };
}

// For migrations (direct connection)
export function getPrismaMigrateConfig() {
  const directUrl = getResolvedDirectUrl();
  return directUrl
    ? {
      datasources: {
        db: {
          url: directUrl,
        },
      },
    }
    : undefined;
}

// Export configured PrismaClient instance with TRULY lazy initialization
// This ensures process.env is loaded before we try to access DATABASE_URL
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  return new PrismaClient(getPrismaConfig());
}

// Lazy getter - only creates PrismaClient when first accessed
export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

// For backward compatibility - also export as prisma getter
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop: string | symbol) {
    const client = getPrisma();
    const value = client[prop as keyof PrismaClient];
    // Bind methods to the client so 'this' works correctly
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

// Default export uses lazy getter
const prismaDefault = new Proxy({} as PrismaClient, {
  get(_, prop: string | symbol) {
    const client = getPrisma();
    const value = client[prop as keyof PrismaClient];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

export default prismaDefault;
