import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildCheckoutPayload,
  getCheckoutCartValidationError,
  isCheckoutDataComplete,
  normalizeCheckoutPhoneNumber,
} from "../lib/checkout-payload";

test("multi-step checkout payload is only created when all steps are complete", () => {
  const incomplete = buildCheckoutPayload({
    items: [],
    checkoutData: {},
    total: 2500,
  });

  assert.equal(incomplete, null);
  assert.equal(isCheckoutDataComplete({}), false);
});

test("multi-step checkout payload uses server-safe item identifiers", () => {
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

  assert.deepEqual(payload, {
    items: [
      {
        productId: "prod_1",
        variantId: "var_1",
        quantity: 2,
        price: 3200,
        stock: 4,
      },
    ],
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    phone: "+254700000000",
    address: "123 Ngong Road",
    city: "Nairobi CBD",
    notes: "Call on arrival",
    paymentMethod: "mpesa",
    mpesaPhone: "+254700000000",
    total: 6650,
  });
});

test("checkout payload helpers normalize phones and reject invalid cart items", () => {
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
