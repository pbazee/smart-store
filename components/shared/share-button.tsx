"use client";

import { Share2 } from "lucide-react";
import { useToast } from "@/lib/use-toast";

type ShareButtonProps = {
  title: string;
  text: string;
  url: string;
  imageUrl?: string;
  label?: string;
  className?: string;
};

export function ShareButton({
  title,
  text,
  url,
  imageUrl,
  label = "Share",
  className,
}: ShareButtonProps) {
  const { toast } = useToast();

  const handleShare = async () => {
    if (navigator.share) {
      const shareData: ShareData = {
        title,
        text,
        url, // always include URL so native share dialogs on desktop show it
      };

      // Only attach an image file on mobile where the share sheet supports it.
      // On desktop (Windows/macOS) passing `files` causes the URL to be silently
      // dropped from the native share dialog.
      const isMobile = /mobile|android|iphone|ipad|ipod/i.test(navigator.userAgent);
      if (isMobile && imageUrl && navigator.canShare) {
        try {
          const response = await fetch(imageUrl, { cache: "force-cache" });
          const blob = await response.blob();
          const extension = blob.type.includes("png")
            ? "png"
            : blob.type.includes("webp")
              ? "webp"
              : "jpg";
          const files = [
            new File([blob], `product-share.${extension}`, {
              type: blob.type || "image/jpeg",
            }),
          ];

          if (navigator.canShare({ files })) {
            await navigator.share({ ...shareData, files });
            return;
          }
        } catch {
          // Remote image fetch blocked — fall through to URL-only share
        }
      }

      await navigator.share(shareData);
      return;
    }

    // Fallback: copy link to clipboard
    await navigator.clipboard.writeText(url);
    toast({
      title: "Link copied!",
      description: "The product link is ready to paste and share.",
    });
  };

  return (
    <button
      type="button"
      className={className}
      onClick={() => void handleShare()}
    >
      <Share2 className="h-4 w-4" />
      {label}
    </button>
  );
}
