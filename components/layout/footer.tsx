import Link from "next/link";
import { CreditCard, MapPin, Shield, Smartphone } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 bg-zinc-950 text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-brand-500">
                <span className="text-xs font-bold text-white">SK</span>
              </div>
              <span className="text-lg font-bold text-white">
                Smartest Store <span className="text-brand-500">KE</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              Kenya&apos;s smartest fashion destination. Premium shoes, clothes, and streetwear.
              Nairobi-born, East Africa-ready.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">Shop</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: "All Products", href: "/products" },
                { label: "Sneakers", href: "/category/shoes" },
                { label: "Streetwear", href: "/category/tshirts" },
                { label: "New Arrivals", href: "/products?filter=new" },
                { label: "Trending", href: "/products?filter=trending" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="transition-colors hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">Help</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: "Size Guide", href: "/faq" },
                { label: "Returns", href: "/returns" },
                { label: "Track Order", href: "/track-order" },
                { label: "Wishlist", href: "/wishlist" },
                { label: "Contact Us", href: "/contact" },
                { label: "FAQ", href: "/faq" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="transition-colors hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">We Accept</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Smartphone className="h-4 w-4 text-green-400" />
                <span>M-Pesa (Safaricom)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-blue-400" />
                <span>Visa / Mastercard</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-brand-400" />
                <span>Nairobi same-day delivery available</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-purple-400" />
                <span>SSL secure checkout</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-zinc-800 pt-8 text-sm sm:flex-row">
          <p>&copy; 2026 Smartest Store KE. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="transition-colors hover:text-white">
              Privacy
            </Link>
            <Link href="/privacy-policy" className="transition-colors hover:text-white">
              Terms
            </Link>
            <span className="font-semibold text-brand-500">Made in Kenya</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
