type DefaultShippingRule = {
  name: string;
  description?: string;
  deliveryFeeKES: number;
  estimatedDays: number;
  countries: string[];
  regions: string[];
  towns: string[];
  freeAboveKES?: number | null;
  priority: number;
  isActive: boolean;
};

export const DEFAULT_SHIPPING_RULES: DefaultShippingRule[] = [
  {
    name: "Free Nairobi Same-Day",
    description: "Nairobi county deliveries at no cost",
    deliveryFeeKES: 0,
    estimatedDays: 1,
    countries: ["Kenya"],
    regions: ["Nairobi"],
    towns: [],
    priority: 10,
    isActive: true,
  },
  {
    name: "Free Nationwide Over 5k",
    description: "Kenya-wide free shipping when you spend 5,000 KSh or more",
    deliveryFeeKES: 0,
    estimatedDays: 3,
    countries: ["Kenya"],
    regions: [],
    towns: [],
    freeAboveKES: 5000,
    priority: 5,
    isActive: true,
  },
  {
    name: "Standard Upcountry",
    description: "Flat rate for non-Nairobi orders under 5,000 KSh",
    deliveryFeeKES: 500,
    estimatedDays: 3,
    countries: ["Kenya"],
    regions: [],
    towns: [],
    priority: 1,
    isActive: true,
  },
];
