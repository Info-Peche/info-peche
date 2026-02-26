// Shipping cost calculation based on magazine quantity and destination

export type ShippingZone = "france" | "international";

// Shipping rate tiers: [maxMagazines, costCents]
const FRANCE_RATES: [number, number][] = [
  [1, 524],   // 1 magazine (250g) → 5,24€
  [2, 741],   // 2 magazines (500g) → 7,41€
  [4, 929],   // 4 magazines (1kg) → 9,29€
  [9, 1119],  // 9 magazines (2kg) → 11,19€
];

const INTERNATIONAL_RATES: [number, number][] = [
  [1, 1165],  // 1 magazine (250g) → 11,65€
  [2, 1660],  // 2 magazines (500g) → 16,60€
  [9, 3170],  // 9 magazines (2kg) → 31,70€
];

// IDs that are subscriptions (free shipping)
const SUBSCRIPTION_IDS = ["abo-6-mois", "abo-1-an", "abo-2-ans"];

// IDs that are digital products (no shipping needed)
const isDigitalItem = (id: string) =>
  id.startsWith("digital-") || id === "lecture-numero" || id === "pass-15-jours";

const isSubscriptionItem = (id: string) => SUBSCRIPTION_IDS.includes(id);

export const isPhysicalItem = (id: string) =>
  !isDigitalItem(id) && !isSubscriptionItem(id);

/**
 * Count total physical magazines in the cart
 */
export function countPhysicalMagazines(items: { id: string; quantity: number }[]): number {
  return items
    .filter((item) => isPhysicalItem(item.id))
    .reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Check if the cart contains only subscriptions (shipping is free)
 */
export function hasOnlySubscriptions(items: { id: string }[]): boolean {
  return items.length > 0 && items.every((item) => isSubscriptionItem(item.id) || isDigitalItem(item.id));
}

/**
 * Determine shipping zone from country code
 */
export function getShippingZone(countryCode: string): ShippingZone {
  return countryCode === "FR" ? "france" : "international";
}

/**
 * Calculate shipping cost in cents for a given number of physical magazines
 * Returns 0 if no physical magazines or only subscriptions
 */
export function calculateShippingCents(
  magazineCount: number,
  zone: ShippingZone
): number {
  if (magazineCount <= 0) return 0;

  const rates = zone === "france" ? FRANCE_RATES : INTERNATIONAL_RATES;

  // Find the matching tier
  for (const [maxQty, cost] of rates) {
    if (magazineCount <= maxQty) return cost;
  }

  // For quantities exceeding the max tier, calculate based on groups of max tier
  const maxTier = rates[rates.length - 1];
  const maxQty = maxTier[0];
  const maxCost = maxTier[1];
  const groups = Math.ceil(magazineCount / maxQty);
  return groups * maxCost;
}

/**
 * Calculate shipping cost in euros
 */
export function calculateShipping(
  items: { id: string; quantity: number }[],
  countryCode: string
): number {
  const magazineCount = countPhysicalMagazines(items);
  if (magazineCount === 0) return 0;

  const zone = getShippingZone(countryCode);
  return calculateShippingCents(magazineCount, zone) / 100;
}

/**
 * List of countries for the shipping selector
 */
export const SHIPPING_COUNTRIES = [
  { code: "FR", label: "France" },
  { code: "BE", label: "Belgique" },
  { code: "CH", label: "Suisse" },
  { code: "LU", label: "Luxembourg" },
  { code: "MC", label: "Monaco" },
  { code: "OTHER", label: "Autre destination" },
] as const;
