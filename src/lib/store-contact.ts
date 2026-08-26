export const STORE_CONTACT_EMAIL = 'info@researchpeptidess.uk';

/** Public WhatsApp desk. This number is for WhatsApp messages only, not voice calls. */
export const STORE_WHATSAPP_DISPLAY = '+44 7927 039397';
export const STORE_WHATSAPP_E164 = '447927039397';
export const STORE_WHATSAPP_URL = `https://wa.me/${STORE_WHATSAPP_E164}`;

export function buildWhatsAppUrl(message?: string): string {
  const text = typeof message === 'string' ? message.trim() : '';
  if (!text) return STORE_WHATSAPP_URL;
  return `${STORE_WHATSAPP_URL}?text=${encodeURIComponent(text)}`;
}

export interface ProductWhatsAppContext {
  productName: string;
  productUrl?: string;
  variantLabel?: string;
  sku?: string;
}

export function buildProductWhatsAppMessage(context: ProductWhatsAppContext): string {
  const productName = context.productName.trim();
  const lines = [`Hello, I would like to enquire about ${productName}.`, '', `Product: ${productName}`];
  if (context.variantLabel?.trim()) {
    lines.push(`Option: ${context.variantLabel.trim()}`);
  }
  if (context.sku?.trim()) {
    lines.push(`SKU: ${context.sku.trim()}`);
  }
  if (context.productUrl?.trim()) {
    lines.push(context.productUrl.trim());
  }
  return lines.join('\n');
}

export function buildProductWhatsAppUrl(context: ProductWhatsAppContext): string {
  return buildWhatsAppUrl(buildProductWhatsAppMessage(context));
}

const LEGACY_STORE_INBOXES = new Set([
  'lab@researchpeptidess.uk',
  'support@researchpeptidess.uk',
  'privacy@researchpeptidess.uk',
  'orders@researchpeptidess.uk',
]);

export function canonicalizeStoreContactEmail(email: string | undefined | null): string {
  const trimmed = typeof email === 'string' ? email.trim() : '';
  if (!trimmed || LEGACY_STORE_INBOXES.has(trimmed.toLowerCase())) {
    return STORE_CONTACT_EMAIL;
  }
  return trimmed;
}

export function withCanonicalStoreContactEmails<T extends {
  primaryEmail?: string;
  supportEmail?: string;
  privacyEmail?: string;
}>(settings: T): T {
  return {
    ...settings,
    primaryEmail: canonicalizeStoreContactEmail(settings.primaryEmail),
    supportEmail: canonicalizeStoreContactEmail(settings.supportEmail),
    privacyEmail: canonicalizeStoreContactEmail(settings.privacyEmail),
  };
}
