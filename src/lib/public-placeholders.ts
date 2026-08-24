const PLACEHOLDER_TOKEN = /^\[[A-Z0-9_]+\]$/;
const SAMPLE_PHONES = new Set([
  '+44 (0) 20 8123 4567',
  '+44 20 8123 4567',
  '020 8123 4567',
  '+44 7700 900123',
]);

export const UNPUBLISHED_BUSINESS_DETAIL = 'To be published when the legal entity is confirmed.';

export function isUnpublishedBusinessValue(value: string | undefined | null): boolean {
  const raw = (value ?? '').trim();
  if (!raw) return true;
  if (PLACEHOLDER_TOKEN.test(raw)) return true;
  if (SAMPLE_PHONES.has(raw)) return true;
  return false;
}

export function resolvePublicBusinessValue(value: string | undefined | null): string {
  if (isUnpublishedBusinessValue(value)) {
    return UNPUBLISHED_BUSINESS_DETAIL;
  }
  return (value ?? '').trim();
}
