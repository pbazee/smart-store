import Link from "next/link";
import { Smartphone, MapPin, Shield, CreditCard } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-zinc-950 text-zinc-400 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand-500 rounded-sm flex items-center justify-center">
                <span className="text-white font-bold text-xs">SK</span>
              </div>
              <span className="font-bold text-lg text-white">
                Smartest Store <span className="text-brand-500">KE</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              Kenya&apos;s smartest fashion destination. Premium shoes, clothes, and streetwear. 
              Nairobi-born, Kenya-loved.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              {["All Products", "Shoes", "Clothes", "New Arrivals", "Trending", "Sale"].map((item) => (
                <li key={item}>
                  <Link href="/shop" className="hover:text-white transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Help</h4>
            <ul className="space-y-2 text-sm">
              {["Size Guide", "Shipping Info", "Returns", "Track Order", "Contact Us", "FAQ"].map((item) => (
                <li key={item}>
                  <Link href="#" className="hover:text-white transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">We Accept</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Smartphone className="w-4 h-4 text-green-400" />
                <span>M-Pesa (Safaricom)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="w-4 h-4 text-blue-400" />
                <span>Visa / Mastercard</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-brand-400" />
                <span>Nairobi Delivery (1-2 days)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4 text-purple-400" />
                <span>SSL Secure Checkout</span>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-zinc-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <p>© 2025 Smartest Store KE. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <span className="text-brand-500 font-semibold">🇰🇪 Made in Kenya</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
