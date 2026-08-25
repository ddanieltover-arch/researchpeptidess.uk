import { EMAIL_BRAND, EmailAudience, RenderedEmail, isSafeEmailHref, sitePath } from './brand';
import { renderButton } from './blocks';
import { escapeAttribute, escapeHtml, htmlToText } from './escape';

const { colors } = EMAIL_BRAND;

export interface EmailLayoutInput {
  audience: EmailAudience;
  preheader: string;
  eyebrow: string;
  title: string;
  intro: string;
  bodyHtml: string;
  cta?: { label: string; href: string };
  footerNote?: string;
  text?: string;
}

function markHtml(audience: EmailAudience): string {
  if (audience === 'admin') {
    return `
      <span style="display:inline-block; padding:4px 8px; border-radius:999px; background-color:${colors.adminBg}; color:${colors.admin}; font-family:Arial, Helvetica, sans-serif; font-size:10px; font-weight:800; letter-spacing:0.12em; text-transform:uppercase;">
        Operations
      </span>`;
  }
  return `
    <span style="display:inline-block; padding:4px 8px; border-radius:999px; background-color:${colors.ice}; color:${colors.primary}; font-family:Arial, Helvetica, sans-serif; font-size:10px; font-weight:800; letter-spacing:0.12em; text-transform:uppercase;">
      Laboratory catalogue
    </span>`;
}

export function wrapTransactionalEmail(input: EmailLayoutInput): Omit<RenderedEmail, 'subject'> {
  const ctaHtml = input.cta ? renderButton(input.cta.label, input.cta.href) : '';
  const year = new Date().getFullYear();
  const accountHref = sitePath('/account');
  const shopHref = sitePath('/shop');
  const contactHref = `mailto:${EMAIL_BRAND.supportEmail}`;
  const headerBg = input.audience === 'admin' ? '#111827' : colors.navy;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="x-ua-compatible" content="ie=edge" />
  <title>${escapeHtml(input.title)}</title>
</head>
<body style="margin:0; padding:0; background-color:${colors.page};">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
    ${escapeHtml(input.preheader)}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${colors.page}; margin:0; padding:0;">
    <tr>
      <td align="center" style="padding:28px 12px 40px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px; background-color:${colors.card}; border-radius:18px; overflow:hidden; box-shadow:0 18px 40px rgba(15,23,42,0.08);">
          <tr>
            <td style="background-color:${headerBg}; padding:28px 32px 22px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="middle" width="56">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" valign="middle" width="48" height="48" style="width:48px; height:48px; background-color:${colors.primary}; border-radius:24px; font-family:Arial, Helvetica, sans-serif; font-size:16px; font-weight:800; letter-spacing:-0.04em; color:#ffffff;">
                          RP
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td valign="middle" style="padding-left:14px;">
                    <p style="margin:0 0 4px 0; font-family:Arial, Helvetica, sans-serif; font-size:16px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:#ffffff;">
                      Research Peptides <span style="color:#7DD3FC;">UK</span>
                    </p>
                    <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:12px; color:#94A3B8;">
                      ${escapeHtml(EMAIL_BRAND.tagline)}
                    </p>
                  </td>
                  <td valign="middle" align="right">${markHtml(input.audience)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0; line-height:0; font-size:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="40%" height="4" style="background-color:${colors.primary}; font-size:0; line-height:0;">&nbsp;</td>
                  <td width="30%" height="4" style="background-color:${colors.primaryHover}; font-size:0; line-height:0;">&nbsp;</td>
                  <td width="30%" height="4" style="background-color:${colors.sky}; font-size:0; line-height:0;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 12px 32px;">
              <p style="margin:0 0 10px 0; font-family:Arial, Helvetica, sans-serif; font-size:11px; font-weight:800; letter-spacing:0.16em; text-transform:uppercase; color:${input.audience === 'admin' ? colors.admin : colors.primary};">
                ${escapeHtml(input.eyebrow)}
              </p>
              <h1 style="margin:0 0 14px 0; font-family:Arial, Helvetica, sans-serif; font-size:26px; line-height:1.25; font-weight:800; letter-spacing:-0.03em; color:${colors.navy};">
                ${escapeHtml(input.title)}
              </h1>
              <p style="margin:0 0 22px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:${colors.muted};">
                ${escapeHtml(input.intro)}
              </p>
              ${input.bodyHtml}
              ${ctaHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${colors.ice}; border:1px solid #BAE6FD; border-radius:12px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:1.6; color:${colors.navy};">
                      ${escapeHtml(EMAIL_BRAND.legalLine)}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px 32px; border-top:1px solid ${colors.line};">
              <p style="margin:20px 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:1.6; color:${colors.muted};">
                ${input.footerNote ? escapeHtml(input.footerNote) : `Questions about this message? Write to ${EMAIL_BRAND.supportEmail}.`}
              </p>
              <p style="margin:0 0 14px 0; font-family:Arial, Helvetica, sans-serif; font-size:12px;">
                <a href="${escapeAttribute(shopHref)}" style="color:${colors.primary}; text-decoration:none; font-weight:700;">Catalogue</a>
                &nbsp;·&nbsp;
                <a href="${escapeAttribute(accountHref)}" style="color:${colors.primary}; text-decoration:none; font-weight:700;">Account</a>
                &nbsp;·&nbsp;
                <a href="${escapeAttribute(isSafeEmailHref(contactHref) ? contactHref : sitePath('/'))}" style="color:${colors.primary}; text-decoration:none; font-weight:700;">${escapeHtml(EMAIL_BRAND.supportEmail)}</a>
              </p>
              <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:11px; color:#94A3B8;">
                © ${year} ${escapeHtml(EMAIL_BRAND.name)} · ${escapeHtml(getHostLabel())}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    preheader: input.preheader,
    html,
    text:
      input.text ||
      [
        input.title,
        input.intro,
        htmlToText(input.bodyHtml),
        input.cta ? `${input.cta.label}: ${input.cta.href}` : '',
        EMAIL_BRAND.legalLine,
        EMAIL_BRAND.supportEmail,
      ]
        .filter(Boolean)
        .join('\n\n'),
  };
}

function getHostLabel(): string {
  try {
    return new URL(sitePath('/')).host;
  } catch {
    return 'researchpeptidess.uk';
  }
}
