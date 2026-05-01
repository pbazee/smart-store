import {
  Prisma,
  PrismaClient,
} from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  __smartestStorePrisma__: PrismaClient | undefined;
  prismaConnectPromise: Promise<void> | undefined;
  prismaHasConnected: boolean | undefined;
  prismaActiveOperations: number | undefined;
  prismaOperationWaiters: Array<() => void> | undefined;
};

function getPrismaMaxConcurrentOperations() {
  const configuredLimit = Number(process.env.PRISMA_MAX_CONCURRENT_QUERIES ?? "2");
  return Number.isFinite(configuredLimit) && configuredLimit > 0 ? configuredLimit : 2;
}

function ensurePrismaOperationState() {
  if (typeof globalForPrisma.prismaActiveOperations !== "number") {
    globalForPrisma.prismaActiveOperations = 0;
  }

  if (!globalForPrisma.prismaOperationWaiters) {
    globalForPrisma.prismaOperationWaiters = [];
  }
}

async function acquirePrismaOperationSlot() {
  ensurePrismaOperationState();

  if (globalForPrisma.prismaActiveOperations! < getPrismaMaxConcurrentOperations()) {
    globalForPrisma.prismaActiveOperations! += 1;
    return;
  }

  await new Promise<void>((resolve) => {
    globalForPrisma.prismaOperationWaiters!.push(() => {
      globalForPrisma.prismaActiveOperations! += 1;
      resolve();
    });
  });
}

function releasePrismaOperationSlot() {
  ensurePrismaOperationState();
  globalForPrisma.prismaActiveOperations = Math.max(
    0,
    (globalForPrisma.prismaActiveOperations ?? 1) - 1
  );

  const nextWaiter = globalForPrisma.prismaOperationWaiters!.shift();
  if (nextWaiter) {
    nextWaiter();
  }
}

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

      const normalizedConnectionLimit =
        Number.isFinite(desiredConnectionLimit) && desiredConnectionLimit > 0
          ? desiredConnectionLimit
          : 20;
      const currentConnectionLimit = Number(url.searchParams.get("connection_limit") ?? "0");
      if (
        !Number.isFinite(currentConnectionLimit) ||
        currentConnectionLimit < normalizedConnectionLimit
      ) {
        url.searchParams.set("connection_limit", String(normalizedConnectionLimit));
      }

      url.searchParams.set(
        "pool_timeout",
        url.searchParams.get("pool_timeout") ?? process.env.PRISMA_POOL_TIMEOUT ?? "30"
      );

      url.searchParams.set(
        "connect_timeout",
        url.searchParams.get("connect_timeout") ?? process.env.PRISMA_CONNECT_TIMEOUT ?? "30"
      );
    }

    return url.toString();
  } catch {
    return rawUrl;
  }
}

function createPrismaClient() {
  if (typeof window !== "undefined") {
    return createMissingDatabaseProxy();
  }

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

export const prisma = globalForPrisma.__smartestStorePrisma__ ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__smartestStorePrisma__ = prisma;
}

const TRANSIENT_PRISMA_MESSAGES = [
  "Server has closed the connection",
  "Timed out fetching a new connection from the connection pool",
  "unable to check out connection from the pool",
  "bytes remaining on stream",
  "Engine is not yet connected",
  "ECHECKOUTTIMEOUT",
  "ECONNRESET",
];

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export function isTransientPrismaConnectionError(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P1017" || error.code === "P2024")
  ) {
    return true;
  }

  if (
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    const message = getErrorMessage(error);
    return TRANSIENT_PRISMA_MESSAGES.some((fragment) => message.includes(fragment));
  }

  const message = getErrorMessage(error);
  return TRANSIENT_PRISMA_MESSAGES.some((fragment) => message.includes(fragment));
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryDelayMs(baseDelayMs: number, attempt: number) {
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1);
  const cappedDelay = Math.min(exponentialDelay, 5_000);
  const jitter = Math.floor(Math.random() * Math.max(250, Math.floor(cappedDelay * 0.3)));

  return cappedDelay + jitter;
}

async function reconnectPrismaClient() {
  const maybeClient = prisma as PrismaClient | Record<string, unknown>;
  globalForPrisma.prismaHasConnected = false;
  globalForPrisma.prismaConnectPromise = undefined;

  if ("$disconnect" in maybeClient && "$connect" in maybeClient) {
    try {
      await (maybeClient as PrismaClient).$disconnect();
    } catch {}

    try {
      await (maybeClient as PrismaClient).$connect();
    } catch {}
  }
}

async function ensurePrismaConnected() {
  const maybeClient = prisma as PrismaClient | Record<string, unknown>;

  if (!("$connect" in maybeClient)) {
    return;
  }

  if (globalForPrisma.prismaHasConnected) {
    return;
  }

  if (!globalForPrisma.prismaConnectPromise) {
    globalForPrisma.prismaConnectPromise = (maybeClient as PrismaClient)
      .$connect()
      .catch((error) => {
        globalForPrisma.prismaHasConnected = false;
        globalForPrisma.prismaConnectPromise = undefined;
        throw error;
      })
      .then(() => {
        globalForPrisma.prismaHasConnected = true;
        globalForPrisma.prismaConnectPromise = undefined;
      });
  }

  await globalForPrisma.prismaConnectPromise;
}

function shouldReconnectPrismaClient(error: unknown) {
  const message = getErrorMessage(error);

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2024"
  ) {
    return false;
  }

  return !(
    message.includes("ECHECKOUTTIMEOUT") ||
    message.includes("Timed out fetching a new connection from the connection pool") ||
    message.includes("unable to check out connection from the pool")
  );
}

export async function withPrismaRetry<T>(
  label: string,
  operation: () => Promise<T>,
  options: {
    retries?: number;
    retryDelayMs?: number;
  } = {}
): Promise<T> {
  // Disable retries by default for read-heavy operations to avoid connection churn.
  const { retries = 0, retryDelayMs = 500 } = options;
  let attempt = 0;

  while (true) {
    await acquirePrismaOperationSlot();

    try {
      await ensurePrismaConnected();
      return await operation();
    } catch (error) {
      if (!isTransientPrismaConnectionError(error) || attempt >= retries) {
        throw error;
      }

      attempt += 1;

      if (process.env.NODE_ENV !== "production") {
        console.warn(`[Prisma] Retrying ${label} after transient database error (attempt ${attempt}/${retries}).`);
      }

      if (shouldReconnectPrismaClient(error)) {
        await reconnectPrismaClient();
      }

      await sleep(getRetryDelayMs(retryDelayMs, attempt));
    } finally {
      releasePrismaOperationSlot();
    }
  }
}

export default prisma;
