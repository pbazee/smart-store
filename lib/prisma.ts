import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createMissingDatabaseProxy() {
  const createCallableProxy = (path: string[]): unknown =>
    new Proxy(() => undefined, {
      get(_target, property) {
        if (property === "then") {
          return undefined;
        }

        return createCallableProxy([...path, String(property)]);
      },
      apply() {
        throw new Error(
          `DATABASE_URL environment variable is not set. Prisma access failed at "${path.join(".")}".`
        );
      },
    });

  return createCallableProxy(["prisma"]) as PrismaClient;
}

function resolveDatabaseUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    const desiredConnectionLimit = Number(process.env.PRISMA_CONNECTION_LIMIT ?? "20");
    const isSupabasePooler = url.hostname.includes("pooler.supabase.com") || url.port === "6543";

    if (url.hostname.includes("supabase") && !url.searchParams.has("sslmode")) {
      url.searchParams.set("sslmode", "require");
    }

    if (isSupabasePooler) {
      if (!url.searchParams.has("pgbouncer")) {
        url.searchParams.set("pgbouncer", "true");
      }

      const currentConnectionLimit = Number(url.searchParams.get("connection_limit") ?? "0");
      if (!Number.isFinite(currentConnectionLimit) || currentConnectionLimit < desiredConnectionLimit) {
        url.searchParams.set("connection_limit", String(desiredConnectionLimit));
      }

      if (!url.searchParams.has("pool_timeout")) {
        url.searchParams.set("pool_timeout", "30");
      }

      if (!url.searchParams.has("connect_timeout")) {
        url.searchParams.set("connect_timeout", "30");
      }
    }

    return url.toString();
  } catch {
    return rawUrl;
  }
}

function createPrismaClient() {
  const rawUrl = process.env.DATABASE_URL;

  if (!rawUrl) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "DATABASE_URL environment variable is not set. Returning a lazy Prisma stub so the app can render non-database routes."
      );
    }

    return createMissingDatabaseProxy();
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: resolveDatabaseUrl(rawUrl),
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
