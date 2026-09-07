import { EMAIL_BRAND, RenderedEmail } from './brand';

export interface OutboundEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  tags?: Record<string, string>;
}

function isValidRecipient(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function readEnv(name: string): string {
  return (typeof process !== 'undefined' && process.env && process.env[name] ? process.env[name] : '').trim();
}

export async function sendTransactionalEmail(message: OutboundEmail): Promise<{ ok: boolean; simulated?: boolean; error?: string }> {
  const to = (message.to || '').trim().toLowerCase();
  if (!isValidRecipient(to)) return { ok: false, error: 'Invalid recipient.' };

  const apiKey = readEnv('RESEND_API_KEY');
  if (!apiKey || /sample|your-|re_sample|xxxxxxxx/i.test(apiKey)) {
    console.log(JSON.stringify({ level: 'info', operation: 'email_simulated', to, subject: message.subject }));
    return { ok: true, simulated: true };
  }

  const from = readEnv('EMAIL_FROM_ADDRESS') || `${EMAIL_BRAND.name} <${EMAIL_BRAND.supportEmail}>`;
  const replyTo = message.replyTo || readEnv('EMAIL_REPLY_TO') || EMAIL_BRAND.supportEmail;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        reply_to: replyTo,
        tags: Object.entries(message.tags || {}).map(([name, value]) => ({
          name: name.slice(0, 40),
          value: String(value).slice(0, 40),
        })),
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      return { ok: false, error: payload.message || `Resend HTTP ${response.status}` };
    }
    return { ok: true };
  } finally {
    clearTimeout(timer);
  }
}

export async function sendRenderedPair(
  customerTo: string,
  customer: RenderedEmail,
  admin: RenderedEmail,
  kind: string
): Promise<void> {
  const adminTo = (readEnv('ADMIN_EMAIL') || EMAIL_BRAND.supportEmail).toLowerCase();
  await sendTransactionalEmail({
    to: customerTo,
    subject: customer.subject,
    html: customer.html,
    text: customer.text,
    tags: { kind, audience: 'customer' },
  });
  await sendTransactionalEmail({
    to: adminTo,
    subject: admin.subject,
    html: admin.html,
    text: admin.text,
    replyTo: customerTo,
    tags: { kind, audience: 'admin' },
  });
}
