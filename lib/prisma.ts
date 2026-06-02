import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function getPrismaDatasourceUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("[Prisma] ❌ DATABASE_URL is not set!");
    return undefined;
  }

  try {
    const url = new URL(databaseUrl);

    // In Vercel serverless, each function instance is isolated.
    // Keep connection_limit=1 to avoid saturating the Supabase pgBouncer pool.
    url.searchParams.set("connection_limit", process.env.PRISMA_CONNECTION_LIMIT || "1");
    url.searchParams.set("pool_timeout", process.env.PRISMA_POOL_TIMEOUT || "15");
    url.searchParams.set("connect_timeout", "15");
    url.searchParams.set("sslmode", "require");

    return url.toString();
  } catch {
    return databaseUrl;
  }
}

const datasourceUrl = getPrismaDatasourceUrl();

console.log(`[Prisma] Initializing with URL: ${datasourceUrl?.replace(/:[^:@]+@/, ":****@")}`);

export const prisma =
  global.prisma ??
  new PrismaClient({
    datasourceUrl,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
