/**
 * Next.js Instrumentation Hook — runs ONCE when the server starts.
 *
 * Runs all schema-repair tasks sequentially at startup so that:
 *  1. The first real HTTP request is not blocked by 30+ ALTER TABLE queries.
 *  2. The globalThis-backed Map in runtime-schema-repair.ts is pre-populated,
 *     meaning every subsequent route gets an instant no-op from the Map check.
 *
 * Sequential (not parallel) to avoid exhausting the PgBouncer connection pool
 * at startup — Supabase session mode limits total concurrent connections.
 */
export async function register() {
  // Only run in the Node.js runtime (not Edge).
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  // Skip during `next build` — DB may not be available and static
  // pages use fallback data anyway.
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return;
  }

  // Skip when using mock/demo data.
  if (process.env.USE_MOCK_DATA === "true") {
    return;
  }

  try {
    const {
      ensureStoreSettingsStorage,
      ensureReviewStorage,
      ensureCartStorage,
      ensureHomepageCategoryStorage,
      ensurePromoBannerStorage,
      ensureContactMessageStorage,
      ensurePopupStorage,
    } = await import("@/lib/runtime-schema-repair");

    // Run repairs one at a time to avoid saturating PgBouncer connections.
    // Each repair is idempotent (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
    const repairs: Array<[string, () => Promise<void>]> = [
      ["store-settings", ensureStoreSettingsStorage],
      ["review", ensureReviewStorage],
      ["cart", ensureCartStorage],
      ["homepage-category", ensureHomepageCategoryStorage],
      ["promo-banners", ensurePromoBannerStorage],
      ["contact-message", ensureContactMessageStorage],
      ["popup", ensurePopupStorage],
    ];

    for (const [name, repair] of repairs) {
      try {
        await repair();
      } catch (err) {
        // Non-fatal — individual services fall back gracefully.
        console.error(`[Instrumentation] Schema repair failed for "${name}":`, err);
      }
    }

    console.log("[Instrumentation] Schema repairs completed at startup.");
  } catch (error) {
    console.error("[Instrumentation] Failed to load schema repair module:", error);
  }
}
