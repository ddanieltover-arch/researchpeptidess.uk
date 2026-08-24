export const config = { runtime: 'nodejs' };

const PLACEHOLDER = /sample|your-|20-00-00|12345678|bc1q9v8084|re_sample|xxxxxxxx|choose-a-strong/i;

function present(name: string): boolean {
  const value = typeof process !== 'undefined' ? process.env[name] : undefined;
  if (!value || !value.trim()) return false;
  return !PLACEHOLDER.test(value);
}

function send(res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (b: string) => void }, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

export default async function handler(
  req: { method?: string },
  res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (b: string) => void }
): Promise<void> {
  if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
    send(res, 405, { error: 'Method not allowed.' });
    return;
  }

  const variables: Record<string, 'PRESENT' | 'MISSING' | 'OPTIONAL'> = {
    DATABASE_URL: present('DATABASE_URL') ? 'PRESENT' : 'MISSING',
    DATABASE_URL_UNPOOLED: present('DATABASE_URL_UNPOOLED') ? 'PRESENT' : 'MISSING',
    AUTH_SECRET: present('AUTH_SECRET') ? 'PRESENT' : 'MISSING',
    STORE_STATUS: present('STORE_STATUS') ? 'PRESENT' : 'OPTIONAL',
    NEXT_PUBLIC_SITE_URL: present('NEXT_PUBLIC_SITE_URL') ? 'PRESENT' : 'OPTIONAL',
    BANK_TRANSFER_SORT_CODE: present('BANK_TRANSFER_SORT_CODE') ? 'PRESENT' : 'MISSING',
    BANK_TRANSFER_ACCOUNT_NUMBER: present('BANK_TRANSFER_ACCOUNT_NUMBER') ? 'PRESENT' : 'MISSING',
    CRYPTO_BTC_WALLET_ADDRESS: present('CRYPTO_BTC_WALLET_ADDRESS') ? 'PRESENT' : 'MISSING',
    EMAIL_PROVIDER: present('EMAIL_PROVIDER') ? 'PRESENT' : 'OPTIONAL',
    RESEND_API_KEY: present('RESEND_API_KEY') ? 'PRESENT' : 'OPTIONAL',
    SENTRY_DSN: present('SENTRY_DSN') ? 'PRESENT' : 'OPTIONAL',
    STORAGE_ENDPOINT: present('STORAGE_ENDPOINT') ? 'PRESENT' : 'OPTIONAL',
  };

  const ready = variables.DATABASE_URL === 'PRESENT';
  send(res, ready ? 200 : 503, { ready, variables });
}
