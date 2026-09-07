/**
 * Self-contained /api/orders/payment handler for Vercel.
 * No imports from src/ or sibling helpers — those crash this runtime.
 */

export const config = { runtime: 'nodejs' };

type Res = {
  statusCode: number;
  setHeader: (k: string, v: string) => void;
  end: (b: string) => void;
  headersSent?: boolean;
};
type Req = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
};

function send(res: Res, status: number, body: unknown, ref?: string): void {
  if (res.headersSent) return;
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (ref) res.setHeader('x-correlation-id', ref);
  res.end(JSON.stringify(body));
}

function correlationId(req: Req): string {
  const header = req.headers?.['x-correlation-id'];
  const raw = Array.isArray(header) ? header[0] : header;
  if (raw && /^RP-ERR-[A-F0-9]{4}$/i.test(String(raw).trim())) return String(raw).trim().toUpperCase();
  return `RP-ERR-${Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, '0')}`;
}

async function readBody(req: Req): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body as Record<string, unknown>;
  if (typeof req.body === 'string' && req.body.trim()) return JSON.parse(req.body) as Record<string, unknown>;
  return {};
}

function resolveDatabaseUrl(): string | null {
  for (const key of [
    'DATABASE_URL',
    'POSTGRES_URL',
    'POSTGRES_PRISMA_URL',
    'DATABASE_URL_UNPOOLED',
    'POSTGRES_URL_NON_POOLING',
  ]) {
    const value = (process.env[key] || '').trim();
    if (!value || value.includes('sample-project') || value.includes('user:password@')) continue;
    try {
      const url = new URL(value);
      url.searchParams.delete('channel_binding');
      if (!url.searchParams.get('sslmode')) url.searchParams.set('sslmode', 'require');
      return url.toString();
    } catch {
      return value;
    }
  }
  return null;
}

function toDbStatus(status: string): string {
  switch (status) {
    case 'PAYMENT_SUBMITTED':
      return 'payment_submitted';
    case 'PAYMENT_VERIFIED':
      return 'payment_verified';
    case 'PROCESSING':
    case 'PARTIALLY_FULFILLED':
      return 'processing';
    case 'SHIPPED':
      return 'shipped';
    case 'DELIVERED':
      return 'delivered';
    case 'CANCELLED':
    case 'PAYMENT_EXPIRED':
      return 'cancelled';
    case 'REFUNDED':
      return 'refunded';
    default:
      return 'pending_payment';
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function money(amount: unknown, currency: unknown): string {
  const n = Number(amount || 0);
  const code = currency === 'EUR' ? 'EUR' : 'GBP';
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: code }).format(n);
  } catch {
    return `${code === 'EUR' ? '€' : '£'}${n.toFixed(2)}`;
  }
}

function env(name: string): string {
  return (process.env[name] || '').trim();
}

function kvRows(rows: Array<[string, string]>): string {
  return rows
    .filter(([, value]) => Boolean(value && String(value).trim()))
    .map(
      ([label, value], index) =>
        `<tr><td style="padding:8px 0;border-top:${index ? '1px solid #E2E8F0' : '0'};font:700 11px Arial;color:#64748B;text-transform:uppercase;width:38%;vertical-align:top">${escapeHtml(label)}</td><td style="padding:8px 0;border-top:${index ? '1px solid #E2E8F0' : '0'};font:14px/1.5 Arial;color:#0F172A">${value}</td></tr>`
    )
    .join('');
}

