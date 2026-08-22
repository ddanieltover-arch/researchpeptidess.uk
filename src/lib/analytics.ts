/**
 * Research Peptides UK — Consent-Aware Analytics Abstraction
 *
 * Implements privacy-compliant analytics dispatch:
 * 1. Strictly respects user cookie consent preferences (GDPR / UK DPA 2018).
 * 2. Redacts all sensitive financial credentials, wallet private keys, and passwords.
 * 3. Supports standard e-commerce telemetry events.
 * 4. Logs to internal in-memory diagnostic buffer for verification and testing.
 */

import { AnalyticsEventRecord, CookieConsentPreferences } from '../types';

const CONSENT_STORAGE_KEY = 'rp_cookie_consent_v1';
const ANALYTICS_BUFFER_KEY = 'rp_analytics_buffer_v1';

// Default initial consent (Strictly necessary is active; Analytics & Marketing require explicit opt-in)
export const DEFAULT_CONSENT: CookieConsentPreferences = {
  essential: true,
  analytics: false,
  marketing: false,
  decidedAt: '',
};

// In-memory diagnostic events buffer (for admin observability and QA verification)
let inMemoryEvents: AnalyticsEventRecord[] = [];

/**
 * Loads stored consent preferences from localStorage
 */
export function getSavedConsent(): CookieConsentPreferences | null {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CookieConsentPreferences;
  } catch {
    return null;
  }
}

/**
 * Saves user cookie consent preferences
 */
export function saveConsent(preferences: CookieConsentPreferences): void {
  try {
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        ...preferences,
        decidedAt: new Date().toISOString(),
      })
    );
  } catch (err) {
    console.error('Failed to persist cookie consent:', err);
  }
}

/**
 * Strips sensitive keys (passwords, private keys, secrets, full card/bank numbers)
 */
function sanitizeEventParams(params: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  const prohibitedKeys = [
    'password',
    'passwordHash',
    'privateKey',
    'secret',
    'walletPrivateKey',
    'cvv',
    'creditCard',
    'accountNumber',
  ];

  for (const [key, value] of Object.entries(params)) {
    if (prohibitedKeys.some((p) => key.toLowerCase().includes(p.toLowerCase()))) {
      sanitized[key] = '[REDACTED_SECURITY_DATA]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeEventParams(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Tracks an analytics event if user has opted into analytics
 */
export function trackEvent(
  eventName: string,
  params: Record<string, unknown> = {},
  correlationId?: string
): void {
  const consent = getSavedConsent();
  const isAnalyticsAllowed = Boolean(consent?.analytics);

  const sanitizedParams = sanitizeEventParams(params);
  const record: AnalyticsEventRecord = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    eventName,
    params: sanitizedParams,
    timestamp: new Date().toISOString(),
    correlationId,
    pageUrl: typeof window !== 'undefined' ? window.location.pathname : '',
  };

  // Always buffer in-memory for testing/admin diagnostics
  inMemoryEvents.unshift(record);
  if (inMemoryEvents.length > 200) {
    inMemoryEvents = inMemoryEvents.slice(0, 200);
  }

  // Only dispatch to external trackers if user explicitly consented
  if (!isAnalyticsAllowed) {
    // Suppressed tracking due to lack of consent
    return;
  }

  // Example external dispatch (Google Analytics / Plausible / PostHog)
  if (typeof window !== 'undefined' && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
    (window as unknown as { gtag: (type: string, name: string, data: Record<string, unknown>) => void }).gtag(
      'event',
      eventName,
      sanitizedParams
    );
  }
}

/**
 * Tracks a page view event with route path
 */
export function trackPageView(path: string): void {
  trackEvent('page_view', { path });
}

/**
 * Gets recorded analytics events for admin diagnostics & QA matrix
 */
export function getDiagnosticAnalyticsEvents(): AnalyticsEventRecord[] {
  return [...inMemoryEvents];
}

/**
 * Clears in-memory analytics buffer
 */
export function clearDiagnosticAnalyticsEvents(): void {
  inMemoryEvents = [];
}
