import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { shouldUseMockData } from "@/lib/live-data-mode";

/**
 * Merge class names with Tailwind CSS
 * Combines clsx for conditional classes and tailwind-merge for deduplication
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number as Kenyan Shillings (KES/KSh)
 */
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

/**
 * Format number as Malagasy Ariary (MGA/MR)
 */
export function formatMR(amount: number): string {
  return new Intl.NumberFormat("fr-MG", {
    style: "currency",
    currency: "MGA",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Convert string to URL-friendly slug
 * Handles spaces, special characters, and multiple hyphens
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Get initials from a full name
 * Returns first letter of first two words, uppercase
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Create a Base64-encoded blur placeholder SVG for images
 * Generates a gradient SVG with optional accent circle
 */
export function createBlurDataURL({
  from = "#eee",
  to = "#ddd",
  accent,
}: {
  from?: string;
  to?: string;
  accent?: string;
} = {}): string {
  const svg = accent
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${from}" />
          <stop offset="100%" stop-color="${to}" />
        </linearGradient>
      </defs>
      <rect width="16" height="9" fill="url(#g)" />
      <circle cx="12" cy="2" r="2.2" fill="${accent}" fill-opacity=".15" />
      <circle cx="3" cy="7.5" r="2.6" fill="#ffffff" fill-opacity=".08" />
    </svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${from}" />
          <stop offset="100%" stop-color="${to}" />
        </linearGradient>
      </defs>
      <rect width="16" height="9" fill="url(#g)" />
    </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/**
 * Global mock mode flag
 * Used throughout the app to toggle between mock and live data
 */
export const isMockMode = shouldUseMockData();