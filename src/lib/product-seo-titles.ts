import { Product } from '../types';

/** Compound-aligned titles for priority PDPs — avoids inventing SKUs (e.g. NAD 500 mg). */
const COMPOUND_LISTING_TITLES: Record<string, string> = {
  kpv: 'KPV Peptide',
  'glow-blend-ghk-cu-bpc157-tb500': 'Glow Peptide Blend',
  'cjc-1295-no-dac-5mg-ipamorelin-5mg': 'CJC-1295 & Ipamorelin',
  '5-amino-1mq': '5-Amino-1MQ',
  'bacteriostatic-water-0-9-benzyl': 'Bacteriostatic Water',
  'bacteriostatic-water-0-9-sodium-chloride': 'Bacteriostatic Saline',
  'igf-1-lr3-1mg': 'IGF-1 LR3',
  'follistatin-344-1mg': 'Follistatin 344',
  'ghrp-2-10mg': 'GHRP-2',
  'hgh-fragment-176-191-10mg': 'HGH Fragment 176-191',
  'bpc-10mg-tb-10mg-20mg': 'BPC-157 & TB-500 Blend',
  'nad-250mg': 'NAD+ Peptide (250 mg)',
  reta: 'Retatrutide Research Standard',
  'bpc-157': 'BPC-157',
  'ss-31': 'SS-31 (Elamipretide)',
  'ipamorelin-5mg-10mg': 'Ipamorelin',
};

export function buildProductListingTitle(product: Product): string {
  const label = COMPOUND_LISTING_TITLES[product.slug];
  if (label) {
    return `${label} | Research Peptide UK`;
  }
  return `${product.name} | Research Peptides UK`;
}
