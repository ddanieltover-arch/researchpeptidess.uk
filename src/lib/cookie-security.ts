/**
 * Cookie Secure flag must follow the actual request scheme.
 * `vite preview` sets NODE_ENV=production while still serving http://127.0.0.1,
 * so trusting NODE_ENV alone causes browsers to drop the session cookie.
 */

function hostnameFromHostHeader(hostHeader?: string): string {
  const rawHost = String(hostHeader || '')
    .split(',')[0]
    .trim()
    .toLowerCase();
  if (!rawHost) return '';
  if (rawHost.startsWith('[')) {
    const end = rawHost.indexOf(']');
    return end >= 0 ? rawHost.slice(0, end + 1) : rawHost;
  }
  return rawHost.split(':')[0];
}

function isLocalHostname(hostname: string): boolean {
  return (
    !hostname ||
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('127.') ||
    hostname === '::1' ||
    hostname === '[::1]'
  );
}

export function isSecureCookieRequest(protocolHeader?: string, hostHeader?: string): boolean {
  const forwarded = String(protocolHeader || '')
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);

  if (forwarded.includes('https')) return true;
  if (forwarded.includes('http')) return false;

  const hostname = hostnameFromHostHeader(hostHeader);
  if (isLocalHostname(hostname)) return false;

  return process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
}
