/**
 * Pillar–cluster internal links for catalogue + compliance content (GEO / crawl).
 */

import { ROUTES } from './routing';
import { PRIMARY_DOMAIN } from './seo';

export interface InternalResourceLink {
  href: string;
  label: string;
  cluster: 'catalogue' | 'compliance' | 'support';
}

export const SITE_INTERNAL_RESOURCE_LINKS: InternalResourceLink[] = [
  { href: ROUTES.home, label: 'Research Peptides UK home', cluster: 'catalogue' },
  { href: ROUTES.peptides, label: 'Buy research peptides UK — peptide collection', cluster: 'catalogue' },
  { href: ROUTES.researchChemicals, label: 'Research chemicals catalogue', cluster: 'catalogue' },
  { href: ROUTES.shop, label: 'Full laboratory shop catalogue', cluster: 'catalogue' },
  { href: '/quality', label: 'Quality & HPLC documentation', cluster: 'compliance' },
  { href: '/research-use', label: 'Research-use policy', cluster: 'compliance' },
  { href: '/research', label: 'Technical documentation', cluster: 'compliance' },
  { href: '/shipping', label: 'Shipping & delivery', cluster: 'support' },
  { href: '/faq', label: 'FAQ — ordering & compliance', cluster: 'support' },
  { href: '/contact', label: 'Contact support', cluster: 'support' },
];

/** Official references only — not endorsements. */
export const REGULATORY_EXTERNAL_REFERENCES = [
  {
    href: 'https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency',
    label: 'MHRA (UK medicines regulator)',
  },
  {
    href: 'https://www.hse.gov.uk/coshh/',
    label: 'HSE COSHH — control of substances hazardous to health',
  },
] as const;

export function resourceLinksForPath(pathname: string, categoryPath?: string): InternalResourceLink[] {
  const normalized = pathname.split('?')[0] || '/';
  const base = SITE_INTERNAL_RESOURCE_LINKS.filter((link) => link.href !== normalized);
  if (categoryPath && categoryPath !== normalized) {
    return [{ href: categoryPath, label: 'Back to category collection', cluster: 'catalogue' }, ...base];
  }
  return base;
}

export function buildPrerenderResourceNav(pathname: string, categoryPath?: string): string {
  const links = resourceLinksForPath(pathname, categoryPath).slice(0, 8);
  const items = links
    .map(
      (link) =>
        `<li><a href="${PRIMARY_DOMAIN}${link.href === '/' ? '' : link.href}">${link.label.replace(/&/g, '&amp;')}</a></li>`
    )
    .join('\n    ');
  return `<nav aria-label="Site resources">
  <h2 class="sr-only">Related pages</h2>
  <ul>
    ${items}
  </ul>
</nav>`;
}
