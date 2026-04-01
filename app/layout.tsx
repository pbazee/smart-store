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
    <div className="sticky top-0 z-50 border-b border-border/70 bg-background/92 backdrop-blur-xl">
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
    <div className="relative z-[60] border-b border-white/15 bg-gradient-to-r from-[#ff6b00] via-[#ff7a00] to-[#ff3d2e] px-4 py-2 shadow-[0_10px_32px_rgba(255,107,0,0.2)]">
      <div className="mx-auto h-5 max-w-7xl rounded-full bg-white/20" />
    </div>
  );
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const shellData = await getHomepageShellData().catch(() => ({
    announcements: [],
    popups: [],
    socialLinks: [],
    whatsAppSettings: null,
    storeSettings: null,
  }));

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("font-sans", sans.variable, display.variable)}
    >
      <body className="font-sans antialiased">
        <SupabaseProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <RootLayoutShell
              storefrontChrome={
                <>
                  <Suspense fallback={<AnnouncementBarFallback />}>
                    <AnnouncementBar announcements={shellData.announcements} />
                  </Suspense>
                  <Suspense fallback={<NavbarFallback />}>
                    <Navbar />
                  </Suspense>
                </>
              }
              storefrontFooter={
                <Suspense fallback={<FooterFallback />}>
                  <Footer
                    socialLinks={shellData.socialLinks}
                    storeSettings={shellData.storeSettings}
                  />
                </Suspense>
              }
              storefrontOverlays={
                <>
                  <WhatsAppWidget settings={shellData.whatsAppSettings} />
                  <StorefrontDeferredUI popups={shellData.popups} />
                </>
              }
            >
              {children}
            </RootLayoutShell>
          </ThemeProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
