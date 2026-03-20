import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Bell,
  MapPin,
  MessageCircleMore,
  NotebookText,
  Phone,
  Share,
  Sparkles,
} from "lucide-react";
import { fetchAdminStoreSettings } from "@/app/admin/settings/actions";
import { fetchAdminFAQs } from "@/app/admin/settings/faq-actions";
import { FAQManager } from "@/app/admin/settings/faq-manager";
import { StoreSettingsForm } from "@/app/admin/settings/store-settings-form";
import { fetchAdminWhatsAppSettings } from "@/app/admin/whatsapp-settings/actions";
import { WhatsAppSettingsForm } from "@/app/admin/whatsapp-settings/whatsapp-settings-form";
import { requireAdminAuth } from "@/lib/auth-utils";

const GLOBAL_CONTROL_LINKS = [
  {
    href: "/admin/announcements",
    label: "Announcements",
    description: "Control promos, alerts, and top-bar merchandising messages.",
    icon: Bell,
  },
  {
    href: "/admin/social-links",
    label: "Social Links",
    description: "Keep footer and brand social destinations current across the site.",
    icon: Share,
  },
  {
    href: "/admin/shipping-rules",
    label: "Shipping Rules",
    description: "Adjust delivery pricing, regions, and checkout fulfilment rules.",
    icon: MapPin,
  },
  {
    href: "/admin/popups",
    label: "Popups",
    description: "Manage launch overlays, homepage campaigns, and timed promos.",
    icon: Sparkles,
  },
];

export default async function AdminSettingsPage() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    redirect("/sign-in?redirect_url=%2Fadmin%2Fsettings");
  }

  const [settings, faqs, whatsAppSettings] = await Promise.all([
    fetchAdminStoreSettings(),
    fetchAdminFAQs(),
    fetchAdminWhatsAppSettings(),
  ]);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-zinc-800 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.16),transparent_35%),linear-gradient(180deg,rgba(24,24,27,0.98),rgba(9,9,11,0.98))] p-6 shadow-2xl shadow-black/20 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-400">
          Global Controls
        </p>
        <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">Settings</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">
          Manage customer support touchpoints, the floating WhatsApp widget, FAQ content,
          and the storefront-wide controls that shape how Smartest Store KE feels in production.
        </p>
      </section>

      <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950/80 p-6 shadow-xl shadow-black/25 sm:p-8">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
            <MessageCircleMore className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Floating WhatsApp</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Set the phone number, widget position, and on/off state for the storefront chat shortcut.
            </p>
          </div>
        </div>

        <WhatsAppSettingsForm initialSettings={whatsAppSettings} showHeading={false} />
      </section>

      <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950/80 p-6 shadow-xl shadow-black/25 sm:p-8">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-300">
            <Phone className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Contact & Support</h2>
            <p className="mt-2 text-sm text-zinc-400">
              These values power the Contact Us page, footer support blocks, and where new order notifications land.
            </p>
          </div>
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900/80 p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">
              Contact Us Page
            </p>
            <p className="mt-3 text-lg font-black text-white">Customer-facing channels</p>
            <p className="mt-2 text-sm text-zinc-400">
              The contact page will reflect your saved support email, support phone, and fallback contact number automatically.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900/80 p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">
              Support Workflow
            </p>
            <p className="mt-3 text-lg font-black text-white">Alerts & help routing</p>
            <p className="mt-2 text-sm text-zinc-400">
              Admin notification email stays dedicated to order operations while customer support details remain storefront-facing.
            </p>
          </div>
        </div>

        <StoreSettingsForm initialSettings={settings} showHeading={false} />
      </section>

      <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950/80 p-6 shadow-xl shadow-black/25 sm:p-8">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300">
            <NotebookText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">FAQs</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Approve, edit, reorder, and retire the answers customers see on the FAQ page.
            </p>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950 p-6">
          <FAQManager initialFAQs={faqs} />
        </div>
      </section>

      <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950/80 p-6 shadow-xl shadow-black/25 sm:p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-white">Other Global Site Settings</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Related controls that shape the storefront experience outside support and FAQs.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {GLOBAL_CONTROL_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-[1.5rem] border border-zinc-800 bg-zinc-900/80 p-5 transition hover:border-zinc-700 hover:bg-zinc-900"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-300 transition group-hover:bg-brand-500/20">
                <item.icon className="h-5 w-5" />
              </div>
              <p className="mt-5 text-lg font-black text-white">{item.label}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{item.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
