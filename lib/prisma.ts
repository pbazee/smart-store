import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function getPrismaDatasourceUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl || process.env.NODE_ENV !== "production") {
    return databaseUrl;
  }

  try {
    const url = new URL(databaseUrl);

    url.searchParams.set("connection_limit", process.env.PRISMA_CONNECTION_LIMIT || "1");
    url.searchParams.set("pool_timeout", process.env.PRISMA_POOL_TIMEOUT || "10");

    return url.toString();
  } catch {
    return databaseUrl;
  }
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    datasourceUrl: getPrismaDatasourceUrl(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
