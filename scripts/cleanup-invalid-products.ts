import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { buildInvalidCatalogProductWhere } from "../lib/product-integrity";

loadEnvConfig(process.cwd());

function resolveDatabaseUrl(rawUrl = process.env.DIRECT_URL || process.env.DATABASE_URL) {
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

const resolvedDatabaseUrl = resolveDatabaseUrl();
const prisma = new PrismaClient({
  datasources: resolvedDatabaseUrl
    ? {
        db: {
          url: resolvedDatabaseUrl,
        },
      }
    : undefined,
});

async function main() {
  // Find all products that are missing categoryId, category, or subcategory
  // (these are the old seeded products created before the category system was introduced)
  const invalidWhere = buildInvalidCatalogProductWhere([]);
  const invalidProducts = await prisma.product.findMany({
    where: invalidWhere,
    select: {
      id: true,
      name: true,
      slug: true,
      categoryId: true,
      category: true,
      subcategory: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (invalidProducts.length === 0) {
    console.log("No invalid seeded products found.");
    return;
  }

  console.log(`Deleting ${invalidProducts.length} invalid seeded product(s):`);
  for (const product of invalidProducts) {
    console.log(
      `- ${product.name} (${product.slug}) | categoryId=${product.categoryId ?? "null"} | category=${product.category} | subcategory=${product.subcategory}`
    );
  }

  const result = await prisma.product.deleteMany({
    where: {
      id: {
        in: invalidProducts.map((product) => product.id),
      },
    },
  });

  console.log(`Deleted ${result.count} invalid seeded product(s).`);
}

main()
  .catch((error) => {
    console.error("Invalid product cleanup failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
