import { DEFAULT_SHIPPING_RULES } from "@/lib/default-shipping-rules";
import { shouldUseMockData } from "@/lib/live-data-mode";
import { prisma } from "@/lib/prisma";
import type { ShippingRule } from "@/types";

type ShippingInput = {
  subtotal: number;
  county: string;
  city?: string;
};

type ShippingMatch = {
  cost: number;
  ruleId?: number | null;
  ruleName?: string | null;
};

let demoShippingRules: ShippingRule[] = DEFAULT_SHIPPING_RULES.map((rule, index) => ({
  id: index + 1,
  ...rule,
  minOrderAmount: rule.minOrderAmount ?? null,
  cost: rule.cost,
  createdAt: new Date(),
  updatedAt: new Date(),
}));

function normalizeCounty(value?: string | null) {
  return (value || "").trim().toLowerCase();
}

function matchesRule(input: ShippingInput, rule: ShippingRule) {
  const county = normalizeCounty(input.county);
  const city = normalizeCounty(input.city);
  const scope = (rule.locationScope || "").trim().toLowerCase();

  const meetsMin =
    rule.minOrderAmount == null || Number.isNaN(rule.minOrderAmount)
      ? true
      : input.subtotal >= rule.minOrderAmount;

  if (!meetsMin) {
    return false;
  }

  if (scope === "nairobi") {
    return county.includes("nairobi") || city.includes("nairobi");
  }

  if (scope === "kenya") {
    return true; // default country scope (all Kenyan addresses)
  }

  if (scope === "other") {
    return true;
  }

  return false;
}

export function pickShippingRule(input: ShippingInput, rules: ShippingRule[]): ShippingMatch {
  const ordered = [...rules].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  for (const rule of ordered) {
    if (!rule.isActive) continue;
    if (matchesRule(input, rule)) {
      return {
        cost: Math.round(Number(rule.cost) || 0),
        ruleId: rule.id,
        ruleName: rule.name,
      };
    }
  }

  return { cost: 0, ruleId: null, ruleName: null };
}

export async function getShippingRules(options: { activeOnly?: boolean } = {}) {
  const { activeOnly = false } = options;

  if (shouldUseMockData()) {
    return demoShippingRules.filter((rule) => (activeOnly ? rule.isActive : true));
  }

  const rules = await prisma.shippingRule.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });

  return rules as ShippingRule[];
}

export async function upsertShippingRule(input: Omit<ShippingRule, "createdAt" | "updatedAt">) {
  if (shouldUseMockData()) {
    if (input.id) {
      const existingIndex = demoShippingRules.findIndex((rule) => rule.id === input.id);
      const existing = demoShippingRules[existingIndex];
      const updated: ShippingRule = {
        ...(existing ?? { id: input.id }),
        ...input,
        createdAt: existing?.createdAt ?? new Date(),
        updatedAt: new Date(),
      };
      if (existingIndex >= 0) {
        demoShippingRules[existingIndex] = updated;
      } else {
        demoShippingRules.push(updated);
      }
      return updated;
    }

    const next: ShippingRule = {
      ...input,
      id: demoShippingRules.length ? Math.max(...demoShippingRules.map((r) => r.id)) + 1 : 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    demoShippingRules.push(next);
    return next;
  }

  const { id, ...rest } = input;
  return prisma.shippingRule.upsert({
    where: { id: id ?? 0 },
    update: rest,
    create: rest,
  });
}

export async function deleteShippingRule(id: number) {
  if (shouldUseMockData()) {
    demoShippingRules = demoShippingRules.filter((rule) => rule.id !== id);
    return;
  }

  await prisma.shippingRule.delete({ where: { id } });
}

export async function seedDefaultShippingRules() {
  if (shouldUseMockData()) {
    demoShippingRules = DEFAULT_SHIPPING_RULES.map((rule, index) => ({
      id: index + 1,
      ...rule,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    return;
  }

  for (const rule of DEFAULT_SHIPPING_RULES) {
    const existing = await prisma.shippingRule.findFirst({
      where: { name: rule.name },
    });

    if (existing) {
      await prisma.shippingRule.update({
        where: { id: existing.id },
        data: {
          description: rule.description,
          locationScope: rule.locationScope,
          minOrderAmount: rule.minOrderAmount,
          cost: rule.cost,
          isActive: rule.isActive,
          priority: rule.priority,
        },
      });
    } else {
      await prisma.shippingRule.create({
        data: {
          name: rule.name,
          description: rule.description,
          locationScope: rule.locationScope,
          minOrderAmount: rule.minOrderAmount,
          cost: rule.cost,
          isActive: rule.isActive,
          priority: rule.priority,
        },
      });
    }
  }
}

export async function getShippingQuote(input: ShippingInput): Promise<ShippingMatch> {
  const rules = await getShippingRules({ activeOnly: true });
  return pickShippingRule(input, rules);
}
