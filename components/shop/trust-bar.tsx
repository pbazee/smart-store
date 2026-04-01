import { Smartphone, Truck, Shield, RotateCcw } from "lucide-react";

const trust = [
  { icon: Smartphone, text: "Pay with M-Pesa", sub: "Instant & Secure", color: "text-green-500" },
  { icon: Truck, text: "Nairobi Delivery", sub: "1-2 Business Days", color: "text-blue-500" },
  { icon: Shield, text: "Secure Shopping", sub: "256-bit SSL", color: "text-purple-500" },
  { icon: RotateCcw, text: "Easy Returns", sub: "30-Day Policy", color: "text-brand-500" },
];

export function TrustBar() {
  return (
    <section className="border-y border-border bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {trust.map((item) => (
            <div
              key={item.text}
              className="flex items-center gap-3 p-3 rounded-xl"
            >
              <div className={`p-2 rounded-lg bg-background border border-border ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold">{item.text}</p>
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
