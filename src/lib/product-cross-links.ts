/**
 * Contextual internal (catalogue) and external reference links for PDP copy.
 */

import { Product } from '../types';
import { formatProductDisplayName } from './product-display';
import { isPublicCatalogueProduct } from './merchandising';
import { productPath, ROUTES } from './routing';
import { PEPTIDES_DEMAND_FEATURED_SLUGS, REAGENT_FOOTER_SLUGS } from './featured-catalogue';

export interface ProductCrossLink {
  slug: string;
  label: string;
  note: string;
}

export interface ProductOutboundReference {
  href: string;
  label: string;
  note: string;
}

type CuratedEntry = { slug: string; note: string };

/** Curated cluster links — slug → related catalogue SKUs (inbound to other products). */
const CURATED_CROSS_LINKS: Record<string, CuratedEntry[]> = {
  'ghk-cu': [
    { slug: 'glow-blend-ghk-cu-bpc157-tb500', note: 'Glow blend includes GHK-Cu with BPC-157 and TB-500' },
    { slug: 'klow-blend-ghk-cu-bpc157-tb500-kpv', note: 'KLOW four-peptide blend with GHK-Cu' },
    { slug: 'bpc-157', note: 'Frequently referenced alongside copper peptides in matrix research' },
    { slug: 'thymosin-beta-4-tb500-5mg', note: 'TB-500 listing for thymosin beta-4 research contexts' },
    { slug: 'bacteriostatic-water-0-9-benzyl', note: 'Solvent for lyophilised peptide workflows' },
  ],
  'bpc-157': [
    { slug: 'ghk-cu', note: 'Copper tripeptide often paired in blend research' },
    { slug: 'bpc-5mg-tb-5mg', note: 'BPC-157 & TB-500 combination SKU' },
    { slug: 'glow-blend-ghk-cu-bpc157-tb500', note: 'Glow blend containing BPC-157' },
    { slug: 'kpv', note: 'Tripeptide studied in inflammation models' },
    { slug: 'bacteriostatic-water-0-9-benzyl', note: 'Reconstitution solvent' },
  ],
  'bpc-5mg-tb-5mg': [
    { slug: 'bpc-157', note: 'Single-compound BPC-157 listing' },
    { slug: 'thymosin-beta-4-tb500-5mg', note: 'TB-500 single-compound listing' },
    { slug: 'glow-blend-ghk-cu-bpc157-tb500', note: 'Related multi-peptide blend' },
    { slug: 'bacteriostatic-water-0-9-benzyl', note: 'Laboratory solvent' },
  ],
  kpv: [
    { slug: 'klow-blend-ghk-cu-bpc157-tb500-kpv', note: 'KLOW blend with KPV' },
    { slug: 'bpc-157', note: 'Common catalogue pairing in tripeptide research' },
    { slug: 'ghk-cu', note: 'Copper peptide from the same research catalogue' },
    { slug: 'bacteriostatic-water-0-9-benzyl', note: 'Solvent for peptide preparation' },
  ],
  'glow-blend-ghk-cu-bpc157-tb500': [
    { slug: 'klow-blend-ghk-cu-bpc157-tb500-kpv', note: 'KLOW variant adds KPV' },
    { slug: 'ghk-cu', note: 'GHK-Cu single-compound SKU' },
    { slug: 'bpc-157', note: 'BPC-157 single-compound SKU' },
    { slug: 'thymosin-beta-4-tb500-5mg', note: 'TB-500 single-compound SKU' },
  ],
  'klow-blend-ghk-cu-bpc157-tb500-kpv': [
    { slug: 'glow-blend-ghk-cu-bpc157-tb500', note: 'Glow blend without KPV' },
    { slug: 'kpv', note: 'KPV single-compound listing' },
    { slug: 'ghk-cu', note: 'GHK-Cu component SKU' },
    { slug: 'bpc-157', note: 'BPC-157 component SKU' },
  ],
  'cjc-1295-no-dac-5mg-ipamorelin-5mg': [
    { slug: 'ipamorelin-5mg-10mg', note: 'Ipamorelin single-compound formats' },
    { slug: 'cjc-1295-with-dac-2mg', note: 'CJC-1295 with DAC listing' },
    { slug: 'tesamorelin-5mg-ipamorelin-5mg', note: 'Alternate GH-axis blend SKU' },
    { slug: 'ghrp-2-10mg', note: 'GHRP-2 secretagogue listing' },
  ],
  'igf-1-lr3-1mg': [
    { slug: 'igf-1-des-1mg', note: 'IGF-1 DES truncated variant' },
    { slug: 'follistatin-344-1mg', note: 'Follistatin research material' },
    { slug: 'bacteriostatic-water-0-9-benzyl', note: 'Solvent for reconstitution' },
  ],
  'nad-500mg': [
    { slug: 'glutathione-peptide', note: 'Antioxidant peptide from the same catalogue' },
    { slug: '5-amino-1mq', note: 'Metabolism-related research compound' },
    { slug: 'bacteriostatic-water-0-9-benzyl', note: 'Solvent where protocols require' },
  ],
  '5-amino-1mq': [
    { slug: 'nad-500mg', note: 'NAD+ catalogue listing' },
    { slug: 'bacteriostatic-water-0-9-benzyl', note: 'Solvent for preparation' },
  ],
  sema: [
    { slug: 'tirzepatide', note: 'Incretin research peptide listing' },
    { slug: 'reta', note: 'Triple agonist research listing' },
    { slug: 'bacteriostatic-water-0-9-benzyl', note: 'Reconstitution solvent' },
  ],
  tirzepatide: [
    { slug: 'sema', note: 'GLP-1 class research listing' },
    { slug: 'reta', note: 'Related incretin agonist SKU' },
    { slug: 'bacteriostatic-water-0-9-benzyl', note: 'Laboratory solvent' },
  ],
  reta: [
    { slug: 'sema', note: 'Semaglutide research listing' },
    { slug: 'tirzepatide', note: 'Tirzepatide research listing' },
    { slug: 'bacteriostatic-water-0-9-benzyl', note: 'Solvent for peptide workflows' },
  ],
  'mt-2-melanotan-2-acetate-10mg': [
    { slug: 'mt-1-melanotan-1-acetate-10mg', note: 'Melanotan I research listing' },
    { slug: 'bacteriostatic-water-0-9-benzyl', note: 'Solvent' },
  ],
  'follistatin-344-1mg': [
    { slug: 'igf-1-lr3-1mg', note: 'IGF axis research material' },
    { slug: 'myostatin-1mg', note: 'Myostatin pathway listing' },
  ],
  'ghrp-2-10mg': [
    { slug: 'ghrp-2-pralmorelin-5mg', note: 'Alternate GHRP-2 pack size' },
    { slug: 'cjc-1295-no-dac-5mg-ipamorelin-5mg', note: 'Secretagogue blend SKU' },
    { slug: 'ipamorelin-5mg-10mg', note: 'Selective GHRP listing' },
  ],
  'bacteriostatic-water-0-9-benzyl': [
    { slug: 'bacteriostatic-water-0-9-sodium-chloride', note: 'Sodium chloride bacteriostatic format' },
    { slug: 'bpc-157', note: 'Commonly ordered peptide SKU' },
    { slug: 'ghk-cu', note: 'Copper peptide listing' },
    { slug: 'igf-1-lr3-1mg', note: 'High-demand peptide SKU' },
  ],
};

