import Link from "next/link";
import { MessageCircleMore, NotebookText, Phone } from "lucide-react";
import { getFAQs } from "@/lib/faq-service";
import { getSupportContactInfo } from "@/lib/support-contact";
import { buildWhatsAppHref, getWhatsAppSettings } from "@/lib/whatsapp-service";

export default async function FAQPage() {
  const [faqs, supportInfo, whatsAppSettings] = await Promise.all([
    getFAQs({ onlyActive: true }),
    getSupportContactInfo(),
    getWhatsAppSettings({ seedIfEmpty: true, fallbackOnError: true }),
  ]);

  const { supportPhone, supportTel } = supportInfo;
  const whatsappHref =
    whatsAppSettings?.isActive && whatsAppSettings.phoneNumber.trim()
      ? buildWhatsAppHref(whatsAppSettings.phoneNumber, whatsAppSettings.defaultMessage)
      : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-500">Help Center</p>
        <h1 className="mt-3 text-4xl font-black text-foreground">Frequently Asked Questions</h1>
        <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
          Answers to the most common questions about delivery, payment, returns, and shopping with
          Smartest Store KE.
        </p>
      </div>

      <div className="mt-12 space-y-5">
        {faqs.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-border bg-card px-6 py-12 text-center">
            <NotebookText className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-semibold text-foreground">FAQs are being updated</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Reach support directly while the help center is refreshed.
            </p>
          </div>
        ) : (
          faqs.map((faq) => (
            <div
              key={faq.id}
              className="rounded-[1.75rem] border border-border bg-card p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"
            >
              <h2 className="text-xl font-black text-foreground">{faq.question}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{faq.answer}</p>
            </div>
          ))
        )}
      </div>

      <div className="mt-12 rounded-[2rem] border border-border bg-card p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <h2 className="text-2xl font-black text-foreground">Still need help?</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          If your question is not covered here, our support team can help with order updates,
          delivery questions, and product guidance.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-full bg-brand-500 px-6 py-3 font-semibold text-white transition hover:bg-brand-600"
          >
            Contact Us
          </Link>
          <a
            href={`tel:${supportTel}`}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-3 font-semibold text-foreground transition hover:bg-muted"
          >
            <Phone className="h-4 w-4" />
            Call {supportPhone}
          </a>
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-6 py-3 font-semibold text-emerald-700 transition hover:bg-emerald-500/15 dark:text-emerald-300"
            >
              <MessageCircleMore className="h-4 w-4" />
              WhatsApp Support
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
