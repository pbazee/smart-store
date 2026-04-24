import { test } from "node:test";
import assert from "node:assert/strict";
import { getAuthRedirectPath } from "../lib/auth-routing";

test("redirects unauthenticated admin traffic to Clerk sign-in with redirect", () => {
  assert.equal(
    getAuthRedirectPath({ pathname: "/admin/products", userId: null }),
    "/sign-in?redirect_url=%2Fadmin%2Fproducts"
  );
});

test("redirects authenticated non-admins away from admin routes", () => {
  assert.equal(
    getAuthRedirectPath({ pathname: "/admin", userId: "user_123", role: "customer" }),
    "/"
  );
});

test("allows guests to access checkout", () => {
  assert.equal(
    getAuthRedirectPath({ pathname: "/checkout", userId: null }),
    null
  );
});

test("allows authenticated admin access to admin routes", () => {
  assert.equal(
    getAuthRedirectPath({ pathname: "/admin/orders", userId: "user_123", role: "admin" }),
    null
  );
});
