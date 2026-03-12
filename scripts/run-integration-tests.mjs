import assert from "node:assert/strict";
import { getAuthRedirectPath } from "../lib/auth-routing.ts";
import {
  buildCheckoutPayload,
  getCheckoutCartValidationError,
  isCheckoutDataComplete,
  normalizeCheckoutPhoneNumber,
} from "../lib/checkout-payload.ts";
import { shouldSkipLiveDataDuringBuild, shouldUseMockData } from "../lib/live-data-mode.ts";
import { getPaystackVerificationError, isDuplicatePaymentVerification } from "../lib/paystack-verification.ts";
import { getReservationExpiryDate, isReservationExpired, reservationWindowMinutes } from "../lib/reservation-timing.ts";
import { buildAdminProductCreateData, buildAdminProductDeleteOperations, normalizeAdminGender } from "../lib/admin-products.ts";

function run(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

run("auth redirect flow", () => {
  assert.equal(
    getAuthRedirectPath({ path: "/admin/products", userId: null }),
    "/login?redirect_url=%2Fadmin%2Fproducts"
  );
  assert.equal(
    getAuthRedirectPath({ path: "/admin", userId: "user_123", role: "customer" }),
    "/"
  );
  assert.equal(
    getAuthRedirectPath({ path: "/checkout", userId: null }),
    null
  );
  assert.equal(
    getAuthRedirectPath({ path: "/admin/orders", userId: "user_123", role: "admin" }),
    null
  );
});

run("multi-step checkout payload", () => {
  assert.equal(isCheckoutDataComplete({}), false);
  assert.equal(buildCheckoutPayload({ items: [], checkoutData: {}, total: 2500 }), null);

  const payload = buildCheckoutPayload({
    items: [
      {
        product: { id: "prod_1" },
        variant: { id: "var_1", price: 3200, stock: 4 },
        quantity: 2,
      },
    ],
    checkoutData: {
      customer: {
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
        phone: "+254700000000",
      },
      shipping: {
        address: "123 Ngong Road",
        city: "Nairobi CBD",
        deliveryNotes: "Call on arrival",
      },
      payment: {
        method: "mpesa",
        mpesaPhone: "+254700000000",
      },
    },
    total: 6650,
  });

  assert.deepEqual(payload?.items, [
    {
      productId: "prod_1",
      variantId: "var_1",
      quantity: 2,
      price: 3200,
      stock: 4,
    },
  ]);
  assert.equal(payload?.mpesaPhone, "+254700000000");
  assert.equal(normalizeCheckoutPhoneNumber("0700 000 000"), "+254700000000");
  assert.equal(
    getCheckoutCartValidationError([
      {
        product: { id: "prod_1" },
        variant: { id: "var_1", price: 3200, stock: 1 },
        quantity: 2,
      },
    ]),
    "Cart item 1 is no longer available in the requested quantity."
  );
});

run("build flag forces mock data", () => {
  assert.equal(
    shouldUseMockData({ USE_MOCK_DATA: "true", SKIP_LIVE_DATA_DURING_BUILD: "false" }),
    true
  );
  assert.equal(
    shouldUseMockData({ USE_MOCK_DATA: "false", SKIP_LIVE_DATA_DURING_BUILD: "true" }),
    true
  );
  assert.equal(
    shouldUseMockData({ USE_MOCK_DATA: "false", SKIP_LIVE_DATA_DURING_BUILD: "false" }),
    false
  );
  assert.equal(shouldSkipLiveDataDuringBuild({ SKIP_LIVE_DATA_DURING_BUILD: "true" }), true);
  assert.equal(shouldSkipLiveDataDuringBuild({ SKIP_LIVE_DATA_DURING_BUILD: "false" }), false);
});

run("webhook idempotency and verification", () => {
  assert.equal(isDuplicatePaymentVerification(new Date()), true);
  assert.equal(isDuplicatePaymentVerification(null), false);
  assert.equal(
    getPaystackVerificationError({
      orderTotal: 4500,
      customerEmail: "user@example.com",
      verifiedAmount: 400000,
      verifiedCurrency: "KES",
      verifiedEmail: "user@example.com",
    }),
    "Amount mismatch"
  );
  assert.equal(
    getPaystackVerificationError({
      orderTotal: 4500,
      customerEmail: "user@example.com",
      verifiedAmount: 450000,
      verifiedCurrency: "KES",
      verifiedEmail: "other@example.com",
    }),
    "Customer mismatch"
  );
  assert.equal(
    getPaystackVerificationError({
      orderTotal: 4500,
      customerEmail: "user@example.com",
      verifiedAmount: 450000,
      verifiedCurrency: "NGN",
      verifiedEmail: "user@example.com",
    }),
    "Currency mismatch"
  );
});

run("stock reservation expiry", () => {
  const createdAt = new Date("2026-03-10T10:00:00.000Z");
  const expiresAt = getReservationExpiryDate(createdAt);
  assert.equal(
    expiresAt.getTime(),
    createdAt.getTime() + reservationWindowMinutes * 60 * 1000
  );
  assert.equal(isReservationExpired(expiresAt, new Date("2026-03-10T10:10:00.000Z")), false);
  assert.equal(isReservationExpired(expiresAt, new Date("2026-03-10T10:16:00.000Z")), true);
});

run("admin product create delete helpers", () => {
  assert.equal(normalizeAdminGender("male"), "men");
  assert.equal(normalizeAdminGender("female"), "women");

  const data = buildAdminProductCreateData({
    name: "Trail Shoe",
    slug: "trail-shoe",
    description: "Built for mixed terrain.",
    category: "shoes",
    subcategory: "trail",
    gender: "female",
    basePrice: 8200,
    images: ["https://images.unsplash.com/photo-1"],
    tags: ["trail", "new"],
    isFeatured: true,
    isNew: true,
    variants: [
      {
        color: "Orange",
        colorHex: "#ff6600",
        size: "40",
        stock: 5,
        price: 8200,
      },
    ],
  });

  assert.equal(data.gender, "women");
  assert.deepEqual(buildAdminProductDeleteOperations("prod_123"), {
    variantWhere: { productId: "prod_123" },
    productWhere: { id: "prod_123" },
  });
});

console.log("Integration checks passed.");
