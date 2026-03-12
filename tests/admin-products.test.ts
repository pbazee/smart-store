import { test } from "node:test";
import assert from "node:assert/strict";
import { buildAdminProductCreateData, buildAdminProductDeleteOperations, normalizeAdminGender } from "../lib/admin-products";

test("admin product creation standardizes Clerk-era product gender values", () => {
  assert.equal(normalizeAdminGender("male"), "men");
  assert.equal(normalizeAdminGender("female"), "women");
  assert.equal(normalizeAdminGender("unisex"), "unisex");
});

test("admin product create payload preserves variants for product CRUD", () => {
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
  assert.equal(data.variants.create.length, 1);
  assert.deepEqual(data.variants.create[0], {
    color: "Orange",
    colorHex: "#ff6600",
    size: "40",
    stock: 5,
    price: 8200,
  });
});

test("admin product delete plan removes variants before the product", () => {
  assert.deepEqual(buildAdminProductDeleteOperations("prod_123"), {
    variantWhere: { productId: "prod_123" },
    productWhere: { id: "prod_123" },
  });
});
