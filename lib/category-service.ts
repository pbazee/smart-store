import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Category } from "@/types";

export const CATEGORY_CACHE_TAG = "categories";
const CATEGORY_REVALIDATE_SECONDS = 600;

import { shouldSkipLiveDataDuringBuild } from "@/lib/live-data-mode";

const globalForCategories = globalThis as typeof globalThis & {
  _lastKnownActiveCategories?: Category[];
  _lastKnownAllCategories?: Category[];
};

function cloneCategories(categories: Category[]) {
  return categories.map((category) => ({
    ...category,
    createdAt: new Date(category.createdAt),
    updatedAt: new Date(category.updatedAt),
  }));
}

function rememberActiveCategories(categories: Category[]) {
  globalForCategories._lastKnownActiveCategories = cloneCategories(categories);
  return categories;
}

function rememberAllCategories(categories: Category[]) {
  globalForCategories._lastKnownAllCategories = cloneCategories(categories);
  return categories;
}

function getLastKnownActiveCategories() {
  return cloneCategories(globalForCategories._lastKnownActiveCategories ?? []);
}

function getLastKnownAllCategories() {
  return cloneCategories(globalForCategories._lastKnownAllCategories ?? []);
}

async function loadActiveCategories(): Promise<Category[]> {
  if (shouldSkipLiveDataDuringBuild()) {
    return rememberActiveCategories([]);
  }

  try {

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ parentId: "asc" }, { order: "asc" }, { name: "asc" }],
    });

    console.log(`[Categories] Loaded ${categories.length} active categories from database`);
    return rememberActiveCategories(categories as unknown as Category[]);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Categories] Query failed:", errorMsg, {
      dbUrl: process.env.DATABASE_URL ? "set" : "NOT SET",
    });
    const lastKnown = getLastKnownActiveCategories();
    if (lastKnown.length > 0) {
      console.warn("[Categories] Returning last known active categories");
      return lastKnown;
    }
    throw error;
  }
}

const getCachedActiveCategories = unstable_cache(
  loadActiveCategories,
  ["active-categories"],
  {
    revalidate: CATEGORY_REVALIDATE_SECONDS,
    tags: [CATEGORY_CACHE_TAG],
  }
);

export async function getActiveCategories(): Promise<Category[]> {
  // Always use the cache (works in dev too). Categories rarely change;
  // 600s TTL avoids repeated DB queries on every shop/navbar render.
  return getCachedActiveCategories();
}

export async function getAllCategories(): Promise<Category[]> {
  if (shouldSkipLiveDataDuringBuild()) {
    return rememberAllCategories([]);
  }

  try {

    const categories = await prisma.category.findMany({
      orderBy: [{ parentId: "asc" }, { order: "asc" }, { name: "asc" }],
    });

    return rememberAllCategories(categories as Category[]);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Categories] Failed to load all categories:", errorMsg);
    const lastKnown = getLastKnownAllCategories();
    if (lastKnown.length > 0) {
      console.warn("[Categories] Returning last known full category list");
      return lastKnown;
    }
    throw error;
  }
}

export async function getChildCategories(parentCategoryId: string) {
  const categories = await getActiveCategories();
  return categories.filter((category) => category.parentId === parentCategoryId);
}
