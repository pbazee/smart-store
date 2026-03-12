import { PrismaClient } from "@prisma/client";

function resolveDatabaseUrl(rawUrl = process.env.DATABASE_URL) {
  if (!rawUrl) {
    return rawUrl;
  }

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
        url.searchParams.set("connection_limit", "1");
      }
      if (!url.searchParams.has("connect_timeout")) {
        url.searchParams.set("connect_timeout", "30");
      }
      if (!url.searchParams.has("pool_timeout")) {
        url.searchParams.set("pool_timeout", "30");
      }
    }

    return url.toString();
  } catch {
    return rawUrl;
  }
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const resolvedDatabaseUrl = resolveDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: resolvedDatabaseUrl
      ? {
          db: {
            url: resolvedDatabaseUrl,
          },
        }
      : undefined,
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
