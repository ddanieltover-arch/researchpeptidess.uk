import { Order, OrderItem } from '../../types';
import { EMAIL_BRAND, formatEmailMoney, isSafeEmailHref, sitePath } from './brand';
import { escapeAttribute, escapeHtml, nl2br } from './escape';

const { colors } = EMAIL_BRAND;

export function renderButton(label: string, href: string): string {
  const safeHref = isSafeEmailHref(href) ? href : sitePath('/');
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px 0;">
      <tr>
        <td align="center" bgcolor="${colors.primary}" style="border-radius:10px; background-color:${colors.primary};">
          <a href="${escapeAttribute(safeHref)}" style="display:inline-block; padding:14px 28px; font-family:Arial, Helvetica, sans-serif; font-size:14px; font-weight:700; letter-spacing:0.04em; text-transform:uppercase; text-decoration:none; color:#ffffff;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>`;
}

export function renderCallout(
  title: string,
  body: string,
  tone: 'info' | 'success' | 'warning' | 'danger' | 'admin' = 'info'
): string {
  const palette = {
    info: { bg: colors.ice, border: '#BAE6FD', title: colors.primary },
    success: { bg: colors.successBg, border: '#A7F3D0', title: colors.success },
    warning: { bg: colors.warningBg, border: '#FDE68A', title: colors.warning },
    danger: { bg: colors.dangerBg, border: '#FECDD3', title: colors.danger },
    admin: { bg: colors.adminBg, border: '#FCD34D', title: colors.admin },
  }[tone];

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;">
      <tr>
        <td style="background-color:${palette.bg}; border:1px solid ${palette.border}; border-left:4px solid ${palette.title}; border-radius:10px; padding:16px 18px;">
          <p style="margin:0 0 6px 0; font-family:Arial, Helvetica, sans-serif; font-size:11px; font-weight:800; letter-spacing:0.12em; text-transform:uppercase; color:${palette.title};">
            ${escapeHtml(title)}
          </p>
          <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.6; color:${colors.text};">
            ${body}
          </p>
        </td>
      </tr>
    </table>`;
}

export function renderKvTable(rows: Array<{ label: string; value: string }>): string {
  const body = rows
    .filter((row) => row.value)
    .map(
      (row, index) => `
        <tr>
          <td style="padding:10px 0; border-top:${index === 0 ? '0' : `1px solid ${colors.line}`}; font-family:Arial, Helvetica, sans-serif; font-size:12px; font-weight:700; letter-spacing:0.04em; text-transform:uppercase; color:${colors.muted}; width:38%; vertical-align:top;">
            ${escapeHtml(row.label)}
          </td>
          <td style="padding:10px 0; border-top:${index === 0 ? '0' : `1px solid ${colors.line}`}; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.5; color:${colors.text};">
            ${row.value}
          </td>
        </tr>`
    )
    .join('');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px 0;">
      ${body}
    </table>`;
}

