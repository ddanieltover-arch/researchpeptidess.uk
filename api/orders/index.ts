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
      await dispatchOrderEmails(
        {
          ...trustedOrder,
          items,
          createdAt:
            typeof trustedOrder.createdAt === 'string' ? trustedOrder.createdAt : new Date().toISOString(),
        },
        trustedPayment,
        ref
      );
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

function addressBlock(order: Record<string, unknown>): string {
  const address =
    order.shippingAddress && typeof order.shippingAddress === 'object'
      ? (order.shippingAddress as Record<string, unknown>)
      : {};
  const lines = [
    address.fullName,
    address.institution,
    address.department,
    address.addressLine1,
    address.addressLine2,
    [address.city, address.county, address.postcode].filter(Boolean).join(', '),
    address.countryName || address.country,
  ]
    .filter(Boolean)
    .map((line) => escapeHtml(String(line)))
    .join('<br/>');
  return kvRows([
    ['Ship to', lines],
    ['Delivery phone', escapeHtml(String(address.phone || ''))],
    ['Delivery email', escapeHtml(String(address.email || order.customerEmail || ''))],
    ['Institution', escapeHtml(String(address.institution || ''))],
    ['Department', escapeHtml(String(address.department || ''))],
    [
      'Carrier',
      escapeHtml(String(order.shippingCarrier || order.shippingMethodName || 'Tracked dispatch')),
    ],
  ]);
}

