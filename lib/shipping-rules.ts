import { prisma } from "@/lib/prisma";
import { ensureShippingRuleStorage } from "@/lib/runtime-schema-repair";
import type { ShippingRule } from "@/types";

type ShippingInput = {
  subtotal: number;
  county?: string;
  city?: string;
};

export type ShippingMatch = {
  ruleId: number | null;
  ruleName: string;
  cost: number;
  zoneName: string;
  county: string;
  counties: string[];
  deliveryFeeKES: number;
  estimatedDays: number;
  freeAboveKES: number | null;
  noMatch?: boolean;
};

function normalizeCountyName(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function getRuleCounties(rule: ShippingRule) {
  const counties = [
    ...(Array.isArray(rule.counties) ? rule.counties : []),
    ...(rule.county ? [rule.county] : []),
  ]
    .map((county) => county.trim())
    .filter(Boolean);

  return [...new Set(counties)];
}

function formatMatch(rule: ShippingRule, subtotal: number, county: string): ShippingMatch {
  const qualifyingForFreeShipping =
    typeof rule.freeAboveKES === "number" &&
    rule.freeAboveKES > 0 &&
    subtotal >= rule.freeAboveKES;
  const cost = qualifyingForFreeShipping ? 0 : rule.deliveryFeeKES;

  return {
    ruleId: rule.id,
    ruleName: rule.name,
    cost,
    zoneName: rule.name,
    county,
    counties: getRuleCounties(rule),
    deliveryFeeKES: cost,
    estimatedDays: rule.estimatedDays,
    freeAboveKES: rule.freeAboveKES ?? null,
  };
}

export async function getShippingRules(options: { activeOnly?: boolean } = {}) {
  const { activeOnly = false } = options;
  await ensureShippingRuleStorage();

  const rules = await prisma.shippingRule.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
  });

  return rules as unknown as ShippingRule[];
}

export function findMatchingZone(input: ShippingInput, zones: ShippingRule[]): ShippingMatch {
  const county = input.county?.trim() ?? "";
  const normalizedCounty = normalizeCountyName(county);
  const sortedZones = [...zones].sort((a, b) => b.priority - a.priority);

  const matchingRule = sortedZones.find((zone) =>
    getRuleCounties(zone).some((zoneCounty) => normalizeCountyName(zoneCounty) === normalizedCounty)
  );

  if (!matchingRule) {
    return {
      ruleId: null,
      ruleName: "Shipping to be confirmed",
      cost: 0,
      zoneName: "",
      county,
      counties: [],
      deliveryFeeKES: 0,
      estimatedDays: 0,
      freeAboveKES: null,
      noMatch: true,
    };
  }

  return formatMatch(matchingRule, input.subtotal, county);
}

export async function getShippingQuote(input: ShippingInput) {
  const rules = await getShippingRules({ activeOnly: true });
  return findMatchingZone(input, rules);
}

export async function upsertShippingZones(zones: Array<Partial<ShippingRule>>) {
  await ensureShippingRuleStorage();

  return prisma.$transaction(async (tx) => {
    await tx.shippingRule.deleteMany({});

    const sanitizedZones = zones.map((zone, index) => {
      const counties = [...new Set((zone.counties ?? []).map((county) => county.trim()).filter(Boolean))];

      return tx.shippingRule.create({
        data: {
          name: zone.name?.trim() || `Zone ${index + 1}`,
          description: zone.description?.trim() || null,
          county: counties[0] ?? null,
          counties,
          deliveryFeeKES: Number(zone.deliveryFeeKES ?? 0),
          estimatedDays: Math.max(1, Number(zone.estimatedDays ?? 1)),
          countries: ["Kenya"],
          regions: [],
          towns: [],
          freeAboveKES:
            zone.freeAboveKES === null || zone.freeAboveKES === undefined || zone.freeAboveKES === 0
              ? null
              : Number(zone.freeAboveKES),
          isActive: Boolean(zone.isActive),
          priority: zones.length - index,
        },
      });
    });

    return Promise.all(sanitizedZones);
  });
}

export async function deleteShippingZone(id: number) {
  await ensureShippingRuleStorage();
  return prisma.shippingRule.delete({ where: { id } });
}
