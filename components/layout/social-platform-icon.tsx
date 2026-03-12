"use client";

import {
  Facebook,
  Instagram,
  Linkedin,
  MessageCircleMore,
  Music2,
  Twitter,
  Youtube,
} from "lucide-react";
import type { SocialLink } from "@/types";

export function SocialPlatformIcon({
  platform,
  className = "h-5 w-5",
}: {
  platform: SocialLink["platform"];
  className?: string;
}) {
  switch (platform) {
    case "instagram":
      return <Instagram className={className} />;
    case "facebook":
      return <Facebook className={className} />;
    case "youtube":
      return <Youtube className={className} />;
    case "linkedin":
      return <Linkedin className={className} />;
    case "whatsapp":
      return <MessageCircleMore className={className} />;
    case "tiktok":
      return <Music2 className={className} />;
    case "x":
      return <Twitter className={className} />;
    default:
      return <span className="text-xs font-black uppercase">{platform}</span>;
  }
}