function itemsBlock(order: Record<string, unknown>): string {
  const currency = order.currency;
  const items = Array.isArray(order.items) ? (order.items as Array<Record<string, unknown>>) : [];
  const rows = items
    .map((item, index) => {
      const bg = index % 2 === 0 ? '#FFFFFF' : '#F4F7FB';
      const unit = Number.isFinite(Number(item.unitPrice))
        ? ` · ${escapeHtml(money(item.unitPrice, currency))} each`
        : '';
      return `<tr><td style="padding:12px 14px;background:${bg};border-bottom:1px solid #E2E8F0"><p style="margin:0 0 2px;font:700 14px Arial;color:#0F172A">${escapeHtml(String(item.productName || 'Item'))}</p><p style="margin:0;font:12px Arial;color:#64748B">${escapeHtml(String(item.variantName || item.size || ''))} · ${escapeHtml(String(item.sku || item.variantSku || '—'))}${unit}</p></td><td align="center" style="padding:12px 10px;background:${bg};border-bottom:1px solid #E2E8F0;font:13px Arial;color:#0F172A">${escapeHtml(String(item.quantity || 0))}</td><td align="right" style="padding:12px 14px;background:${bg};border-bottom:1px solid #E2E8F0;font:700 13px Arial;color:#0F172A">${escapeHtml(money(item.totalPrice, currency))}</td></tr>`;
    })
    .join('');
  const totals: Array<[string, string, boolean?]> = [['Subtotal', money(order.subtotal, currency)]];
  if (Number(order.tierDiscountAmount || 0) > 0) {
    totals.push(['Bulk tier saving', `−${money(order.tierDiscountAmount, currency)}`]);
  }
  if (Number(order.couponDiscountAmount || 0) > 0) {
    totals.push([
      order.couponCode ? `Coupon ${String(order.couponCode)}` : 'Coupon',
      `−${money(order.couponDiscountAmount, currency)}`,
    ]);
  }
  if (Number(order.cryptoDiscountAmount || 0) > 0) {
    totals.push(['Crypto settlement discount', `−${money(order.cryptoDiscountAmount, currency)}`]);
  }
  totals.push([
    Number(order.shippingFee || 0) === 0
      ? 'Shipping'
      : `Shipping · ${String(order.shippingMethodName || 'Tracked')}`,
    Number(order.shippingFee || 0) === 0 ? 'Included' : money(order.shippingFee, currency),
  ]);
  totals.push(['Amount due', money(order.total, currency), true]);
  const totalRows = totals
    .map(
      ([label, value, emphasize]) =>
        `<tr><td align="right" style="padding:6px 10px 6px 14px;font:${emphasize ? '800 14px' : '600 13px'} Arial;color:${emphasize ? '#0B132B' : '#64748B'}">${escapeHtml(label)}</td><td align="right" style="padding:6px 14px;font:${emphasize ? '800 16px' : '700 13px'} Arial;color:${emphasize ? '#4353FF' : '#0F172A'}">${escapeHtml(value)}</td></tr>`
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden"><tr><td style="padding:10px 14px;background:#0B132B;font:800 11px Arial;letter-spacing:.12em;text-transform:uppercase;color:#E2E8F0">Compound</td><td align="center" style="padding:10px;background:#0B132B;font:800 11px Arial;letter-spacing:.12em;text-transform:uppercase;color:#E2E8F0">Qty</td><td align="right" style="padding:10px 14px;background:#0B132B;font:800 11px Arial;letter-spacing:.12em;text-transform:uppercase;color:#E2E8F0">Line total</td></tr>${rows || `<tr><td colspan="3" style="padding:16px;font:13px Arial;color:#64748B">No line items recorded.</td></tr>`}<tr><td colspan="3" style="padding:12px 0 8px;background:#fff"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${totalRows}</table></td></tr></table>`;
}

function settlementBlock(order: Record<string, unknown>, payment: Record<string, unknown>): string {
  const due = money(order.total, order.currency);
  const reference = String(payment.reference || order.orderNumber || '');
  const method = String(order.paymentMethod || payment.method || 'BANK_TRANSFER');
  if (method === 'CRYPTOCURRENCY' || method === 'CRYPTO') {
    const wallet = env('CRYPTO_BTC_WALLET_ADDRESS');
    if (!wallet || /sample|your-wallet/i.test(wallet)) {
      return `<p style="margin:0 0 16px;padding:14px 16px;background:#FFFBEB;border-left:4px solid #B45309;border-radius:8px;font:14px Arial;color:#0F172A">Cryptocurrency wallet is not published yet. Email info@researchpeptidess.uk with order <strong>${escapeHtml(String(order.orderNumber || ''))}</strong> before sending funds.</p>`;
    }
    return `<p style="margin:0 0 12px;padding:14px 16px;background:#F0F9FF;border-left:4px solid #4353FF;border-radius:8px;font:14px Arial;color:#0F172A">Send the GBP-equivalent of <strong>${escapeHtml(due)}</strong> on BTC. Use order <strong>${escapeHtml(reference)}</strong> as your reference.</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${kvRows([
      ['Network', 'BTC'],
      ['Wallet', `<span style="word-break:break-all">${escapeHtml(wallet)}</span>`],
      ['Amount due', escapeHtml(due)],
      ['Order reference', escapeHtml(reference)],
    ])}</table>`;
  }
  const sortCode = env('BANK_TRANSFER_SORT_CODE');
  const accountNumber = env('BANK_TRANSFER_ACCOUNT_NUMBER');
  const accountName = env('BANK_TRANSFER_ACCOUNT_NAME') || 'Research Peptides UK';
  const bankName = env('BANK_TRANSFER_BANK_NAME') || 'UK Faster Payments';
  if (!sortCode || !accountNumber || /20-00-00|12345678/i.test(`${sortCode}${accountNumber}`)) {
    return `<p style="margin:0 0 16px;padding:14px 16px;background:#FFFBEB;border-left:4px solid #B45309;border-radius:8px;font:14px Arial;color:#0F172A">Bank details are not published yet. Email info@researchpeptidess.uk with order <strong>${escapeHtml(String(order.orderNumber || ''))}</strong> before transferring <strong>${escapeHtml(due)}</strong>.</p>`;
  }
  return `<p style="margin:0 0 12px;padding:14px 16px;background:#F0F9FF;border-left:4px solid #4353FF;border-radius:8px;font:14px Arial;color:#0F172A">Please remit <strong>${escapeHtml(due)}</strong> using payment reference <strong>${escapeHtml(reference)}</strong>.</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${kvRows([
    ['Account name', escapeHtml(accountName)],
    ['Bank', escapeHtml(bankName)],
    ['Sort code', escapeHtml(sortCode)],
    ['Account number', escapeHtml(accountNumber)],
    ['Reference', escapeHtml(reference)],
    ['Amount', escapeHtml(due)],
  ])}</table>`;
}

function wrapEmail(params: {
  audience: 'customer' | 'admin';
  eyebrow: string;
  title: string;
  intro: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}): { html: string; text: string } {
  const headerBg = params.audience === 'admin' ? '#111827' : '#0B132B';
  const mark =
    params.audience === 'admin'
      ? `<span style="display:inline-block;padding:4px 8px;border-radius:999px;background:#FEF3C7;color:#92400E;font:800 10px Arial;letter-spacing:.12em;text-transform:uppercase">Operations</span>`
      : `<span style="display:inline-block;padding:4px 8px;border-radius:999px;background:#F0F9FF;color:#4353FF;font:800 10px Arial;letter-spacing:.12em;text-transform:uppercase">Laboratory catalogue</span>`;
  const secondary = params.secondaryLabel && params.secondaryHref
    ? `<td style="padding:0"><a href="${escapeHtml(params.secondaryHref)}" style="display:inline-block;padding:12px 22px;border:2px solid #4353FF;border-radius:10px;font:700 13px Arial;text-decoration:none;color:#4353FF;text-transform:uppercase">${escapeHtml(params.secondaryLabel)}</a></td>`
    : '';
  const html = `<!DOCTYPE html><html lang="en"><body style="margin:0;padding:0;background:#F4F7FB"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7FB"><tr><td align="center" style="padding:28px 12px 40px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 18px 40px rgba(15,23,42,.08)"><tr><td style="background:${headerBg};padding:28px 32px 22px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="56" valign="middle"><div style="width:48px;height:48px;border-radius:24px;background:#4353FF;color:#fff;font:800 16px Arial;text-align:center;line-height:48px">RP</div></td><td valign="middle" style="padding-left:14px"><p style="margin:0 0 4px;font:800 16px Arial;letter-spacing:.08em;text-transform:uppercase;color:#fff">Research Peptides <span style="color:#7DD3FC">UK</span></p><p style="margin:0;font:12px Arial;color:#94A3B8">High-purity analytical &amp; in-vitro research biochemicals</p></td><td align="right" valign="middle">${mark}</td></tr></table></td></tr><tr><td style="padding:0;line-height:0;font-size:0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="40%" height="4" style="background:#4353FF">&nbsp;</td><td width="30%" height="4" style="background:#3B46E0">&nbsp;</td><td width="30%" height="4" style="background:#0EA5E9">&nbsp;</td></tr></table></td></tr><tr><td style="padding:32px"><p style="margin:0 0 10px;font:800 11px Arial;letter-spacing:.16em;text-transform:uppercase;color:${params.audience === 'admin' ? '#92400E' : '#4353FF'}">${escapeHtml(params.eyebrow)}</p><h1 style="margin:0 0 14px;font:800 26px/1.25 Arial;letter-spacing:-.03em;color:#0B132B">${escapeHtml(params.title)}</h1><p style="margin:0 0 22px;font:15px/1.7 Arial;color:#64748B">${escapeHtml(params.intro)}</p>${params.bodyHtml}<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px"><tr><td style="padding:0 10px 0 0"><a href="${escapeHtml(params.ctaHref)}" style="display:inline-block;padding:14px 28px;border-radius:10px;background:#4353FF;font:700 14px Arial;text-decoration:none;color:#fff;text-transform:uppercase">${escapeHtml(params.ctaLabel)}</a></td>${secondary}</tr></table><div style="margin-top:24px;padding:16px 18px;background:#F0F9FF;border:1px solid #BAE6FD;border-radius:12px"><p style="margin:0;font:12px/1.6 Arial;color:#0B132B">For in-vitro laboratory research use only. Not for human or veterinary use.</p></div><p style="margin:20px 0 0;font:12px Arial;color:#64748B">Questions? Write to info@researchpeptidess.uk</p></td></tr></table></td></tr></table></body></html>`;
  const text = [
    params.title,
    params.intro,
    params.bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    `${params.ctaLabel}: ${params.ctaHref}`,
    'For in-vitro laboratory research use only.',
  ].join('\n\n');
  return { html, text };
}

function buildOrderEmail(params: {
  audience: 'customer' | 'admin';
  kind: 'ORDER_RECEIVED' | 'PAYMENT_INSTRUCTIONS' | 'PAYMENT_SUBMITTED';
  order: Record<string, unknown>;
  payment: Record<string, unknown>;
}): { subject: string; html: string; text: string } {
  const orderNumber = String(params.order.orderNumber || params.order.id || '');
  const customerName = String(params.order.customerName || 'there');
  const customerEmail = String(params.order.customerEmail || '');
  const address =
    params.order.shippingAddress && typeof params.order.shippingAddress === 'object'
      ? (params.order.shippingAddress as Record<string, unknown>)
      : {};
  const total = money(params.order.total, params.order.currency);
  const method = String(params.order.paymentMethod || params.payment.method || 'BANK_TRANSFER');
  const methodLabel =
    method === 'CRYPTOCURRENCY' || method === 'CRYPTO'
      ? 'Cryptocurrency'
      : 'UK Faster Payments / bank transfer';
  const proof = String(
    params.order.paymentProofReference || params.payment.transactionHash || params.payment.reference || ''
  );
  const evidenceNotes = String(params.payment.evidenceNotes || params.payment.notes || '');
  const site = 'https://www.researchpeptidess.uk';
  const summary =
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${kvRows([
      ['Order', escapeHtml(orderNumber)],
      ['Status', escapeHtml(String(params.order.status || '').replace(/_/g, ' ').toLowerCase())],
      ['Settlement method', escapeHtml(methodLabel)],
      ['Payment status', escapeHtml(String(params.order.paymentStatus || params.payment.status || '').replace(/_/g, ' ').toLowerCase())],
      ['Payment reference', escapeHtml(proof)],
      ['Evidence notes', escapeHtml(evidenceNotes)],
      ['Customer name', escapeHtml(String(params.order.customerName || ''))],
      ['Customer email', escapeHtml(customerEmail)],
      ['Phone', escapeHtml(String(address.phone || ''))],
      [
        'Research consent',
        params.order.researchConsentSigned === false
          ? 'Not recorded'
          : 'Signed — in-vitro research use only',
      ],
      [
        'Shipping method',
        escapeHtml(
          [params.order.shippingMethodName, params.order.shippingCarrier, params.order.shippingZone]
            .filter(Boolean)
            .join(' · ') || 'Tracked dispatch'
        ),
      ],
    ])}</table>` +
    itemsBlock(params.order) +
    addressBlock(params.order);

  if (params.audience === 'admin') {
    const titles = {
      ORDER_RECEIVED: `New order ${orderNumber}`,
      PAYMENT_INSTRUCTIONS: `Payment instructions sent for ${orderNumber}`,
      PAYMENT_SUBMITTED: `Payment evidence queued · ${orderNumber}`,
    } as const;
    const intros = {
      ORDER_RECEIVED: `${customerName} placed a ${total} order. Items are reserved pending settlement verification.`,
      PAYMENT_INSTRUCTIONS: `The customer was sent ${methodLabel} instructions for ${total}.`,
      PAYMENT_SUBMITTED: 'A customer submitted payment evidence. Reconcile it in the admin verification queue.',
    } as const;
    const extra =
      params.kind === 'PAYMENT_SUBMITTED'
        ? `<p style="margin:0 0 16px;padding:14px 16px;background:#FEF3C7;border-left:4px solid #92400E;border-radius:8px;font:14px Arial">Submitted reference: <strong>${escapeHtml(proof || 'See admin record')}</strong></p>`
        : '';
    const layout = wrapEmail({
      audience: 'admin',
      eyebrow: 'Operations alert',
      title: titles[params.kind],
      intro: intros[params.kind],
      bodyHtml: extra + summary,
      ctaLabel: 'Open admin orders',
      ctaHref: `${site}/admin`,
      secondaryLabel: 'Catalogue',
      secondaryHref: `${site}/shop`,
    });
    return { subject: `[RP-UK] ${titles[params.kind]}`, ...layout };
  }

  if (params.kind === 'PAYMENT_INSTRUCTIONS') {
    const layout = wrapEmail({
      audience: 'customer',
      eyebrow: 'Settlement instructions',
      title: `How to pay ${total}`,
      intro: `Use the destination details below for order ${orderNumber}. Always include the payment reference so finance can match your transfer.`,
      bodyHtml: settlementBlock(params.order, params.payment) + summary,
      ctaLabel: 'Submit payment evidence',
      ctaHref: `${site}/account`,
      secondaryLabel: 'Contact operations',
      secondaryHref: `mailto:info@researchpeptidess.uk?subject=${encodeURIComponent(`Payment help · ${orderNumber}`)}`,
    });
    return { subject: `Payment instructions · ${orderNumber} | Research Peptides UK`, ...layout };
  }

  if (params.kind === 'PAYMENT_SUBMITTED') {
    const layout = wrapEmail({
      audience: 'customer',
      eyebrow: 'Payment evidence',
      title: 'Your settlement reference is in review',
      intro: `We received payment evidence for ${orderNumber}. Finance will reconcile it manually.`,
      bodyHtml:
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${kvRows([
          ['Reference submitted', escapeHtml(proof || 'Recorded')],
        ])}</table>` + summary,
      ctaLabel: 'Open your account',
      ctaHref: `${site}/account`,
    });
    return { subject: `Payment evidence received · ${orderNumber} | Research Peptides UK`, ...layout };
  }

  const layout = wrapEmail({
    audience: 'customer',
    eyebrow: 'Order confirmation',
    title: `Order ${orderNumber} is registered`,
    intro: `Hello ${customerName}. We have recorded your research catalogue order. Items are reserved pending settlement — this is not dispatch confirmation.`,
    bodyHtml:
      `<p style="margin:0 0 16px;padding:14px 16px;background:#F0F9FF;border-left:4px solid #4353FF;border-radius:8px;font:14px Arial;color:#0F172A">Complete settlement using the instructions in the following email, then submit your payment reference from your account.</p>` +
      summary,
    ctaLabel: 'View order in account',
    ctaHref: `${site}/account`,
    secondaryLabel: 'Browse catalogue',
    secondaryHref: `${site}/shop`,
  });
  return { subject: `Order confirmed · ${orderNumber} | Research Peptides UK`, ...layout };
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

async function dispatchOrderEmails(
  order: Record<string, unknown>,
  payment: Record<string, unknown>,
  reference: string
): Promise<void> {
  const customerEmail = String(order.customerEmail || '').trim().toLowerCase();
  if (!customerEmail.includes('@')) return;
  const adminEmail = (env('ADMIN_EMAIL') || 'info@researchpeptidess.uk').toLowerCase();
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
