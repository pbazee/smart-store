import { test } from "node:test";
import assert from "node:assert/strict";
import { getPaystackVerificationError, isDuplicatePaymentVerification } from "../lib/paystack-verification";

test("webhook idempotency detects already processed payments", () => {
  assert.equal(isDuplicatePaymentVerification(new Date()), true);
  assert.equal(isDuplicatePaymentVerification(null), false);
});

test("webhook verification rejects mismatched amounts and customers", () => {
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
