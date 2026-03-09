import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CartDrawer } from "@/components/shop/cart-drawer";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Smartest Store KE | Shoes, Clothes & Streetwear",
  description: "Kenya's smartest fashion destination. Premium shoes, clothes, and streetwear delivered to your door. Pay with M-Pesa.",
  keywords: "shoes kenya, clothes nairobi, streetwear kenya, fashion nairobi, mpesa",
  openGraph: {
    title: "Smartest Store KE",
    description: "Kenya's coolest fashion store",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <CartDrawer />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
