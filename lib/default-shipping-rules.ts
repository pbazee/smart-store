import type { ShippingRule } from "@/types";

export const DEFAULT_SHIPPING_RULES: Array<
  Pick<
    ShippingRule,
    "name" | "description" | "locationScope" | "minOrderAmount" | "cost" | "priority" | "isActive"
  >
> = [
  {
    name: "Free Nairobi Same-Day",
    description: "Nairobi county deliveries at no cost",
    locationScope: "Nairobi",
    minOrderAmount: null,
    cost: 0,
    priority: 10,
    isActive: true,
  },
  {
    name: "Free Nationwide Over 5k",
    description: "Kenya-wide free shipping when you spend 5,000 KSh or more",
    locationScope: "Kenya",
    minOrderAmount: 5000,
    cost: 0,
    priority: 5,
    isActive: true,
  },
  {
    name: "Standard Upcountry",
    description: "Flat rate for non-Nairobi orders under 5,000 KSh",
    locationScope: "Other",
    minOrderAmount: null,
    cost: 500,
    priority: 1,
    isActive: true,
  },
];