const LYOPHILIZED_SOLVENT_SLUGS = [...REAGENT_FOOTER_SLUGS];

function resolveProduct(slug: string, catalogue: Product[]): Product | undefined {
  return catalogue.find((p) => p.slug === slug && isPublicCatalogueProduct(p));
}

function toCrossLink(entry: CuratedEntry, product: Product): ProductCrossLink {
  return {
    slug: product.slug,
    label: formatProductDisplayName(product.name),
    note: entry.note,
  };
}

function defaultPeers(product: Product, catalogue: Product[], limit: number): ProductCrossLink[] {
  const peers = catalogue
    .filter(
      (p) =>
        p.id !== product.id &&
        isPublicCatalogueProduct(p) &&
        (p.categoryId === product.categoryId || p.productType === product.productType)
    )
    .sort((a, b) => {
      const aFeatured = PEPTIDES_DEMAND_FEATURED_SLUGS.includes(a.slug) ? 0 : 1;
      const bFeatured = PEPTIDES_DEMAND_FEATURED_SLUGS.includes(b.slug) ? 0 : 1;
      return aFeatured - bFeatured || a.name.localeCompare(b.name);
    });

  return peers.slice(0, limit).map((p) => ({
    slug: p.slug,
    label: formatProductDisplayName(p.name),
    note: 'Published listing in the same research catalogue',
  }));
}

