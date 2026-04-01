"use client";

import dynamic from "next/dynamic";
import type { Popup } from "@/types";

const MobileBottomNav = dynamic(
  () =>
    import("@/components/layout/mobile-bottom-nav").then((module) => module.MobileBottomNav),
  { ssr: false }
);
const CartDrawer = dynamic(
  () => import("@/components/shop/cart-drawer").then((module) => module.CartDrawer),
  { ssr: false }
);
const CartSessionSync = dynamic(
  () =>
    import("@/components/shop/cart-session-sync").then((module) => module.CartSessionSync),
  { ssr: false }
);
const WishlistSessionSync = dynamic(
  () =>
    import("@/components/shop/wishlist-session-sync").then(
      (module) => module.WishlistSessionSync
    ),
  { ssr: false }
);
const MarketingPopupClient = dynamic(
  () =>
    import("@/components/layout/marketing-popup-client").then(
      (module) => module.MarketingPopupClient
    ),
  { ssr: false }
);
const Toaster = dynamic(
  () => import("@/components/ui/toaster").then((module) => module.Toaster),
  { ssr: false }
);

export function StorefrontDeferredUI({ popups }: { popups: Popup[] }) {
  return (
    <>
      {popups.length > 0 ? <MarketingPopupClient popups={popups} /> : null}
      <MobileBottomNav />
      <CartDrawer />
      <CartSessionSync />
      <WishlistSessionSync />
      <Toaster />
    </>
  );
}
