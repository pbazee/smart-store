"use client";
import { useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ShoppingBag, Search, Menu, X, Sun, Moon } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { href: "/shop", label: "Shop All" },
  { href: "/shop?category=shoes", label: "Shoes" },
  { href: "/shop?category=clothes", label: "Clothes" },
  { href: "/shop?tags=new-arrival", label: "New Arrivals" },
  { href: "/shop?tags=trending", label: "Trending" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { itemCount, toggleCart } = useCartStore();
  const count = itemCount();

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-sm flex items-center justify-center">
              <span className="text-white font-bold text-xs">SK</span>
            </div>
            <span className="font-bold text-lg tracking-tight hidden sm:block">
              Smartest Store <span className="text-brand-500">KE</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-md hover:bg-muted transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-md hover:bg-muted transition-colors"
            >
              <Sun className="w-5 h-5 dark:hidden" />
              <Moon className="w-5 h-5 hidden dark:block" />
            </button>
            <button
              onClick={toggleCart}
              className="p-2 rounded-md hover:bg-muted transition-colors relative"
              suppressHydrationWarning
            >
              <ShoppingBag className="w-5 h-5" />
              {count > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-brand-500 text-white rounded-full text-xs flex items-center justify-center font-bold"
                >
                  {count}
                </motion.span>
              )}
            </button>
            <button
              className="md:hidden p-2 rounded-md hover:bg-muted"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden pb-3"
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value;
                  window.location.href = `/shop?search=${encodeURIComponent(q)}`;
                }}
              >
                <input
                  name="q"
                  type="text"
                  autoFocus
                  placeholder="Search shoes, hoodies, dresses..."
                  className="w-full px-4 py-2 rounded-lg border border-border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden border-t border-border md:hidden"
          >
            <nav className="flex flex-col gap-1 p-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 rounded-md hover:bg-muted text-sm font-medium"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
