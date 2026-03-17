import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { CreditCard, MapPin, Shield, Smartphone } from "lucide-react";
import { FooterNewsletterForm } from "@/components/layout/footer-newsletter-form";
import { SocialPlatformIcon } from "@/components/layout/social-platform-icon";
import { getSocialLinks } from "@/lib/social-link-service";
import { getStoreSettings } from "@/lib/store-settings";
import type { SocialLink, StoreSettings } from "@/types";

export async function Footer({
  socialLinks: providedSocialLinks,
  storeSettings,
}: {
  socialLinks?: SocialLink[];
  storeSettings?: StoreSettings | null;
}) {
  let socialLinks = providedSocialLinks;
  let resolvedStoreSettings = storeSettings;

  if (!socialLinks || typeof resolvedStoreSettings === "undefined") {
    noStore();
    const [resolvedSocialLinks, fetchedStoreSettings] = await Promise.all([
      socialLinks
        ? Promise.resolve(socialLinks)
        : getSocialLinks({ seedIfEmpty: true }),
      typeof resolvedStoreSettings === "undefined"
        ? getStoreSettings({ seedIfEmpty: true })
        : Promise.resolve(resolvedStoreSettings),
    ]);

    socialLinks = resolvedSocialLinks;
    resolvedStoreSettings = fetchedStoreSettings;
  }

  const supportEmail = resolvedStoreSettings?.supportEmail || "support@smarteststore.ke";
  const supportPhone = resolvedStoreSettings?.supportPhone || "+254 700 123 456";

  const normalizedTel = supportPhone.replace(/[^+\\d]/g, "");

  return (
    <footer className="mt-20 bg-zinc-950 text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 grid grid-cols-1 gap-8 xl:grid-cols-[1.1fr,0.9fr,0.9fr,0.9fr,1.2fr]">
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

          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900/60 p-6">
            <FooterNewsletterForm />
          </div>
        </div>

        <div className="flex flex-col gap-5 border-t border-zinc-800 pt-8 text-sm xl:flex-row xl:items-center xl:justify-between">
          <p>&copy; 2026 Smartest Store KE. All rights reserved.</p>
          {socialLinks.length > 0 && (
            <div className="flex items-center justify-center gap-3 overflow-x-auto xl:flex-1 xl:justify-center">
              {socialLinks.map((socialLink) => (
                <a
                  key={socialLink.id}
                  href={socialLink.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${socialLink.platform}`}
                  className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/80 text-zinc-300 transition-all hover:-translate-y-0.5 hover:border-brand-400 hover:bg-zinc-900 hover:text-white"
                >
                  <SocialPlatformIcon platform={socialLink.platform} className="h-5 w-5" />
                </a>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-2 text-sm text-zinc-300 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex flex-wrap items-center gap-4">
              <a
                href={`mailto:${supportEmail}`}
                className="transition-colors hover:text-white"
              >
                Support: {supportEmail}
              </a>
              <a
                href={`tel:${normalizedTel}`}
                className="transition-colors hover:text-white"
              >
                Call: {supportPhone}
              </a>
            </div>
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
      </div>
    </footer>
  );
}
