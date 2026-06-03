import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getPrismaDatasourceUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("[Prisma] ❌ DATABASE_URL is not set!");
    return undefined;
  }

  try {
    const url = new URL(databaseUrl);

    // In Vercel serverless, each function instance is isolated.
    // 3 connections per instance is safe — avoids pool starvation under concurrent
    // requests. In local development, we allow 10 to avoid ECHECKOUTTIMEOUT during HMR.
    const isDev = process.env.NODE_ENV !== "production";
    url.searchParams.set("connection_limit", process.env.PRISMA_CONNECTION_LIMIT || (isDev ? "10" : "3"));
    url.searchParams.set("pool_timeout", process.env.PRISMA_POOL_TIMEOUT || "15");
    url.searchParams.set("connect_timeout", "15");
    url.searchParams.set("sslmode", "require");

    return url.toString();
  } catch {
    return databaseUrl;
  }
}

// Singleton: only create a new PrismaClient if one doesn't already exist on globalThis.
// This prevents connection exhaustion from multiple instances being created per request.
export const prisma =
  globalForPrisma.prisma ??
  (() => {
    const datasourceUrl = getPrismaDatasourceUrl();
    console.log(`[Prisma] Initializing with URL: ${datasourceUrl?.replace(/:[^:@]+@/, ":****@")}`);
    return new PrismaClient({
      datasourceUrl,
      log: ["error"],
    });
  })();

globalForPrisma.prisma = prisma;