export function renderMessagePanel(label: string, message: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px 0;">
      <tr>
        <td style="background-color:${colors.page}; border:1px solid ${colors.line}; border-radius:10px; padding:16px 18px;">
          <p style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:11px; font-weight:800; letter-spacing:0.12em; text-transform:uppercase; color:${colors.muted};">
            ${escapeHtml(label)}
          </p>
          <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.7; color:${colors.text}; white-space:pre-wrap;">
            ${nl2br(message)}
          </p>
        </td>
      </tr>
    </table>`;
}

function itemRow(item: OrderItem, currency: Order['currency'], index: number): string {
  const bg = index % 2 === 0 ? colors.card : colors.page;
  return `
    <tr>
      <td style="padding:12px 14px; background-color:${bg}; border-bottom:1px solid ${colors.line}; font-family:Arial, Helvetica, sans-serif; color:${colors.text};">
        <p style="margin:0 0 2px 0; font-size:14px; font-weight:700;">${escapeHtml(item.productName)}</p>
        <p style="margin:0; font-size:12px; color:${colors.muted};">${escapeHtml(item.variantName || item.size)} · ${escapeHtml(item.sku || item.variantSku || '—')}</p>
      </td>
      <td align="center" style="padding:12px 10px; background-color:${bg}; border-bottom:1px solid ${colors.line}; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:${colors.text}; white-space:nowrap;">
        ${escapeHtml(String(item.quantity))}
      </td>
      <td align="right" style="padding:12px 14px; background-color:${bg}; border-bottom:1px solid ${colors.line}; font-family:Arial, Helvetica, sans-serif; font-size:13px; font-weight:700; color:${colors.text}; white-space:nowrap;">
        ${escapeHtml(formatEmailMoney(item.totalPrice, currency))}
      </td>
    </tr>`;
}

export function renderOrderItems(order: Order): string {
  const items = Array.isArray(order.items) ? order.items : [];
  const rows = items.map((item, index) => itemRow(item, order.currency, index)).join('');
  const totals: Array<{ label: string; value: string; emphasize?: boolean }> = [
    { label: 'Subtotal', value: formatEmailMoney(order.subtotal, order.currency) },
  ];
  if (order.tierDiscountAmount > 0) {
    totals.push({ label: 'Bulk tier saving', value: `−${formatEmailMoney(order.tierDiscountAmount, order.currency)}` });
  }
  if (order.couponDiscountAmount > 0) {
    totals.push({
      label: order.couponCode ? `Coupon ${order.couponCode}` : 'Coupon',
      value: `−${formatEmailMoney(order.couponDiscountAmount, order.currency)}`,
    });
  }
  if (order.cryptoDiscountAmount > 0) {
    totals.push({ label: 'Crypto settlement discount', value: `−${formatEmailMoney(order.cryptoDiscountAmount, order.currency)}` });
  }
  totals.push({
    label: order.shippingFee === 0 ? 'Shipping' : `Shipping · ${order.shippingMethodName || 'Tracked'}`,
    value: order.shippingFee === 0 ? 'Included' : formatEmailMoney(order.shippingFee, order.currency),
  });
  totals.push({
    label: 'Amount due',
    value: formatEmailMoney(order.total, order.currency),
    emphasize: true,
  });

  const totalRows = totals
    .map(
      (row) => `
        <tr>
          <td align="right" style="padding:6px 10px 6px 14px; font-family:Arial, Helvetica, sans-serif; font-size:${row.emphasize ? '14px' : '13px'}; font-weight:${row.emphasize ? '800' : '600'}; color:${row.emphasize ? colors.navy : colors.muted};">
            ${escapeHtml(row.label)}
          </td>
          <td align="right" style="padding:6px 14px; font-family:Arial, Helvetica, sans-serif; font-size:${row.emphasize ? '16px' : '13px'}; font-weight:${row.emphasize ? '800' : '700'}; color:${row.emphasize ? colors.primary : colors.text}; white-space:nowrap;">
            ${escapeHtml(row.value)}
          </td>
        </tr>`
    )
    .join('');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 22px 0; border:1px solid ${colors.line}; border-radius:12px; overflow:hidden;">
      <tr>
        <td style="padding:10px 14px; background-color:${colors.navy}; font-family:Arial, Helvetica, sans-serif; font-size:11px; font-weight:800; letter-spacing:0.12em; text-transform:uppercase; color:#E2E8F0;">Compound</td>
        <td align="center" style="padding:10px; background-color:${colors.navy}; font-family:Arial, Helvetica, sans-serif; font-size:11px; font-weight:800; letter-spacing:0.12em; text-transform:uppercase; color:#E2E8F0;">Qty</td>
        <td align="right" style="padding:10px 14px; background-color:${colors.navy}; font-family:Arial, Helvetica, sans-serif; font-size:11px; font-weight:800; letter-spacing:0.12em; text-transform:uppercase; color:#E2E8F0;">Line total</td>
      </tr>
      ${rows || `<tr><td colspan="3" style="padding:16px; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:${colors.muted};">No line items were recorded on this order snapshot.</td></tr>`}
      <tr>
        <td colspan="3" style="padding:12px 0 8px 0; background-color:${colors.card};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${totalRows}
          </table>
        </td>
      </tr>
    </table>`;
}

export function renderAddress(order: Order): string {
  const address = order.shippingAddress;
  if (!address) return '';
  const lines = [
    address.fullName,
    address.institution,
    address.department,
    address.addressLine1,
    address.addressLine2,
    [address.city, address.county, address.postcode].filter(Boolean).join(', '),
    address.countryName || address.country,
    address.phone,
  ]
    .filter(Boolean)
    .map((line) => escapeHtml(line))
    .join('<br />');

  return renderKvTable([
    { label: 'Ship to', value: lines },
    { label: 'Carrier', value: escapeHtml(order.shippingCarrier || order.shippingMethodName || 'Tracked dispatch') },
  ]);
}
