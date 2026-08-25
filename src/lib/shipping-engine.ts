/**
 * Research Peptides UK — Configurable Shipping & Destination Eligibility Engine
 * Maps laboratory destinations to shipping zones, filters eligible carriers,
 * and enforces server-authoritative free delivery thresholds.
 */

import { ShippingMethod, ShippingZone } from '../types';
import { resolveFreeShipping } from './pricing';

export interface CountryInfo {
  code: string;
  name: string;
  defaultZone: ShippingZone;
  isEligible: boolean;
}

export const RESEARCH_DESTINATION_COUNTRIES: CountryInfo[] = [
  // UK Zones
  { code: 'GB', name: 'United Kingdom (Mainland)', defaultZone: 'UK_MAINLAND', isEligible: true },
  { code: 'GB-NIR', name: 'United Kingdom (Northern Ireland / Highlands & Islands)', defaultZone: 'UK_HIGHLANDS', isEligible: true },
  { code: 'IM', name: 'Isle of Man', defaultZone: 'UK_HIGHLANDS', isEligible: true },
  { code: 'JE', name: 'Jersey', defaultZone: 'UK_HIGHLANDS', isEligible: true },
  { code: 'GG', name: 'Guernsey', defaultZone: 'UK_HIGHLANDS', isEligible: true },

  // Europe Zone 1 (Close European Research Centres)
  { code: 'IE', name: 'Ireland', defaultZone: 'EUROPE_ZONE_1', isEligible: true },
  { code: 'FR', name: 'France', defaultZone: 'EUROPE_ZONE_1', isEligible: true },
  { code: 'DE', name: 'Germany', defaultZone: 'EUROPE_ZONE_1', isEligible: true },
  { code: 'NL', name: 'Netherlands', defaultZone: 'EUROPE_ZONE_1', isEligible: true },
  { code: 'BE', name: 'Belgium', defaultZone: 'EUROPE_ZONE_1', isEligible: true },
  { code: 'LU', name: 'Luxembourg', defaultZone: 'EUROPE_ZONE_1', isEligible: true },

  // Europe Zone 2 (Wider European Scientific Institutes)
  { code: 'CH', name: 'Switzerland', defaultZone: 'EUROPE_ZONE_2', isEligible: true },
  { code: 'AT', name: 'Austria', defaultZone: 'EUROPE_ZONE_2', isEligible: true },
  { code: 'SE', name: 'Sweden', defaultZone: 'EUROPE_ZONE_2', isEligible: true },
  { code: 'DK', name: 'Denmark', defaultZone: 'EUROPE_ZONE_2', isEligible: true },
  { code: 'NO', name: 'Norway', defaultZone: 'EUROPE_ZONE_2', isEligible: true },
  { code: 'FI', name: 'Finland', defaultZone: 'EUROPE_ZONE_2', isEligible: true },
  { code: 'IT', name: 'Italy', defaultZone: 'EUROPE_ZONE_2', isEligible: true },
  { code: 'ES', name: 'Spain', defaultZone: 'EUROPE_ZONE_2', isEligible: true },
  { code: 'PT', name: 'Portugal', defaultZone: 'EUROPE_ZONE_2', isEligible: true },
  { code: 'PL', name: 'Poland', defaultZone: 'EUROPE_ZONE_2', isEligible: true },
  { code: 'CZ', name: 'Czech Republic', defaultZone: 'EUROPE_ZONE_2', isEligible: true },
  { code: 'BG', name: 'Bulgaria', defaultZone: 'EUROPE_ZONE_2', isEligible: true },
  { code: 'HR', name: 'Croatia', defaultZone: 'EUROPE_ZONE_2', isEligible: true },
  { code: 'CY', name: 'Cyprus', defaultZone: 'EUROPE_ZONE_2', isEligible: true },
  { code: 'EE', name: 'Estonia', defaultZone: 'EUROPE_ZONE_2', isEligible: true },
  { code: 'GR', name: 'Greece', defaultZone: 'EUROPE_ZONE_2', isEligible: true },
  { code: 'HU', name: 'Hungary', defaultZone: 'EUROPE_ZONE_2', isEligible: true },
  { code: 'IS', name: 'Iceland', defaultZone: 'EUROPE_ZONE_2', isEligible: true },
  { code: 'LV', name: 'Latvia', defaultZone: 'EUROPE_ZONE_2', isEligible: true },
  { code: 'LI', name: 'Liechtenstein', defaultZone: 'EUROPE_ZONE_2', isEligible: true },
  { code: 'LT', name: 'Lithuania', defaultZone: 'EUROPE_ZONE_2', isEligible: true },
  { code: 'MT', name: 'Malta', defaultZone: 'EUROPE_ZONE_2', isEligible: true },
  { code: 'RO', name: 'Romania', defaultZone: 'EUROPE_ZONE_2', isEligible: true },
  { code: 'SK', name: 'Slovakia', defaultZone: 'EUROPE_ZONE_2', isEligible: true },
  { code: 'SI', name: 'Slovenia', defaultZone: 'EUROPE_ZONE_2', isEligible: true },

  // International Tier 1 (Authorized Academic Shipping Zones)
  { code: 'US', name: 'United States (Academic Labs Only)', defaultZone: 'INTERNATIONAL', isEligible: true },
  { code: 'CA', name: 'Canada (Institutional Labs)', defaultZone: 'INTERNATIONAL', isEligible: true },
  { code: 'AU', name: 'Australia (Research Core Facilities)', defaultZone: 'INTERNATIONAL', isEligible: true },
  { code: 'NZ', name: 'New Zealand', defaultZone: 'INTERNATIONAL', isEligible: true },
  { code: 'SG', name: 'Singapore (Biomedical Sciences)', defaultZone: 'INTERNATIONAL', isEligible: true },
  { code: 'JP', name: 'Japan', defaultZone: 'INTERNATIONAL', isEligible: true },
];

