"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { Popup } from "@/types";

function isInternalLink(link: string) {
  return link.startsWith("/");
}

function getDismissedKey(popup: Popup) {
  return `marketing-popup-dismissed:${popup.id}:${new Date(popup.updatedAt).getTime()}`;
}

function matchesPopupTarget(showOn: Popup["showOn"], pathname: string) {
  if (showOn === "all") {
    return true;
  }

  if (showOn === "homepage") {
    return pathname === "/";
  }

  if (showOn === "shop") {
    return pathname === "/shop";
  }

  if (showOn === "product") {
    return pathname.startsWith("/product/");
  }

  return false;
}

export function MarketingPopupClient({ popups }: { popups: Popup[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [rememberDismissal, setRememberDismissal] = useState(true);

  const activePopup = useMemo(() => {
    return popups.find((popup) => matchesPopupTarget(popup.showOn, pathname));
  }, [pathname, popups]);

  useEffect(() => {
    if (!activePopup) {
      setOpen(false);
      return;
    }

    const dismissedKey = getDismissedKey(activePopup);
    if (window.localStorage.getItem(dismissedKey)) {
      setOpen(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setOpen(true);
    }, activePopup.delaySeconds * 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activePopup]);

  useEffect(() => {
      setRememberDismissal(true);
  }, [activePopup?.id]);

  if (!activePopup) {
    return null;
  }

  const handleDismiss = () => {
    if (rememberDismissal) {
      window.localStorage.setItem(getDismissedKey(activePopup), "1");
    }

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? handleDismiss() : setOpen(nextOpen))}>
      <DialogContent className="max-w-xl overflow-hidden border-zinc-800 bg-zinc-950 p-0 text-zinc-100">
        {activePopup.imageUrl ? (
          <div className="relative h-56 w-full">
            <Image
              src={activePopup.imageUrl}
              alt={activePopup.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 640px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/25 to-transparent" />
          </div>
        ) : null}

        <div className="space-y-5 p-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-400/20 bg-brand-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-brand-300">
            <Sparkles className="h-3.5 w-3.5" />
            Limited drop
          </div>

          <div className="space-y-3">
            <DialogTitle className="text-3xl text-white">{activePopup.title}</DialogTitle>
            <DialogDescription className="text-base leading-7 text-zinc-300">
              {activePopup.message}
            </DialogDescription>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="inline-flex items-center gap-3 text-sm text-zinc-400">
              <input
                type="checkbox"
                checked={rememberDismissal}
                onChange={(event) => setRememberDismissal(event.target.checked)}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-950"
              />
              Don&apos;t show again
            </label>

            {isInternalLink(activePopup.ctaLink) ? (
              <Link
                href={activePopup.ctaLink}
                onClick={handleDismiss}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
              >
                {activePopup.ctaText}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <a
                href={activePopup.ctaLink}
                onClick={handleDismiss}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
              >
                {activePopup.ctaText}
                <ArrowRight className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