export function getProductCrossLinks(
  product: Product,
  catalogue: Product[],
  maxLinks = 10
): ProductCrossLink[] {
  const seen = new Set<string>([product.slug]);
  const out: ProductCrossLink[] = [];

  const push = (link: ProductCrossLink) => {
    if (seen.has(link.slug) || out.length >= maxLinks) return;
    if (!resolveProduct(link.slug, catalogue)) return;
    seen.add(link.slug);
    out.push(link);
  };

  for (const entry of CURATED_CROSS_LINKS[product.slug] ?? []) {
    const target = resolveProduct(entry.slug, catalogue);
    if (target) push(toCrossLink(entry, target));
  }

  if (
    product.productType === 'PEPTIDE' &&
    !product.slug.includes('bacteriostatic') &&
    !product.slug.includes('water')
  ) {
    for (const solventSlug of LYOPHILIZED_SOLVENT_SLUGS) {
      const solvent = resolveProduct(solventSlug, catalogue);
      if (solvent) {
        push({
          slug: solvent.slug,
          label: formatProductDisplayName(solvent.name),
          note: 'Bacteriostatic solvent for lyophilised peptide workflows',
        });
      }
    }
  }

  for (const demandSlug of PEPTIDES_DEMAND_FEATURED_SLUGS) {
    if (out.length >= maxLinks) break;
    const demand = resolveProduct(demandSlug, catalogue);
    if (demand) {
      push({
        slug: demand.slug,
        label: formatProductDisplayName(demand.name),
        note: 'High-demand peptide or reagent in the UK catalogue',
      });
    }
  }

  for (const peer of defaultPeers(product, catalogue, maxLinks)) {
    push(peer);
  }

  return out.slice(0, maxLinks);
}

export function getProductInboundSiteLinks(product: Product): Array<{ href: string; label: string }> {
  return [
    { href: ROUTES.peptides, label: 'Buy research peptides UK — peptide collection' },
    { href: ROUTES.shop, label: 'Full laboratory shop catalogue' },
    { href: '/quality', label: 'Quality & batch documentation approach' },
    { href: '/research-use', label: 'Research-use policy' },
  ];
}

export function getProductOutboundReferences(product: Product): ProductOutboundReference[] {
  const refs: ProductOutboundReference[] = [];

  if (product.casNumber?.trim()) {
    refs.push({
      href: `https://pubchem.ncbi.nlm.nih.gov/#query=${encodeURIComponent(product.casNumber)}`,
      label: `PubChem — CAS ${product.casNumber}`,
      note: 'Compound summary and identifiers (NCBI).',
    });
  }

  refs.push({
    href: 'https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency',
    label: 'MHRA — UK medicines regulator',
    note: 'How medicines and borderline products are regulated in the UK.',
  });

  if (product.productType !== 'SOLVENT' && product.researchOnly) {
    refs.push({
      href: 'https://www.hse.gov.uk/coshh/',
      label: 'HSE COSHH',
      note: 'Control of substances hazardous to health in UK laboratories.',
    });
  }

  return refs.slice(0, 3);
}

export function crossLinksHtmlForPrerender(product: Product, catalogue: Product[]): string {
  const cross = getProductCrossLinks(product, catalogue, 8);
  const internal = getProductInboundSiteLinks(product);
  const external = getProductOutboundReferences(product);

  const productItems = cross
    .map(
      (l) =>
        `<li><a href="${productPath(l.slug)}">${l.label.replace(/&/g, '&amp;')}</a> — ${l.note.replace(/&/g, '&amp;')}</li>`
    )
    .join('\n    ');

  const siteItems = internal
    .map((l) => `<li><a href="${l.href}">${l.label.replace(/&/g, '&amp;')}</a></li>`)
    .join('\n    ');

  const extItems = external
    .map(
      (l) =>
        `<li><a href="${l.href}" rel="noopener noreferrer">${l.label.replace(/&/g, '&amp;')}</a></li>`
    )
    .join('\n    ');

  return `<section aria-label="Catalogue cross-links">
  <h2>Related compounds in this catalogue</h2>
  <ul>${productItems}</ul>
  <h2>Catalogue &amp; compliance</h2>
  <ul>${siteItems}</ul>
  <h2>External references</h2>
  <ul>${extItems}</ul>
</section>`;
}
