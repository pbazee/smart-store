"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdminAuth } from "@/lib/auth-utils";
import { HOMEPAGE_CACHE_TAG } from "@/lib/homepage-data";
import {
  deleteLandingSectionOverride,
  listLandingOverrides,
  reorderLandingOverrides,
  upsertLandingSectionOverride,
} from "@/lib/landing-section-overrides";
import { getProducts } from "@/lib/data-service";
import type { LandingSection, LandingSectionOverride, Product } from "@/types";

const sectionEnum = z.enum(["popular", "trending", "new_arrivals", "recommended"]);

const overrideInputSchema = z.object({
  id: z.number().optional(),
  section: sectionEnum,
  productId: z.string().min(1),
  priority: z.number().optional(),
  activeFrom: z.string().optional().nullable(),
  activeUntil: z.string().optional().nullable(),
});

const reorderSchema = z.object({
  section: sectionEnum,
  orderedIds: z.array(z.number().int().positive()),
});

async function ensureAdmin() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    throw new Error("Unauthorized");
  }
}

function revalidateStorefront() {
  revalidateTag(HOMEPAGE_CACHE_TAG);
  revalidatePath("/");
  revalidatePath("/admin/landing-overrides");
}

export async function fetchLandingOverridesAction(): Promise<LandingSectionOverride[]> {
  await ensureAdmin();
  return listLandingOverrides();
}

export async function searchProductsAction(query?: string): Promise<Product[]> {
  await ensureAdmin();
  return getProducts(
    query
      ? { search: query, take: 50 }
      : { take: 50 },
    {
      cacheKey: `admin:landing-product-search:${query ?? "all"}`,
    }
  );
}

export async function upsertLandingOverrideAction(
  input: z.infer<typeof overrideInputSchema>
): Promise<LandingSectionOverride> {
  await ensureAdmin();
  const data = overrideInputSchema.parse(input);

  const override = await upsertLandingSectionOverride({
    id: data.id,
    section: data.section as LandingSection,
    productId: data.productId,
    priority: data.priority ?? 0,
    activeFrom: data.activeFrom ?? null,
    activeUntil: data.activeUntil ?? null,
  });

  revalidateStorefront();
  return override;
}

export async function deleteLandingOverrideAction(id: number) {
  await ensureAdmin();
  await deleteLandingSectionOverride(id);
  revalidateStorefront();
}

export async function reorderLandingOverridesAction(
  input: z.infer<typeof reorderSchema>
) {
  await ensureAdmin();
  const data = reorderSchema.parse(input);
  await reorderLandingOverrides(data.section as LandingSection, data.orderedIds);
  revalidateStorefront();
}
