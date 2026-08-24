/**
 * Existing feature-flag architecture. Do not introduce a second flag system.
 *
 * Business behaviour currently uses:
 * - store_settings.storeStatus (MAINTENANCE | PRIVATE_BETA | LIVE)
 * - checkout payment methods rendered from store configuration
 * - newsletter/contact availability from API provider status
 *
 * Env STORE_STATUS is a boot hint only; Admin store settings are authoritative after hydrate.
 */
export const FEATURE_FLAG_SOURCE = 'store_settings_and_env';

export const DOCUMENTED_FEATURE_FLAGS = [
  'STORE_STATUS',
  'CRYPTO_PAYMENTS',
  'WHOLESALE',
  'QUOTE_REQUESTS',
  'NEWSLETTER',
  'REVIEWS',
  'PRODUCT_COMPARISON',
] as const;
