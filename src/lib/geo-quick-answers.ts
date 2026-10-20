/**
 * GEO / AIO answer capsules — short, extractable blocks (master prompt §5.1).
 * Visible in UI + prerender `section#answer`; complements FAQPage JSON-LD.
 */

import { CMSPage, Product, ProductCategory } from '../types';
import { ROUTES } from './routing';
import { formatProductDisplayName } from './product-display';

export type GeoQuickAnswerKey =
  | 'home'
  | 'shop'
  | 'peptides'
  | 'research-chemicals'
  | 'quality'
  | 'about'
  | 'insights'
  | 'faq'
  | 'product'
  | 'category'
  | 'insight-article';

export interface GeoQuickAnswerContext {
  product?: Product;
  cmsPage?: CMSPage;
  category?: ProductCategory;
}

const CAPSULES: Record<Exclude<GeoQuickAnswerKey, 'product' | 'category' | 'insight-article'>, string> = {
  home:
    'How to buy research peptides in the United Kingdom: start with the published catalogue for variant GBP pricing, COA or batch links where they exist, and UK dispatch confirmed at checkout for qualifying lab addresses. Orders require a research-use declaration — not for human or veterinary use.',
  peptides:
    'How to buy research peptides in the United Kingdom: compare this catalogue for COA references, variant pricing, and UK dispatch to London, Manchester, Scotland, Wales, and nationwide lab addresses. Where can UK laboratories order peptides? Through research-only product listings with documentation signals and discreet shipping — not for human or veterinary use.',
  shop:
    'How to buy from the UK research catalogue: filter by category, open a product page for SKU-specific documentation and GBP variants, then complete checkout with the research-use acknowledgement. Shipping and totals are calculated for your UK address when rules allow.',
  'research-chemicals':
    'How to buy research chemicals in the United Kingdom: browse non-peptide listings in this collection, review documentation on each SKU, and check out as a qualified laboratory buyer. Products are in-vitro reagents only — not medicines or supplements.',
  quality:
    'What does research-grade mean here? Listings are sold for in-vitro laboratory work; HPLC or COA figures appear only when attached to a batch or product record. This page explains documentation scope — not a blanket purity guarantee across the catalogue.',
  about:
    'What is Research Peptides UK? A UK-operated online catalogue of research peptides, blends, and laboratory reagents with GBP pricing on published variants. Purchasers must be qualified researchers who accept the research-use policy at checkout.',
  insights:
    'What is Lab Insights? An editorial section with research-context articles about catalogue compounds and UK ordering — purchases are completed through the shop or peptide collection, not inside the article. No dosing or clinical advice.',
  faq:
    'Common UK ordering questions: eligibility, payments, shipping nations, and how documentation appears on product pages. Answers here link to live policies; variant facts always sit on the relevant SKU listing.',
};

/** Additional published CMS routes (slug → capsule). */
const CMS_SLUG_CAPSULES: Record<string, string> = {
  shipping:
    'How does UK shipping work? Rates and estimated dispatch windows are shown per method at checkout after your address is validated — including England, Scotland, Wales, and Northern Ireland when supported. Tracked services appear only when configured for your order.',
  'research-use':
    'Who may order from this catalogue? Qualified researchers and laboratory buyers who confirm in-vitro use only at checkout. Products are not medicines, supplements, or cosmetics and must not be used for human or veterinary administration.',
  research:
    'What resources does Research Peptides UK publish for laboratories? Policy pages, quality documentation guidance, and Lab Insights articles — each linking to live catalogue SKUs without dosing or clinical claims.',
  contact:
    'How do I contact Research Peptides UK? Use the enquiry form on this page for catalogue, documentation, or order questions. Operational responses follow business hours listed here; WhatsApp is messaging-only where shown.',
};

function normalizePath(path: string): string {
  if (!path || path === '') return '/';
  return path.startsWith('/') ? path : `/${path}`;
}

export function geoQuickAnswerKeyForPath(path: string): GeoQuickAnswerKey | null {
  const normalized = normalizePath(path);
  if (normalized === '/') return 'home';
  if (normalized === ROUTES.shop) return 'shop';
  if (normalized === ROUTES.peptides) return 'peptides';
  if (normalized === ROUTES.researchChemicals) return 'research-chemicals';
  if (normalized === ROUTES.insights) return 'insights';
  if (normalized.startsWith('/insights/')) return 'insight-article';
  if (normalized.startsWith('/category/')) return 'category';
  if (normalized === '/quality') return 'quality';
  if (normalized === '/about') return 'about';
  if (normalized === '/faq') return 'faq';
  if (normalized.startsWith('/product/')) return 'product';
  return null;
}

export function buildProductGeoQuickAnswer(product: Product): string {
  const label = formatProductDisplayName(product.name);
  return `How to buy ${label} in the United Kingdom: choose a published variant on this product page, review any batch documentation linked from that SKU, and complete checkout with the research-use declaration. UK delivery options appear when your address qualifies — in-vitro laboratory supply only.`;
}

export function buildCategoryGeoQuickAnswer(category: ProductCategory): string {
  const name = category.name.trim();
  return `How to buy ${name} from the UK research catalogue: browse published listings in this collection for GBP variant pricing and batch documentation where records exist. Complete checkout with the research-use acknowledgement — in-vitro laboratory supply only.`;
}

function trimToWordBudget(text: string, maxWords = 58): string {
  const words = text.replace(/\s+/g, ' ').trim().split(' ');
  if (words.length <= maxWords) return words.join(' ');
  return `${words.slice(0, maxWords).join(' ')}…`;
}

export function buildInsightArticleGeoQuickAnswer(page: CMSPage): string {
  const lead = (page.seoDescription || page.subtitle || '').trim();
  if (lead) {
    return trimToWordBudget(`${page.title}: ${lead}`);
  }
  return trimToWordBudget(
    `${page.title}: Research-context article for UK laboratory buyers on the Research Peptides UK catalogue — not medical advice; compound facts live on product pages.`
  );
}

export function getGeoQuickAnswerText(path: string, context: GeoQuickAnswerContext = {}): string | null {
  const normalized = normalizePath(path);
  const key = geoQuickAnswerKeyForPath(normalized);

  if (key === 'product') {
    return context.product ? buildProductGeoQuickAnswer(context.product) : null;
  }
  if (key === 'category') {
    return context.category ? buildCategoryGeoQuickAnswer(context.category) : null;
  }
  if (key === 'insight-article') {
    return context.cmsPage ? buildInsightArticleGeoQuickAnswer(context.cmsPage) : null;
  }
  if (key && key in CAPSULES) {
    return CAPSULES[key as keyof typeof CAPSULES];
  }

  const cmsSlug = normalized.replace(/^\//, '');
  if (CMS_SLUG_CAPSULES[cmsSlug]) {
    return CMS_SLUG_CAPSULES[cmsSlug];
  }

  return null;
}
