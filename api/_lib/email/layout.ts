import { EMAIL_BRAND, EmailAudience, RenderedEmail, isSafeEmailHref, sitePath } from './brand';
import { renderButtonRow } from './blocks';
import { escapeAttribute, escapeHtml, htmlToText } from './escape';

const { colors } = EMAIL_BRAND;
const EMAIL_WIDTH = 640;

export interface EmailLayoutInput {
  audience: EmailAudience;
  preheader: string;
  eyebrow: string;
  title: string;
  intro: string;
  bodyHtml: string;
  cta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  footerNote?: string;
  text?: string;
}

function markHtml(audience: EmailAudience): string {
  if (audience === 'admin') {
    return `
      <span style="display:inline-block; padding:5px 10px; border-radius:4px; background-color:${colors.adminBg}; color:${colors.admin}; font-family:Arial, Helvetica, sans-serif; font-size:10px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; white-space:nowrap;">
        Operations
      </span>`;
  }
  return `
    <span style="display:inline-block; padding:5px 10px; border-radius:4px; background-color:${colors.ice}; color:${colors.primary}; font-family:Arial, Helvetica, sans-serif; font-size:10px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; white-space:nowrap;">
      Catalogue
    </span>`;
}

function getHostLabel(): string {
  try {
    return new URL(sitePath('/')).host;
  } catch {
    return 'www.researchpeptidess.uk';
  }
}

