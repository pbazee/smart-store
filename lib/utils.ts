import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { shouldUseMockData } from "@/lib/live-data-mode";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKES(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace("KES", "KSh")
    .trim();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function createBlurDataURL(colors: {
  from: string;
  to: string;
  accent?: string;
}) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${colors.from}" />
          <stop offset="100%" stop-color="${colors.to}" />
        </linearGradient>
      </defs>
      <rect width="16" height="9" fill="url(#g)" />
      <circle cx="12" cy="2" r="2.2" fill="${colors.accent ?? "#ffffff"}" fill-opacity=".15" />
      <circle cx="3" cy="7.5" r="2.6" fill="#ffffff" fill-opacity=".08" />
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export const isMockMode = shouldUseMockData();
