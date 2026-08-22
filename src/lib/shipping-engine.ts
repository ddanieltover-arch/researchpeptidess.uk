/**
 * Research Peptides UK — Configurable Shipping & Destination Eligibility Engine
 * Maps laboratory destinations to shipping zones, filters eligible carriers,
 * and enforces server-authoritative free delivery thresholds.
 */

import { ShippingMethod, ShippingZone } from '../types';

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

  // International Tier 1 (Authorized Academic Requisition Zones)
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
      error: `Shipping unavailable for destination code: ${countryCode}. No compliant temperature-controlled carrier route configured.`,
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
    const freeThreshold = method.freeShippingThreshold;
    const isFreeEligible = freeThreshold !== undefined && freeThreshold !== null && freeThreshold > 0;
    const freeShippingQualified = isFreeEligible && subtotalAfterDiscounts >= freeThreshold;
    const amountNeededForFreeShipping = isFreeEligible
      ? Math.max(0, Number((freeThreshold - subtotalAfterDiscounts).toFixed(2)))
      : 0;

    const calculatedPrice = freeShippingQualified ? 0 : method.price;

    return {
      method,
      calculatedPrice,
      freeShippingQualified,
      amountNeededForFreeShipping,
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