async function sendResendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  kind: string;
  audience: string;
}): Promise<void> {
  const apiKey = env('RESEND_API_KEY');
  if (!apiKey || /sample|your-|re_sample|xxxxxxxx/i.test(apiKey)) {
    console.log(
      JSON.stringify({ level: 'info', operation: 'email_simulated', to: params.to, subject: params.subject })
    );
    return;
  }
  const from = env('EMAIL_FROM_ADDRESS') || 'Research Peptides UK <info@researchpeptidess.uk>';
  const replyTo =
    params.replyTo || env('EMAIL_REPLY_TO') || env('EMAIL_SUPPORT_ADDRESS') || 'info@researchpeptidess.uk';
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
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
        reply_to: replyTo,
        tags: [
          { name: 'kind', value: params.kind.slice(0, 40) },
          { name: 'audience', value: params.audience.slice(0, 40) },
        ],
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      throw new Error(payload.message || `Resend HTTP ${response.status}`);
    }
  } finally {
    clearTimeout(timer);
  }
}

async function dispatchPaymentSubmittedEmails(
  order: Record<string, unknown>,
  payment: Record<string, unknown>
): Promise<void> {
  const customerEmail = String(order.customerEmail || '').trim().toLowerCase();
  if (!customerEmail.includes('@')) return;
  const adminEmail = (env('ADMIN_EMAIL') || 'info@researchpeptidess.uk').toLowerCase();
  const orderNumber = String(order.orderNumber || order.id || '');
  const proof = String(order.paymentProofReference || payment.transactionHash || payment.reference || 'Recorded');
  const total = money(order.total, order.currency);
  const site = 'https://www.researchpeptidess.uk';
  const address =
    order.shippingAddress && typeof order.shippingAddress === 'object'
      ? (order.shippingAddress as Record<string, unknown>)
      : {};
  const summary = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${kvRows([
    ['Order', escapeHtml(orderNumber)],
    ['Customer name', escapeHtml(String(order.customerName || ''))],
    ['Customer email', escapeHtml(customerEmail)],
    ['Phone', escapeHtml(String(address.phone || ''))],
    ['Amount', escapeHtml(total)],
    ['Reference submitted', escapeHtml(proof)],
    ['Ship to', escapeHtml(String(address.addressLine1 || ''))],
    ['City', escapeHtml([address.city, address.postcode].filter(Boolean).join(', '))],
  ])}</table>`;

  const customerHtml = `<!DOCTYPE html><html><body style="margin:0;background:#F4F7FB;font-family:Arial,sans-serif"><table role="presentation" width="100%"><tr><td align="center" style="padding:28px 12px"><table role="presentation" width="600" style="width:100%;max-width:600px;background:#fff;border-radius:18px;overflow:hidden"><tr><td style="background:#0B132B;padding:24px 32px;color:#fff"><strong>Research Peptides UK</strong></td></tr><tr><td style="padding:28px 32px"><p style="margin:0 0 8px;font:800 11px Arial;letter-spacing:.16em;text-transform:uppercase;color:#4353FF">Payment evidence</p><h1 style="margin:0 0 12px;font:800 24px Arial;color:#0B132B">Your settlement reference is in review</h1><p style="color:#64748B">We received payment evidence for ${escapeHtml(orderNumber)}. Finance will reconcile it manually.</p>${summary}<p style="margin:24px 0 0"><a href="${site}/account" style="display:inline-block;padding:14px 28px;border-radius:10px;background:#4353FF;color:#fff;text-decoration:none;font:700 14px Arial;text-transform:uppercase">Open your account</a></p></td></tr></table></td></tr></table></body></html>`;
  const adminHtml = `<!DOCTYPE html><html><body style="margin:0;background:#F4F7FB;font-family:Arial,sans-serif"><table role="presentation" width="100%"><tr><td align="center" style="padding:28px 12px"><table role="presentation" width="600" style="width:100%;max-width:600px;background:#fff;border-radius:18px;overflow:hidden"><tr><td style="background:#111827;padding:24px 32px;color:#fff"><strong>Research Peptides UK · Operations</strong></td></tr><tr><td style="padding:28px 32px"><p style="margin:0 0 8px;font:800 11px Arial;letter-spacing:.16em;text-transform:uppercase;color:#92400E">Verification queue</p><h1 style="margin:0 0 12px;font:800 24px Arial;color:#0B132B">Payment evidence queued · ${escapeHtml(orderNumber)}</h1><p style="color:#64748B">Reconcile the submitted reference in admin.</p>${summary}<p style="margin:24px 0 0"><a href="${site}/admin" style="display:inline-block;padding:14px 28px;border-radius:10px;background:#4353FF;color:#fff;text-decoration:none;font:700 14px Arial;text-transform:uppercase">Open admin orders</a></p></td></tr></table></td></tr></table></body></html>`;

  await sendResendEmail({
    to: customerEmail,
    subject: `Payment evidence received · ${orderNumber} | Research Peptides UK`,
    html: customerHtml,
    text: `Payment evidence received for ${orderNumber}. Reference: ${proof}`,
    kind: 'order_payment_submitted',
    audience: 'customer',
  });
  await sendResendEmail({
    to: adminEmail,
    subject: `[RP-UK] Payment evidence queued · ${orderNumber}`,
    html: adminHtml,
    text: `Payment evidence queued for ${orderNumber}. Reference: ${proof}`,
    replyTo: customerEmail,
    kind: 'order_payment_submitted',
    audience: 'admin',
  });
}

export default async function handler(req: Req, res: Res): Promise<void> {
  const ref = correlationId(req);
  try {
    if (req.method !== 'POST') {
      send(res, 405, { error: 'Method not allowed.', reference: ref }, ref);
      return;
    }

    const body = await readBody(req);
    const order = body.order as Record<string, unknown> | undefined;
    const payment = body.payment as Record<string, unknown> | undefined;
    if (!order?.id || !payment?.id) {
      send(res, 400, { error: 'Order and payment payloads are required.', reference: ref }, ref);
      return;
    }

    const connectionString = resolveDatabaseUrl();
    if (!connectionString) {
      send(res, 500, { error: 'Payment state could not be stored. Reference: ' + ref, reference: ref, detail: 'DATABASE_URL missing' }, ref);
      return;
    }

    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(connectionString, { fetchOptions: { cache: 'no-store' } });
    const now = new Date();
    const safeOrder = { ...order };
    const safePayment = { ...payment };

    await sql`
      UPDATE order_payments
      SET
        status = ${String(safePayment.status || '')},
        transaction_hash = ${typeof safePayment.transactionHash === 'string' ? safePayment.transactionHash : null},
        evidence_notes = ${typeof safePayment.evidenceNotes === 'string' ? safePayment.evidenceNotes : null},
        payload_json = ${JSON.stringify(safePayment)},
        updated_at = ${now}
      WHERE id = ${String(payment.id)}
    `;
    await sql`
      UPDATE orders
      SET
        payload_json = ${JSON.stringify(safeOrder)},
        app_status = ${String(safeOrder.status || '')},
        payment_status = ${String(safeOrder.paymentStatus || '')},
        status = ${toDbStatus(String(safeOrder.status || ''))},
        payment_proof_reference = ${typeof safeOrder.paymentProofReference === 'string' ? safeOrder.paymentProofReference : null},
        tracking_number = ${typeof safeOrder.trackingNumber === 'string' ? safeOrder.trackingNumber : null},
        updated_at = ${now}
      WHERE id = ${String(order.id)}
    `;

    try {
      await dispatchPaymentSubmittedEmails(safeOrder, safePayment);
    } catch (error) {
      console.error(
        JSON.stringify({
          level: 'error',
          route: '/api/orders/payment',
          operation: 'order_email_dispatch',
          reference: ref,
          message: error instanceof Error ? error.message : 'email_failed',
        })
      );
    }

    send(res, 200, { ok: true, order: safeOrder, payment: safePayment, reference: ref }, ref);
  } catch (error) {
    const detail = (error instanceof Error ? error.message : 'payment_failed').slice(0, 160);
    send(res, 500, { error: 'Payment state could not be stored. Reference: ' + ref, reference: ref, detail }, ref);
  }
}
