export type EnvClass = 'REQUIRED_FOR_BOOT' | 'REQUIRED_FOR_FEATURE' | 'OPTIONAL';

export interface EnvVariableSpec {
  name: string;
  classification: EnvClass;
  feature?: string;
}

export const ENV_VARIABLE_CATALOG: EnvVariableSpec[] = [
  { name: 'DATABASE_URL', classification: 'REQUIRED_FOR_FEATURE', feature: 'persistence' },
  { name: 'DATABASE_URL_UNPOOLED', classification: 'REQUIRED_FOR_FEATURE', feature: 'migrations' },
  { name: 'AUTH_SECRET', classification: 'REQUIRED_FOR_FEATURE', feature: 'admin_auth' },
  { name: 'SESSION_SECRET', classification: 'OPTIONAL' },
  { name: 'JWT_SIGNING_KEY', classification: 'OPTIONAL' },
  { name: 'ADMIN_EMAIL', classification: 'REQUIRED_FOR_FEATURE', feature: 'admin_auth' },
  { name: 'ADMIN_PASSWORD', classification: 'REQUIRED_FOR_FEATURE', feature: 'admin_auth' },
  { name: 'STORE_STATUS', classification: 'OPTIONAL' },
  { name: 'NEXT_PUBLIC_SITE_URL', classification: 'OPTIONAL' },
  { name: 'STORAGE_ENDPOINT', classification: 'REQUIRED_FOR_FEATURE', feature: 'document_storage' },
  { name: 'STORAGE_ACCESS_KEY_ID', classification: 'REQUIRED_FOR_FEATURE', feature: 'document_storage' },
  { name: 'STORAGE_SECRET_ACCESS_KEY', classification: 'REQUIRED_FOR_FEATURE', feature: 'document_storage' },
  { name: 'EMAIL_PROVIDER', classification: 'OPTIONAL' },
  { name: 'RESEND_API_KEY', classification: 'OPTIONAL' },
  { name: 'SENTRY_DSN', classification: 'OPTIONAL' },
  { name: 'NEXT_PUBLIC_SENTRY_DSN', classification: 'OPTIONAL' },
  { name: 'NEXT_PUBLIC_ANALYTICS_PROPERTY_ID', classification: 'OPTIONAL' },
  { name: 'BANK_TRANSFER_SORT_CODE', classification: 'REQUIRED_FOR_FEATURE', feature: 'bank_settlement' },
  { name: 'BANK_TRANSFER_ACCOUNT_NUMBER', classification: 'REQUIRED_FOR_FEATURE', feature: 'bank_settlement' },
  { name: 'CRYPTO_BTC_WALLET_ADDRESS', classification: 'REQUIRED_FOR_FEATURE', feature: 'crypto_settlement' },
  { name: 'GEMINI_API_KEY', classification: 'OPTIONAL' },
];

const PLACEHOLDER_FRAGMENTS = [
  'sample-project',
  'your-',
  're_sample',
  'xxxxxxxx',
  'G-XXXXXXXXXX',
  'choose-a-strong',
  '20-00-00',
  '12345678',
  'bc1q9v8084',
];

export type EnvPresence = 'PRESENT' | 'MISSING' | 'OPTIONAL';

function isPlaceholder(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) return true;
  return PLACEHOLDER_FRAGMENTS.some((fragment) => normalized.toLowerCase().includes(fragment.toLowerCase()));
}

export function inspectEnvVariable(name: string): 'PRESENT' | 'MISSING' {
  const value = process.env[name];
  if (!value || isPlaceholder(value)) return 'MISSING';
  return 'PRESENT';
}

export function buildEnvDiagnostic(): Record<string, EnvPresence | 'PRESENT' | 'MISSING'> {
  const result: Record<string, EnvPresence | 'PRESENT' | 'MISSING'> = {};
  for (const spec of ENV_VARIABLE_CATALOG) {
    const presence = inspectEnvVariable(spec.name);
    if (presence === 'MISSING' && spec.classification === 'OPTIONAL') {
      result[spec.name] = 'OPTIONAL';
    } else {
      result[spec.name] = presence;
    }
  }
  return result;
}

export function isEmailProviderConnected(): boolean {
  const provider = inspectEnvVariable('EMAIL_PROVIDER');
  const key = inspectEnvVariable('RESEND_API_KEY');
  return provider === 'PRESENT' && key === 'PRESENT';
}

export function storageStatus(): 'healthy' | 'unconfigured' {
  return inspectEnvVariable('STORAGE_ENDPOINT') === 'PRESENT' &&
    inspectEnvVariable('STORAGE_ACCESS_KEY_ID') === 'PRESENT'
    ? 'healthy'
    : 'unconfigured';
}
