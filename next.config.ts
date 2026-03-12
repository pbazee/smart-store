import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;
const remotePatterns: NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]> = [
  { protocol: "https", hostname: "images.unsplash.com" },
  { protocol: "https", hostname: "plus.unsplash.com" },
  { protocol: "https", hostname: "images.pexels.com" },
  { protocol: "https", hostname: "i.ebayimg.com", pathname: "/**" },
  { protocol: "https", hostname: "**.ebayimg.com", pathname: "/**" },
];

if (supabaseHostname) {
  remotePatterns.push({ protocol: "https", hostname: supabaseHostname });
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
  experimental: {
    ppr: false,
  },
};

export default nextConfig;
