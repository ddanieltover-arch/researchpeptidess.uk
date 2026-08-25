import { logServerError } from '../http';
import { getEmailRuntimeConfig } from './config';

export interface OutboundEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  tags?: Record<string, string>;
}

export interface EmailSendResult {
  ok: boolean;
  simulated: boolean;
  messageId?: string;
  error?: string;
}

function isValidRecipient(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

async function sendViaResend(message: OutboundEmail, apiKey: string, from: string, replyTo: string): Promise<EmailSendResult> {
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
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        reply_to: message.replyTo || replyTo,
        tags: Object.entries(message.tags || {}).map(([name, value]) => ({
          name: name.slice(0, 40),
          value: String(value).slice(0, 40),
        })),
      }),
      signal: controller.signal,
    });
    const payload = (await response.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!response.ok) {
      return { ok: false, simulated: false, error: payload.message || `Resend HTTP ${response.status}` };
    }
    return { ok: true, simulated: false, messageId: payload.id };
  } finally {
    clearTimeout(timer);
  }
}

export async function sendTransactionalEmail(
  message: OutboundEmail,
  correlationId?: string
): Promise<EmailSendResult> {
  const to = (message.to || '').trim().toLowerCase();
  if (!isValidRecipient(to)) {
    return { ok: false, simulated: false, error: 'Invalid recipient.' };
  }

  const config = getEmailRuntimeConfig();
  if (!config.live) {
    console.log(
      JSON.stringify({
        level: 'info',
        timestamp: new Date().toISOString(),
        operation: 'email_simulated',
        to,
        subject: message.subject,
        provider: config.provider,
      })
    );
    return { ok: true, simulated: true, messageId: `sim-${Date.now().toString(36)}` };
  }

  const apiKey = process.env.RESEND_API_KEY || '';
  try {
    if (config.provider === 'resend') {
      return await sendViaResend(message, apiKey, config.from, config.replyTo);
    }
    return { ok: false, simulated: false, error: `Unsupported email provider: ${config.provider}` };
  } catch (error) {
    if (correlationId) {
      logServerError({ correlationId, route: 'email', operation: 'email_send', error });
    }
    return {
      ok: false,
      simulated: false,
      error: error instanceof Error ? error.message : 'Email send failed.',
    };
  }
}

export async function sendTransactionalEmails(
  messages: OutboundEmail[],
  correlationId?: string
): Promise<EmailSendResult[]> {
  const results: EmailSendResult[] = [];
  for (const message of messages) {
    results.push(await sendTransactionalEmail(message, correlationId));
  }
  return results;
}
