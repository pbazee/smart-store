import { unstable_noStore as noStore } from "next/cache";
import { MessageCircleMore } from "lucide-react";
import { buildWhatsAppHref, getWhatsAppSettings } from "@/lib/whatsapp-service";
import { cn } from "@/lib/utils";
import type { WhatsAppSettings } from "@/types";

export async function WhatsAppWidget({
  settings: providedSettings,
}: {
  settings?: WhatsAppSettings | null;
}) {
  let settings = providedSettings;

  if (typeof settings === "undefined") {
    noStore();
    settings = await getWhatsAppSettings({ seedIfEmpty: true });
  }

  if (!settings || !settings.isActive || !settings.phoneNumber.trim()) {
    return null;
  }

  return (
    <a
      href={buildWhatsAppHref(settings.phoneNumber, settings.defaultMessage)}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className={cn(
        "fixed bottom-24 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#22c55e] text-white shadow-[0_18px_36px_rgba(34,197,94,0.38)] transition-transform hover:scale-105 md:bottom-6",
        settings.position === "left"
          ? "left-4 md:left-6"
          : "right-4 md:right-6"
      )}
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-[#22c55e]/30" />
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#22c55e]">
        <MessageCircleMore className="h-7 w-7" />
      </span>
    </a>
  );
}
