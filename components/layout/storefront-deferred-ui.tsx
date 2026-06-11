"use client";

import dynamic from "next/dynamic";
import type { Popup } from "@/types";

const CartDrawer = dynamic(
  () => import("@/components/shop/cart-drawer").then((module) => module.CartDrawer),
  { ssr: false }
);
const CartSessionSync = dynamic(
  () =>
    import("@/components/shop/cart-session-sync").then((module) => module.CartSessionSync),
  { ssr: false }
);
const MarketingPopupClient = dynamic(
  () =>
    import("@/components/layout/marketing-popup-client").then(
      (module) => module.MarketingPopupClient
    ),
  { ssr: false }
);

export function StorefrontDeferredUI({ popups }: { popups: Popup[] }) {
  return (
    <>
      {popups.length > 0 ? <MarketingPopupClient popups={popups} /> : null}
      <CartDrawer />
      <CartSessionSync />
    </>
  );
}

