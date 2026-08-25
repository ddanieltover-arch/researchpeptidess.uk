import { STORE_CONTACT_EMAIL } from '../store-contact';

export const EMAIL_BRAND = {
  name: 'Research Peptides UK',
  shortName: 'RP-UK',
  tagline: 'High-purity analytical & in-vitro research biochemicals',
  legalLine: 'For in-vitro laboratory research use only. Not for human or veterinary use.',
  supportEmail: STORE_CONTACT_EMAIL,
  siteUrl: 'https://researchpeptidess.uk',
  colors: {
    navy: '#0B132B',
    primary: '#4353FF',
    primaryHover: '#3B46E0',
    sky: '#0EA5E9',
    ice: '#F0F9FF',
    page: '#F4F7FB',
    card: '#FFFFFF',
    text: '#0F172A',
    muted: '#64748B',
    line: '#E2E8F0',
    success: '#047857',
    successBg: '#ECFDF5',
    warning: '#B45309',
    warningBg: '#FFFBEB',
    danger: '#BE123C',
    dangerBg: '#FFF1F2',
    admin: '#92400E',
    adminBg: '#FEF3C7',
  },
} as const;

export type EmailAudience = 'customer' | 'admin';

export interface RenderedEmail {
  subject: string;
  preheader: string;
  html: string;
  text: string;
}

export function getPublicSiteUrl(): string {
  try {
    if (typeof process !== 'undefined' && process.env) {
      const fromEnv = (process.env.NEXT_PUBLIC_SITE_URL || process.env.VITE_PUBLIC_SITE_URL || '').trim();
      if (fromEnv) return fromEnv.replace(/\/$/, '');
    }
  } catch {
    /* Client bundles may not expose process.env. */
  }
  return EMAIL_BRAND.siteUrl;
}

export function sitePath(path: string): string {
  const base = getPublicSiteUrl();
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}

export function formatEmailMoney(amount: number, currency: 'GBP' | 'EUR' = 'GBP'): string {
  const numeric = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  try {
    return new Intl.NumberFormat(currency === 'EUR' ? 'en-GB' : 'en-GB', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numeric);
  } catch {
    const symbol = currency === 'EUR' ? '€' : '£';
    return `${symbol}${numeric.toFixed(2)}`;
  }
}

export function formatEmailDate(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isSafeEmailHref(href: string): boolean {
  try {
    const url = new URL(href);
    return url.protocol === 'https:' || url.protocol === 'http:' || url.protocol === 'mailto:';
  } catch {
    return false;
  }
}
