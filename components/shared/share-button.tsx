"use client";

import { useEffect, useState } from "react";
import {
  Copy,
  Facebook,
  MessageCircle,
  Send,
  Share2,
  Twitter,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/lib/use-toast";

type ShareButtonProps = {
  title: string;
  text: string;
  url: string;
  label?: string;
  className?: string;
};

export function ShareButton({
  title,
  text,
  url,
  label = "Share",
  className,
}: ShareButtonProps) {
  const { toast } = useToast();
  const [canUseNativeShare, setCanUseNativeShare] = useState(false);

  useEffect(() => {
    setCanUseNativeShare(typeof navigator !== "undefined" && Boolean(navigator.share));
  }, []);

  const openShareWindow = (shareUrl: string) => {
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      return;
    }

    await navigator.share({ title, text, url });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    toast({
      title: "Copied!",
      description: "The link is ready to share.",
    });
  };

  const whatsAppUrl = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={className}>
          <Share2 className="h-4 w-4" />
          {label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[18rem] rounded-[1.35rem] border-orange-500/30 bg-zinc-950 p-2 text-zinc-100"
      >
        <DropdownMenuLabel className="text-[11px] tracking-[0.22em] text-orange-300/80">
          Share
        </DropdownMenuLabel>
        <DropdownMenuItem
          className="rounded-2xl"
          onSelect={() => openShareWindow(whatsAppUrl)}
        >
          <MessageCircle className="h-4 w-4 text-orange-400" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem
          className="rounded-2xl"
          onSelect={() => openShareWindow(twitterUrl)}
        >
          <Twitter className="h-4 w-4 text-orange-400" />
          X (Twitter)
        </DropdownMenuItem>
        <DropdownMenuItem
          className="rounded-2xl"
          onSelect={() => openShareWindow(facebookUrl)}
        >
          <Facebook className="h-4 w-4 text-orange-400" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem
          className="rounded-2xl"
          onSelect={() => {
            void handleCopy();
          }}
        >
          <Copy className="h-4 w-4 text-orange-400" />
          Copy Link
        </DropdownMenuItem>
        {canUseNativeShare ? (
          <>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem
              className="rounded-2xl"
              onSelect={() => {
                void handleNativeShare();
              }}
            >
              <Send className="h-4 w-4 text-orange-400" />
              More Options
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
