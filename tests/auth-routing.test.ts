import { test } from "node:test";
import assert from "node:assert/strict";
import { getAuthRedirectPath } from "../lib/auth-routing";

test("redirects unauthenticated admin traffic to sign-in with callbackUrl", () => {
  assert.equal(
    getAuthRedirectPath({ pathname: "/admin/products", userId: null }),
    "/sign-in?callbackUrl=%2Fadmin%2Fproducts"
  );
});

test("redirects authenticated non-admins away from admin routes", () => {
  assert.equal(
    getAuthRedirectPath({ pathname: "/admin", userId: "user_123", role: "customer" }),
    "/"
  );
});

test("redirects guests from checkout with callbackUrl", () => {
  assert.equal(
    getAuthRedirectPath({ pathname: "/checkout", userId: null }),
    "/sign-in?callbackUrl=%2Fcheckout"
  );
});

test("allows authenticated admin access to admin routes", () => {
  assert.equal(
    getAuthRedirectPath({ pathname: "/admin/orders", userId: "user_123", role: "admin" }),
    null
  );
});
