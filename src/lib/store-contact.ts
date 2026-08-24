export const STORE_CONTACT_EMAIL = 'info@researchpeptidess.uk';

const LEGACY_STORE_INBOXES = new Set([
  'lab@researchpeptidess.uk',
  'support@researchpeptidess.uk',
  'privacy@researchpeptidess.uk',
  'orders@researchpeptidess.uk',
]);

export function canonicalizeStoreContactEmail(email: string | undefined | null): string {
  const trimmed = (email ?? '').trim();
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
