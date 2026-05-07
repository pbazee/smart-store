/**
 * Next.js instrumentation hook that warms the schema-repair helpers once when
 * the Node.js server starts.
 */
import { shouldSkipLiveDataDuringBuild } from "@/lib/live-data-mode";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  // Build-time/static work should never touch live schema repair paths.
  if (
    process.env.NEXT_PHASE === "phase-production-build" ||
    shouldSkipLiveDataDuringBuild()
  ) {
    return;
  }

  if (process.env.USE_MOCK_DATA === "true") {
    return;
  }

  try {
    const {
      ensureShippingRuleStorage,
      ensureFAQStorage,
      ensureStoreSettingsStorage,
      ensureReviewStorage,
      ensureCartStorage,
      ensureHomepageCategoryStorage,
      ensureCategoryHomepageFields,
      ensureVariantImageField,
      ensureProductBaseStockField,
      ensureRestockNotificationStorage,
      ensurePromoBannerStorage,
      ensureContactMessageStorage,
      ensurePopupStorage,
    } = await import("@/lib/runtime-schema-repair");

    const repairs: Array<[string, () => Promise<void>]> = [
      ["shipping-rules", ensureShippingRuleStorage],
      ["faq", ensureFAQStorage],
      ["store-settings", ensureStoreSettingsStorage],
      ["review", ensureReviewStorage],
      ["cart", ensureCartStorage],
      ["homepage-category", ensureHomepageCategoryStorage],
      ["category-homepage-fields", ensureCategoryHomepageFields],
      ["variant-image-field", ensureVariantImageField],
      ["product-base-stock-field", ensureProductBaseStockField],
      ["restock-notifications", ensureRestockNotificationStorage],
      ["promo-banners", ensurePromoBannerStorage],
      ["contact-message", ensureContactMessageStorage],
      ["popup", ensurePopupStorage],
    ];

    for (const [name, repair] of repairs) {
      try {
        await repair();
      } catch (error) {
        // Individual repairs are non-fatal; affected features can degrade
        // gracefully while the rest of the app still boots.
        console.error(`[Instrumentation] Schema repair failed for "${name}":`, error);
      }
    }

    console.log("[Instrumentation] Schema repairs completed at startup.");
  } catch (error) {
    console.error("[Instrumentation] Failed to load schema repair module:", error);
  }
}
