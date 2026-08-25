import { STORE_CONTACT_EMAIL } from '../../lib/store-contact';
import { EMAIL_BRAND, getPublicSiteUrl } from '../../lib/email/brand';
import { isEmailProviderConnected } from '../env-status';

export interface EmailRuntimeConfig {
  provider: string;
  from: string;
  replyTo: string;
  supportAddress: string;
  adminAddress: string;
  live: boolean;
}

function readEnv(name: string): string {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : '';
}

export function getEmailRuntimeConfig(): EmailRuntimeConfig {
  const support = readEnv('EMAIL_SUPPORT_ADDRESS') || readEnv('EMAIL_REPLY_TO') || STORE_CONTACT_EMAIL;
  const admin = readEnv('ADMIN_EMAIL') || support;
  return {
    provider: (readEnv('EMAIL_PROVIDER') || 'resend').toLowerCase(),
    from: readEnv('EMAIL_FROM_ADDRESS') || `${EMAIL_BRAND.name} <${STORE_CONTACT_EMAIL}>`,
    replyTo: readEnv('EMAIL_REPLY_TO') || support,
    supportAddress: support,
    adminAddress: admin,
    live: isEmailProviderConnected(),
  };
}

export function emailDeliveryStatus(): 'CONNECTED' | 'NOT_CONNECTED_TO_EMAIL_PROVIDER' {
  return getEmailRuntimeConfig().live ? 'CONNECTED' : 'NOT_CONNECTED_TO_EMAIL_PROVIDER';
}

export { getPublicSiteUrl };
