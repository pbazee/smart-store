import { Suspense } from "react";
import type { Metadata } from "next";
import { Bricolage_Grotesque, Space_Grotesk } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { MarketingPopup } from "@/components/layout/marketing-popup";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { RootLayoutShell } from "@/components/layout/root-layout-shell";
import { WhatsAppWidget } from "@/components/layout/whatsapp-widget";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { CartDrawer } from "@/components/shop/cart-drawer";
import { Toaster } from "@/components/ui/toaster";
import { getHomepageShellData } from "@/lib/homepage-data";
import { getAppUrl } from "@/lib/app-url";

const sans = Space_Grotesk({ subsets: ["latin"], variable: "--font-geist-sans" });
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});
const metadataBase = new URL(getAppUrl());

export const metadata: Metadata = {
  metadataBase,
  title: "Smartest Store KE | Shoes, Clothes & Streetwear",
  description: "Kenya's smartest fashion destination. Premium shoes, clothes, and streetwear delivered to your door. Pay with M-Pesa.",
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const homepageShellData = await getHomepageShellData();

  return (
    <ClerkProvider
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      afterSignOutUrl="/"
    >
      <html lang="en" suppressHydrationWarning>
        <body className={`${sans.variable} ${display.variable} font-sans antialiased`}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <RootLayoutShell
              storefrontChrome={
                <>
                  <AnnouncementBar announcements={homepageShellData.announcements} />
              <Suspense fallback={<NavbarFallback />}>
                <Navbar />
              </Suspense>
            </>
              }
              storefrontFooter={
                <Footer
                  socialLinks={homepageShellData.socialLinks}
                  storeSettings={homepageShellData.storeSettings}
                />
              }
              storefrontOverlays={
                <>
                  <MarketingPopup popups={homepageShellData.popups} />
                  <WhatsAppWidget settings={homepageShellData.whatsAppSettings} />
                  <MobileBottomNav />
                  <CartDrawer />
                </>
              }
            >
              {children}
            </RootLayoutShell>
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
