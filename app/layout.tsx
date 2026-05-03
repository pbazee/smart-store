import { Suspense } from "react";
import type { Metadata } from "next";
import { Bricolage_Grotesque, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { RootLayoutShell } from "@/components/layout/root-layout-shell";
import { StorefrontDeferredUI } from "@/components/layout/storefront-deferred-ui";
import { WhatsAppWidget } from "@/components/layout/whatsapp-widget";
import { ProvidersClient } from "@/components/providers/providers-client";
import { SupabaseProvider } from "@/components/supabase-provider";
import { getAppUrl } from "@/lib/app-url";
import { getHomepageShellData } from "@/lib/homepage-data";
import { cn } from "@/lib/utils";

const sans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const metadataBase = new URL(getAppUrl());

export const metadata: Metadata = {
  metadataBase,
  title: "Smartest Store KE | Shoes, Clothes & Streetwear",
  description:
    "Kenya's smartest fashion destination. Premium shoes, clothes, and streetwear delivered to your door. Pay with M-Pesa.",
  keywords: "shoes kenya, clothes nairobi, streetwear kenya, fashion nairobi, mpesa",
  openGraph: {
    title: "Smartest Store KE",
    description: "Kenya's coolest fashion store",
    images: ["/og-image.jpg"],
  },
};

function NavbarFallback() {
  return (
    <div className="frosted-surface border-b border-border/70 bg-transparent">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="h-[52px] rounded-full bg-muted/40" />
      </div>
    </div>
  );
}

function FooterFallback() {
  return (
    <div className="mt-20 border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <div className="h-5 w-28 rounded-full bg-zinc-800" />
              <div className="h-4 w-full rounded-full bg-zinc-900" />
              <div className="h-4 w-4/5 rounded-full bg-zinc-900" />
              <div className="h-4 w-3/5 rounded-full bg-zinc-900" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnnouncementBarFallback() {
  return (
    <div className="w-full max-w-full overflow-hidden border-b border-white/15 bg-gradient-to-r from-[#ff6b00] via-[#ff7a00] to-[#ff3d2e] px-4 py-2 shadow-[0_10px_32px_rgba(255,107,0,0.2)]">
      <div className="mx-auto h-5 max-w-7xl rounded-full bg-white/20" />
    </div>
  );
}

const FALLBACK_HOMEPAGE_SHELL_DATA = {
  announcements: [],
  popups: [],
  socialLinks: [],
  whatsAppSettings: null,
  storeSettings: null,
  navigationCategories: [],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const shellData = await getHomepageShellData().catch(() => FALLBACK_HOMEPAGE_SHELL_DATA);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("font-sans", sans.variable, display.variable)}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link
            rel="preconnect"
            href={new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin}
            crossOrigin="anonymous"
          />
        )}
        {shellData.storeSettings?.faviconUrl ? (
          <link rel="icon" href={shellData.storeSettings.faviconUrl} />
        ) : null}
      </head>
      <body
        className="font-sans antialiased"
        style={{ ["--storefront-header-height" as string]: "104px" }}
      >
        <SupabaseProvider>
          <ProvidersClient>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <RootLayoutShell
                storefrontChrome={
                  <div key="storefront-chrome">
                    <Suspense fallback={<AnnouncementBarFallback />}>
                      <AnnouncementBar announcements={shellData.announcements} />
                    </Suspense>
                    <Suspense fallback={<NavbarFallback />}>
                      <Navbar
                        initialStoreSettings={shellData.storeSettings}
                        initialCategories={shellData.navigationCategories}
                      />
                    </Suspense>
                  </div>
                }
                storefrontFooter={
                  <Suspense key="storefront-footer" fallback={<FooterFallback />}>
                    <Footer
                      socialLinks={shellData.socialLinks}
                      storeSettings={shellData.storeSettings}
                    />
                  </Suspense>
                }
                storefrontOverlays={
                  <div key="storefront-overlays">
                    <WhatsAppWidget settings={shellData.whatsAppSettings} />
                    <StorefrontDeferredUI popups={shellData.popups} />
                  </div>
                }
              >
                {children}
              </RootLayoutShell>
            </ThemeProvider>
          </ProvidersClient>
        </SupabaseProvider>
      </body>
    </html>
  );
}
