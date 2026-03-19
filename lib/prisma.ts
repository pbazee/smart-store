// Re-export prisma client from prisma.config.ts
// This maintains backward compatibility with existing imports
export { prisma, getPrisma, getPrismaConfig, getPrismaMigrateConfig } from "@/prisma/prisma.config";
export { default } from "@/prisma/prisma.config";