export function wrapTransactionalEmail(input: EmailLayoutInput): Omit<RenderedEmail, 'subject'> {
  const ctaHtml = input.cta ? renderButtonRow(input.cta, input.secondaryCta) : '';
  const year = new Date().getFullYear();
  const accountHref = sitePath('/account');
  const shopHref = sitePath('/shop');
  const contactHref = `mailto:${EMAIL_BRAND.supportEmail}`;
  const headerBg = input.audience === 'admin' ? '#0F172A' : colors.navy;
  const accent = input.audience === 'admin' ? colors.admin : colors.primary;
  const hostLabel = getHostLabel();

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="x-ua-compatible" content="ie=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
  <title>${escapeHtml(input.title)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <style>
    table { border-collapse: collapse; }
    td, th { font-family: Arial, Helvetica, sans-serif; }
  </style>
  <![endif]-->
  <style type="text/css">
    html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    * { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    a { text-decoration: none; }
    .email-shell { width: 100% !important; max-width: ${EMAIL_WIDTH}px !important; }
    @media only screen and (max-width: 660px) {
      .email-outer { padding: 16px 12px 28px 12px !important; }
      .email-shell { width: 100% !important; }
      .email-pad { padding-left: 20px !important; padding-right: 20px !important; }
      .email-header-pad { padding: 22px 20px 18px 20px !important; }
      .email-title { font-size: 22px !important; line-height: 1.3 !important; }
      .email-brand-cell,
      .email-mark-cell { display: block !important; width: 100% !important; text-align: left !important; }
      .email-mark-cell { padding-top: 12px !important; }
      .email-btn-stack td { display: block !important; width: 100% !important; padding: 0 0 10px 0 !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; width:100%; background-color:${colors.page}; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; opacity:0; color:transparent; font-size:1px; line-height:1px;">
    ${escapeHtml(input.preheader)}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; background-color:${colors.page}; margin:0; padding:0;">
    <tr>
      <td align="center" class="email-outer" style="padding:40px 24px 48px 24px;">
        <!--[if mso]>
        <table role="presentation" width="${EMAIL_WIDTH}" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td>
        <![endif]-->
        <table role="presentation" class="email-shell" width="${EMAIL_WIDTH}" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:${EMAIL_WIDTH}px; background-color:${colors.card}; border:1px solid ${colors.line}; border-radius:12px; overflow:hidden;">
          <tr>
            <td class="email-header-pad" style="background-color:${headerBg}; padding:28px 40px 24px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="email-brand-cell" valign="middle" style="padding:0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td valign="middle" width="44" style="padding:0;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td align="center" valign="middle" width="44" height="44" style="width:44px; height:44px; background-color:${colors.primary}; border-radius:8px; font-family:Arial, Helvetica, sans-serif; font-size:15px; font-weight:800; letter-spacing:-0.02em; color:#ffffff;">
                                RP
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td valign="middle" style="padding-left:14px;">
                          <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.2; font-weight:800; letter-spacing:0.06em; text-transform:uppercase; color:#ffffff; white-space:nowrap;">
                            Research Peptides <span style="color:#7DD3FC;">UK</span>
                          </p>
                          <p style="margin:5px 0 0 0; font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:1.45; color:#94A3B8;">
                            ${escapeHtml(EMAIL_BRAND.tagline)}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td class="email-mark-cell" valign="middle" align="right" style="padding-left:16px; white-space:nowrap;">
                    ${markHtml(input.audience)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0; line-height:0; font-size:0; background-color:${accent}; height:3px;">&nbsp;</td>
          </tr>
          <tr>
            <td class="email-pad" style="padding:36px 40px 16px 40px;">
              <p style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:11px; font-weight:700; letter-spacing:0.14em; text-transform:uppercase; color:${accent};">
                ${escapeHtml(input.eyebrow)}
              </p>
              <h1 class="email-title" style="margin:0 0 12px 0; font-family:Arial, Helvetica, sans-serif; font-size:24px; line-height:1.3; font-weight:700; letter-spacing:-0.02em; color:${colors.navy};">
                ${escapeHtml(input.title)}
              </h1>
              <p style="margin:0 0 28px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.65; color:${colors.muted};">
                ${escapeHtml(input.intro)}
              </p>
              ${input.bodyHtml}
              <div class="email-btn-stack">${ctaHtml}</div>
            </td>
          </tr>
          <tr>
            <td class="email-pad" style="padding:8px 40px 28px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F8FAFC; border:1px solid ${colors.line}; border-radius:8px;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:1.55; color:${colors.muted};">
                      ${escapeHtml(EMAIL_BRAND.legalLine)}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="email-pad" style="padding:24px 40px 32px 40px; border-top:1px solid ${colors.line}; background-color:#FCFCFD;">
              <p style="margin:0 0 10px 0; font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:1.6; color:${colors.muted};">
                ${input.footerNote ? escapeHtml(input.footerNote) : `Questions about this message? Write to ${EMAIL_BRAND.supportEmail}.`}
              </p>
              <p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:1.5;">
                <a href="${escapeAttribute(shopHref)}" style="color:${colors.primary}; text-decoration:none; font-weight:700;">Catalogue</a>
                <span style="color:#CBD5E1;">&nbsp;&nbsp;|&nbsp;&nbsp;</span>
                <a href="${escapeAttribute(accountHref)}" style="color:${colors.primary}; text-decoration:none; font-weight:700;">Account</a>
                <span style="color:#CBD5E1;">&nbsp;&nbsp;|&nbsp;&nbsp;</span>
                <a href="${escapeAttribute(isSafeEmailHref(contactHref) ? contactHref : sitePath('/'))}" style="color:${colors.primary}; text-decoration:none; font-weight:700;">${escapeHtml(EMAIL_BRAND.supportEmail)}</a>
              </p>
              <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:11px; line-height:1.5; color:#94A3B8;">
                © ${year} ${escapeHtml(EMAIL_BRAND.name)} · ${escapeHtml(hostLabel)}
              </p>
            </td>
          </tr>
        </table>
        <!--[if mso]>
        </td></tr></table>
        <![endif]-->
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
        input.secondaryCta ? `${input.secondaryCta.label}: ${input.secondaryCta.href}` : '',
        EMAIL_BRAND.legalLine,
        EMAIL_BRAND.supportEmail,
      ]
        .filter(Boolean)
        .join('\n\n'),
  };
}