export interface ShippingCalculationResult {
  isAvailable: boolean;
  zone?: ShippingZone;
  countryName?: string;
  eligibleMethods: Array<{
    method: ShippingMethod;
    calculatedPrice: number;
    freeShippingQualified: boolean;
    amountNeededForFreeShipping: number;
  }>;
  selectedMethod?: ShippingMethod;
  selectedPrice: number;
  error?: string;
}

/**
 * Resolves destination country info.
 */
export function resolveCountryInfo(countryCode: string): CountryInfo | null {
  const normalized = countryCode.trim().toUpperCase();
  return RESEARCH_DESTINATION_COUNTRIES.find((c) => c.code === normalized) || null;
}

/**
 * Authoritatively calculates available shipping methods and fees for a given country and subtotal.
 */
export function calculateEligibleShippingMethods(
  countryCode: string,
  subtotalAfterDiscounts: number,
  allMethods: ShippingMethod[],
  preferredMethodId?: string
): ShippingCalculationResult {
  const country = resolveCountryInfo(countryCode);

  if (!country || !country.isEligible) {
    return {
      isAvailable: false,
      eligibleMethods: [],
      selectedPrice: 0,
      error: `Shipping unavailable for destination code: ${countryCode}. No active carrier is configured for this destination.`,
    };
  }

  const zone = country.defaultZone;
  const activeZoneMethods = allMethods.filter((m) => m.isActive && m.zone === zone);

  if (activeZoneMethods.length === 0) {
    return {
      isAvailable: false,
      zone,
      countryName: country.name,
      eligibleMethods: [],
      selectedPrice: 0,
      error: `Shipping unavailable for this destination (${country.name}). No active carriers for zone ${zone}.`,
    };
  }

  const eligibleMethods = activeZoneMethods.map((method) => {
    const shipping = resolveFreeShipping(subtotalAfterDiscounts, method);
    return {
      method,
      calculatedPrice: shipping.fee,
      freeShippingQualified: shipping.qualified,
      amountNeededForFreeShipping: shipping.amountNeeded,
    };
  });

  // Pick preferred method if eligible, else pick lowest price or first
  let selectedEntry = eligibleMethods.find((e) => e.method.id === preferredMethodId);
  if (!selectedEntry) {
    selectedEntry = eligibleMethods[0];
  }

  return {
    isAvailable: true,
    zone,
    countryName: country.name,
    eligibleMethods,
    selectedMethod: selectedEntry?.method,
    selectedPrice: selectedEntry ? selectedEntry.calculatedPrice : 0,
  };
}

export const FEATURED_CHECKOUT_COUNTRY_CODES = ['GB', 'IE', 'DE', 'FR', 'NL', 'SE'] as const;

export function isEuropeanShippingZone(zone: ShippingZone): boolean {
  return zone === 'EUROPE_ZONE_1' || zone === 'EUROPE_ZONE_2';
}

export function checkoutDestinationOptionLabel(country: CountryInfo): string {
  if (country.code === 'GB') {
    return 'United Kingdom (Tracked 24 / Guaranteed Next-Day)';
  }
  if (country.code === 'IE') {
    return 'Ireland (DHL Express International)';
  }
  if (isEuropeanShippingZone(country.defaultZone)) {
    return `${country.name} (EU Priority Tracked)`;
  }
  return country.name;
}

export function getCheckoutDestinationGroups(): {
  featured: CountryInfo[];
  otherEuropean: CountryInfo[];
} {
  const featuredCodes = new Set<string>(FEATURED_CHECKOUT_COUNTRY_CODES);
  const featured = FEATURED_CHECKOUT_COUNTRY_CODES.map((code) =>
    RESEARCH_DESTINATION_COUNTRIES.find((country) => country.code === code && country.isEligible)
  ).filter((country): country is CountryInfo => Boolean(country));

  const otherEuropean = RESEARCH_DESTINATION_COUNTRIES.filter(
    (country) =>
      country.isEligible && isEuropeanShippingZone(country.defaultZone) && !featuredCodes.has(country.code)
  ).sort((a, b) => a.name.localeCompare(b.name));

  return { featured, otherEuropean };
}
