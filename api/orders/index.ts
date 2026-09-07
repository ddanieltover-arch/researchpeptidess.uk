/**
 * Self-contained /api/orders handler for Vercel.
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
  for (const key of ['DATABASE_URL', 'POSTGRES_URL', 'POSTGRES_PRISMA_URL', 'DATABASE_URL_UNPOOLED', 'POSTGRES_URL_NON_POOLING']) {
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

function toPence(value: number): number {
  return Math.round(Number(value || 0) * 100);
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

function normalizeProof(raw?: string): string | undefined {
  const value = (raw || '').trim();
  if (!value) return undefined;
  if (value.toUpperCase() === 'FPS-TRANSFER-PENDING' || value.toUpperCase() === 'CRYPTO-TX-PENDING') return undefined;
  return value;
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
    const inventory = Array.isArray(body.inventory) ? (body.inventory as Array<Record<string, unknown>>) : [];
    const idempotencyKey = typeof body.idempotencyKey === 'string' ? body.idempotencyKey : undefined;

    if (!order?.id || !payment?.id) {
      send(res, 400, { error: 'Order and payment payloads are required.', reference: ref }, ref);
      return;
    }

    const connectionString = resolveDatabaseUrl();
    if (!connectionString) {
      send(res, 500, { error: 'The order could not be stored. Reference: ' + ref, reference: ref, detail: 'DATABASE_URL missing' }, ref);
      return;
    }

    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(connectionString, { fetchOptions: { cache: 'no-store' } });

    const proof = normalizeProof(
      (typeof order.paymentProofReference === 'string' ? order.paymentProofReference : undefined) ||
        (typeof payment.transactionHash === 'string' ? payment.transactionHash : undefined)
    );
    const paymentStatus = proof ? 'SUBMITTED' : 'UNPAID';
    const orderStatus = proof ? 'PAYMENT_SUBMITTED' : 'PENDING_PAYMENT';
    const trustedOrder = {
      ...order,
      paymentProofReference: proof,
      paymentStatus,
      status: orderStatus,
      customerEmail: typeof order.customerEmail === 'string' ? order.customerEmail : '',
      customerName: typeof order.customerName === 'string' ? order.customerName : '',
      items: Array.isArray(order.items) ? order.items : [],
      total: Number(order.total || 0),
    };
    const trustedPayment = {
      ...payment,
      status: paymentStatus,
      transactionHash: proof && order.paymentMethod === 'CRYPTOCURRENCY' ? proof : payment.transactionHash,
    };

    if (idempotencyKey) {
      const existing = (await sql`SELECT payload_json FROM orders WHERE idempotency_key = ${idempotencyKey} LIMIT 1`) as Array<{
        payload_json?: string;
      }>;
      if (existing[0]?.payload_json) {
        const parsed = JSON.parse(existing[0].payload_json);
        const payRows = (await sql`SELECT payload_json FROM order_payments WHERE order_id = ${parsed.id} LIMIT 1`) as Array<{
          payload_json?: string;
        }>;
        send(
          res,
          200,
          {
            duplicate: true,
            order: parsed,
            payment: payRows[0]?.payload_json ? JSON.parse(payRows[0].payload_json) : trustedPayment,
            reference: ref,
          },
          ref
        );
        return;
      }
    }

    const now = new Date();
    const orderId = String(trustedOrder.id);
    const items = trustedOrder.items as Array<Record<string, unknown>>;

    try {
      await sql`
        INSERT INTO orders (
          id, order_number, user_id, customer_email, customer_name,
          subtotal_pence, tier_discount_pence, coupon_code, coupon_discount_pence,
          crypto_discount_pence, shipping_method_id, shipping_pence, total_pence,
          currency, payment_method, status, payment_proof_reference, tracking_number,
          research_consent_signed, shipping_address_json, created_at, updated_at,
          payload_json, app_status, payment_status, idempotency_key
        ) VALUES (
          ${orderId},
          ${String(trustedOrder.orderNumber || '')},
          ${null},
          ${String(trustedOrder.customerEmail || '')},
          ${String(trustedOrder.customerName || '')},
          ${toPence(Number(trustedOrder.subtotal || 0))},
          ${toPence(Number(trustedOrder.tierDiscountAmount || 0))},
          ${typeof trustedOrder.couponCode === 'string' ? trustedOrder.couponCode : null},
          ${toPence(Number(trustedOrder.couponDiscountAmount || 0))},
          ${toPence(Number(trustedOrder.cryptoDiscountAmount || 0))},
          ${typeof trustedOrder.shippingMethodId === 'string' ? trustedOrder.shippingMethodId : null},
          ${toPence(Number(trustedOrder.shippingFee || 0))},
          ${toPence(Number(trustedOrder.total || 0))},
          ${String(trustedOrder.currency || 'GBP')},
          ${String(trustedOrder.paymentMethod || 'BANK_TRANSFER')},
          ${toDbStatus(String(trustedOrder.status))},
          ${typeof trustedOrder.paymentProofReference === 'string' ? trustedOrder.paymentProofReference : null},
          ${typeof trustedOrder.trackingNumber === 'string' ? trustedOrder.trackingNumber : null},
          ${Boolean(trustedOrder.researchConsentSigned)},
          ${JSON.stringify(trustedOrder.shippingAddress || {})},
          ${now},
          ${now},
          ${JSON.stringify(trustedOrder)},
          ${String(trustedOrder.status)},
          ${String(trustedOrder.paymentStatus)},
          ${idempotencyKey ?? null}
        )
      `;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/duplicate|unique|23505/i.test(message) && idempotencyKey) {
        const existing = (await sql`SELECT payload_json FROM orders WHERE id = ${orderId} LIMIT 1`) as Array<{ payload_json?: string }>;
        if (existing[0]?.payload_json) {
          send(res, 200, { duplicate: true, order: JSON.parse(existing[0].payload_json), payment: trustedPayment, reference: ref }, ref);
          return;
        }
      }
      throw error;
    }

    try {
      for (const item of items) {
        await sql`
          INSERT INTO order_items (
            id, order_id, product_id, variant_id, sku, product_name, variant_name, quantity, unit_price_pence, total_price_pence
          ) VALUES (
            ${String(item.id || '')},
            ${orderId},
            ${String(item.productId || '')},
            ${String(item.variantId || '')},
            ${String(item.sku || '')},
            ${String(item.productName || '')},
            ${String(item.variantName || '')},
            ${Number(item.quantity || 0)},
            ${toPence(Number(item.unitPrice || 0))},
            ${toPence(Number(item.totalPrice || 0))}
          )
          ON CONFLICT (id) DO NOTHING
        `;
      }
    } catch (error) {
      await sql`DELETE FROM orders WHERE id = ${orderId}`.catch(() => undefined);
      throw error;
    }

    try {
      await sql`
        INSERT INTO order_payments (
          id, order_id, method, amount_pence, currency, status, reference, transaction_hash, evidence_notes, payload_json, created_at, updated_at
        ) VALUES (
          ${String(trustedPayment.id)},
          ${orderId},
          ${String(trustedPayment.method || 'BANK_TRANSFER')},
          ${toPence(Number(trustedPayment.amount || 0))},
          ${String(trustedPayment.currency || 'GBP')},
          ${String(trustedPayment.status || 'UNPAID')},
          ${typeof trustedPayment.reference === 'string' ? trustedPayment.reference : null},
          ${typeof trustedPayment.transactionHash === 'string' ? trustedPayment.transactionHash : null},
          ${typeof trustedPayment.evidenceNotes === 'string' ? trustedPayment.evidenceNotes : null},
          ${JSON.stringify(trustedPayment)},
          ${now},
          ${now}
        )
      `;
    } catch (error) {
      await sql`DELETE FROM order_items WHERE order_id = ${orderId}`.catch(() => undefined);
      await sql`DELETE FROM orders WHERE id = ${orderId}`.catch(() => undefined);
      throw error;
    }

    try {
      for (const event of inventory) {
        await sql`
          INSERT INTO inventory_events (
            id, variant_id, order_id, transaction_type, quantity_change, balance_after, notes, actor_id, payload_json, created_at
          ) VALUES (
            ${String(event.id || '')},
            ${String(event.variantId || '')},
            ${event.orderId ? String(event.orderId) : null},
            ${String(event.transactionType || 'RESERVATION')},
            ${Number(event.quantityChange || 0)},
            ${Number(event.balanceAfter || 0)},
            ${typeof event.notes === 'string' ? event.notes : null},
            ${typeof event.actorId === 'string' ? event.actorId : null},
            ${JSON.stringify(event)},
            ${new Date(typeof event.createdAt === 'string' ? event.createdAt : Date.now())}
          )
          ON CONFLICT (id) DO NOTHING
        `;
        try {
          await sql`
            UPDATE product_variants
            SET stock_quantity = ${Number(event.balanceAfter || 0)}, updated_at = ${new Date()}
            WHERE id = ${String(event.variantId || '')}
          `;
        } catch {
          // Catalogue-only variant.
        }
      }
    } catch (error) {
      await sql`DELETE FROM inventory_events WHERE order_id = ${orderId}`.catch(() => undefined);
      await sql`DELETE FROM order_payments WHERE order_id = ${orderId}`.catch(() => undefined);
      await sql`DELETE FROM order_items WHERE order_id = ${orderId}`.catch(() => undefined);
      await sql`DELETE FROM orders WHERE id = ${orderId}`.catch(() => undefined);
      throw error;
    }

    try {
      await sql`
        INSERT INTO audit_logs (id, actor, actor_id, action, entity_type, entity_id, payload_json)
        VALUES (
          ${`aud_${orderId}`},
          ${String(trustedOrder.customerEmail || 'guest')},
          ${null},
          ${'ORDER_CREATED'},
          ${'ORDER'},
          ${orderId},
          ${JSON.stringify({
            orderNumber: trustedOrder.orderNumber,
            status: trustedOrder.status,
            paymentStatus: trustedOrder.paymentStatus,
            itemCount: items.length,
          })}
        )
      `;
    } catch {
      // best-effort
    }

    try {
      await dispatchOrderEmails(trustedOrder, trustedPayment, ref);
    } catch (error) {
      console.error(
        JSON.stringify({
          level: 'error',
          route: '/api/orders',
          operation: 'order_email_dispatch',
          reference: ref,
          message: error instanceof Error ? error.message : 'email_failed',
        })
      );
    }

    send(res, 201, { order: trustedOrder, payment: trustedPayment, duplicate: false, reference: ref }, ref);
  } catch (error) {
    const detail = (error instanceof Error ? error.message : 'order_failed').slice(0, 160);
    send(res, 500, { error: 'The order could not be stored. Reference: ' + ref, reference: ref, detail }, ref);
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
  const value = Number(amount || 0);
  const code = String(currency || 'GBP');
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: code }).format(value);
  } catch {
    return `${code} ${value.toFixed(2)}`;
  }
}

function buildOrderEmail(params: {
  audience: 'customer' | 'admin';
  kind: 'ORDER_RECEIVED' | 'PAYMENT_INSTRUCTIONS' | 'PAYMENT_SUBMITTED';
  order: Record<string, unknown>;
  payment: Record<string, unknown>;
}): { subject: string; html: string; text: string } {
  const orderNumber = String(params.order.orderNumber || params.order.id || '');
  const customerName = String(params.order.customerName || 'Customer');
  const customerEmail = String(params.order.customerEmail || '');
  const total = money(params.order.total, params.order.currency);
  const method = String(params.order.paymentMethod || params.payment.method || 'BANK_TRANSFER');
  const methodLabel = method === 'CRYPTOCURRENCY' || method === 'CRYPTO' ? 'Cryptocurrency' : 'UK bank transfer';
  const items = Array.isArray(params.order.items) ? (params.order.items as Array<Record<string, unknown>>) : [];
  const itemLines = items
    .map((item) => {
      const name = escapeHtml(String(item.productName || 'Item'));
      const variant = escapeHtml(String(item.variantName || ''));
      const qty = Number(item.quantity || 0);
      const line = money(item.totalPrice, params.order.currency);
      return `<li>${name}${variant ? ` (${variant})` : ''} × ${qty} — ${escapeHtml(line)}</li>`;
    })
    .join('');

  const isAdmin = params.audience === 'admin';
  let subject = '';
  let intro = '';
  if (params.kind === 'ORDER_RECEIVED') {
    subject = isAdmin ? `New order ${orderNumber}` : `Order ${orderNumber} received`;
    intro = isAdmin
      ? `A new laboratory order was placed by ${escapeHtml(customerName)} (${escapeHtml(customerEmail)}).`
      : `Thank you ${escapeHtml(customerName)}. We have received order <strong>${escapeHtml(orderNumber)}</strong>.`;
  } else if (params.kind === 'PAYMENT_SUBMITTED') {
    subject = isAdmin ? `Payment submitted for ${orderNumber}` : `Payment received for order ${orderNumber}`;
    intro = isAdmin
      ? `Payment evidence was submitted for order ${escapeHtml(orderNumber)}.`
      : `We have recorded your payment submission for order <strong>${escapeHtml(orderNumber)}</strong>.`;
  } else {
    subject = isAdmin ? `Payment instructions for ${orderNumber}` : `Payment instructions for order ${orderNumber}`;
    intro = isAdmin
      ? `Payment instructions were issued for order ${escapeHtml(orderNumber)}.`
      : `Please settle <strong>${escapeHtml(total)}</strong> for order <strong>${escapeHtml(orderNumber)}</strong> by ${escapeHtml(methodLabel)}. Use your order number as the payment reference.`;
  }

  const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#102A43;line-height:1.5">
  <div style="max-width:640px;margin:0 auto;padding:24px">
    <h1 style="font-size:20px;margin:0 0 12px">Research Peptides UK</h1>
    <p>${intro}</p>
    <p><strong>Total:</strong> ${escapeHtml(total)}<br/><strong>Method:</strong> ${escapeHtml(methodLabel)}<br/><strong>Reference:</strong> ${escapeHtml(orderNumber)}</p>
    ${itemLines ? `<p><strong>Items</strong></p><ul>${itemLines}</ul>` : ''}
    <p style="color:#627D98;font-size:12px">Strictly in-vitro laboratory supply. Not for human or veterinary use.</p>
  </div></body></html>`;

  const text = [
    'Research Peptides UK',
    intro.replace(/<[^>]+>/g, ''),
    `Total: ${total}`,
    `Method: ${methodLabel}`,
    `Reference: ${orderNumber}`,
  ].join('\n');

  return { subject, html, text };
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
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  if (!apiKey || /sample|your-|re_sample|xxxxxxxx/i.test(apiKey)) {
    console.log(JSON.stringify({ level: 'info', operation: 'email_simulated', to: params.to, subject: params.subject }));
    return;
  }
  const from =
    (process.env.EMAIL_FROM_ADDRESS || '').trim() || 'Research Peptides UK <info@researchpeptidess.uk>';
  const replyTo =
    params.replyTo ||
    (process.env.EMAIL_REPLY_TO || '').trim() ||
    (process.env.EMAIL_SUPPORT_ADDRESS || '').trim() ||
    'info@researchpeptidess.uk';

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

async function dispatchOrderEmails(
  order: Record<string, unknown>,
  payment: Record<string, unknown>,
  reference: string
): Promise<void> {
  const customerEmail = String(order.customerEmail || '').trim().toLowerCase();
  if (!customerEmail.includes('@')) return;
  const adminEmail = ((process.env.ADMIN_EMAIL || '').trim() || 'info@researchpeptidess.uk').toLowerCase();
  const kinds: Array<'ORDER_RECEIVED' | 'PAYMENT_INSTRUCTIONS' | 'PAYMENT_SUBMITTED'> =
    order.status === 'PAYMENT_SUBMITTED' || Boolean(order.paymentProofReference)
      ? ['ORDER_RECEIVED', 'PAYMENT_SUBMITTED']
      : ['ORDER_RECEIVED', 'PAYMENT_INSTRUCTIONS'];

  for (const kind of kinds) {
    const customer = buildOrderEmail({ audience: 'customer', kind, order, payment });
    const admin = buildOrderEmail({ audience: 'admin', kind, order, payment });
    await sendResendEmail({
      to: customerEmail,
      subject: customer.subject,
      html: customer.html,
      text: customer.text,
      kind: `order_${kind.toLowerCase()}`,
      audience: 'customer',
    });
    await sendResendEmail({
      to: adminEmail,
      subject: admin.subject,
      html: admin.html,
      text: admin.text,
      replyTo: customerEmail,
      kind: `order_${kind.toLowerCase()}`,
      audience: 'admin',
    });
  }
  console.log(JSON.stringify({ level: 'info', operation: 'order_emails_dispatched', reference, kinds }));
}
