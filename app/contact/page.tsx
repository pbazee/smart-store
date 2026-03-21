import Link from "next/link";
import { Clock3, Mail, MapPin, MessageCircleMore, Phone } from "lucide-react";
import { DEFAULT_STORE_SETTINGS } from "@/lib/default-store-settings";
import { getStoreSettings } from "@/lib/store-settings";
import { buildWhatsAppHref, getWhatsAppSettings } from "@/lib/whatsapp-service";

export default async function ContactPage() {
  const [storeSettings, whatsAppSettings] = await Promise.all([
    getStoreSettings({ seedIfEmpty: true }),
    getWhatsAppSettings({ seedIfEmpty: true }),
  ]);

  const supportEmail = storeSettings?.supportEmail || DEFAULT_STORE_SETTINGS.supportEmail;
  const supportPhone = storeSettings?.supportPhone || DEFAULT_STORE_SETTINGS.supportPhone;
  const contactPhone =
    storeSettings?.contactPhone ||
    storeSettings?.footerContactPhone ||
    supportPhone;
  const whatsappHref =
    whatsAppSettings?.isActive && whatsAppSettings.phoneNumber.trim()
      ? buildWhatsAppHref(whatsAppSettings.phoneNumber, whatsAppSettings.defaultMessage)
      : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-12 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-500">
          Support
        </p>
        <h1 className="mt-3 text-4xl font-black text-foreground">Contact Us</h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">
          Reach the Smartest Store KE team for order help, product questions, exchanges,
          and delivery support. We respond through the channels below during business hours.
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr),minmax(360px,0.95fr)]">
        <div className="space-y-5">
          <div className="rounded-[1.75rem] border border-border bg-card p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-[1.5rem] bg-muted/50 p-5">
                <Phone className="h-5 w-5 text-brand-500" />
                <h2 className="mt-4 text-lg font-black">Call Us</h2>
                <p className="mt-2 text-sm text-muted-foreground">{contactPhone}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Fastest for delivery coordination and urgent order questions.
                </p>
              </div>

              <div className="rounded-[1.5rem] bg-muted/50 p-5">
                <Mail className="h-5 w-5 text-brand-500" />
                <h2 className="mt-4 text-lg font-black">Email Support</h2>
                <p className="mt-2 text-sm text-muted-foreground">{supportEmail}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Best for returns, size exchanges, and anything needing attachments.
                </p>
              </div>

              <div className="rounded-[1.5rem] bg-muted/50 p-5">
                <Clock3 className="h-5 w-5 text-brand-500" />
                <h2 className="mt-4 text-lg font-black">Support Hours</h2>
                <p className="mt-2 text-sm text-muted-foreground">Monday to Saturday</p>
                <p className="mt-2 text-sm text-muted-foreground">9:00 AM to 6:00 PM EAT</p>
              </div>

              <div className="rounded-[1.5rem] bg-muted/50 p-5">
                <MapPin className="h-5 w-5 text-brand-500" />
                <h2 className="mt-4 text-lg font-black">Store Base</h2>
                <p className="mt-2 text-sm text-muted-foreground">Westlands Shopping Centre</p>
                <p className="mt-2 text-sm text-muted-foreground">Nairobi, Kenya</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-border bg-card p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
            <h2 className="text-2xl font-black">Need help right now?</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Use the channel that fits the issue. Phone is best for delivery timing. Email is
              best when you need to share screenshots, receipts, or return details.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={`tel:${contactPhone?.replace(/\s+/g, "")}`}
                className="inline-flex items-center justify-center rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
              >
                Call Support
              </a>
              <a
                href={`mailto:${supportEmail}`}
                className="inline-flex items-center justify-center rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                Email Support
              </a>
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-500/15 dark:text-emerald-300"
                >
                  <MessageCircleMore className="h-4 w-4" />
                  Chat on WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-border bg-card p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
          <h2 className="text-2xl font-black">Send Us a Message</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Prefer email? Send the essentials and our support team will reply from{" "}
            <span className="font-semibold text-foreground">{supportEmail}</span>.
          </p>

          <form className="mt-8 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">First Name</label>
                <input
                  type="text"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Last Name</label>
                <input
                  type="text"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Email</label>
              <input
                type="email"
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="john@email.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Subject</label>
              <select className="w-full rounded-2xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option>General Inquiry</option>
                <option>Order Support</option>
                <option>Product Question</option>
                <option>Return Request</option>
                <option>Partnership</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Message</label>
              <textarea
                rows={6}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="How can we help you?"
              />
            </div>

            <div className="rounded-[1.5rem] bg-muted/50 p-4 text-sm text-muted-foreground">
              Support replies come from{" "}
              <span className="font-semibold text-foreground">{supportEmail}</span>. Include
              your order number when the message is about delivery, payment, or returns so the
              team can help faster.
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-brand-500 px-6 py-3 font-semibold text-white transition hover:bg-brand-600"
            >
              Send Message
            </button>
          </form>

          <p className="mt-6 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Looking for quick answers?{" "}
            <Link href="/faq" className="font-semibold text-brand-500 hover:text-brand-600">
              Browse the FAQ
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
