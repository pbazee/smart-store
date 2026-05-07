import { Prisma } from "@prisma/client";

const CONNECTION_ERROR_CODES = new Set(["P1001", "P1017"]);

export function isPrismaConnectionError(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string" &&
    CONNECTION_ERROR_CODES.has((error as { code: string }).code)
  ) {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Can't reach database server") ||
    message.includes("Server has closed the connection") ||
    message.includes("max clients reached in session mode") ||
    message.includes("EMAXCONNSESSION")
  );
}
