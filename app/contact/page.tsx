import { Clock3, Mail, MapPin, MessageCircleMore, Phone } from "lucide-react";
import { getSupportContactInfo } from "@/lib/support-contact";
import { buildWhatsAppHref, getWhatsAppSettings } from "@/lib/whatsapp-service";
import { ContactFormCard } from "./contact-form-card";

export default async function ContactPage() {
  const [supportInfo, whatsAppSettings] = await Promise.all([
    getSupportContactInfo(),
    getWhatsAppSettings({ seedIfEmpty: true, fallbackOnError: true }),
  ]);

  const { supportEmail, contactPhone, contactTel } = supportInfo;
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
                href={`tel:${contactTel}`}
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

        <ContactFormCard supportEmail={supportEmail} />
      </div>
    </div>
  );
}
