import { insightPath } from './routing';

/** Canonical PDP slug → Lab Insights article slug (pillar–cluster). */
export const PRODUCT_TO_INSIGHT_SLUG: Record<string, string> = {
  'bacteriostatic-water-0-9-benzyl': 'bacteriostatic-water-uk-laboratories',
  'bacteriostatic-water-0-9-sodium-chloride': 'bacteriostatic-water-uk-laboratories',
  'igf-1-lr3-1mg': 'igf-1-lr3-research-catalogue-notes',
  kpv: 'kpv-peptide-inflammation-research-models',
  'bpc-5mg-tb-5mg': 'bpc-157-tb-500-blend-preclinical-overview',
  'nad-500mg': 'nad-peptide-cellular-metabolism-research',
  'cjc-1295-no-dac-5mg-ipamorelin-5mg': 'cjc-1295-ipamorelin-endocrine-research',
  '5-amino-1mq': 'five-amino-1mq-nnmt-laboratory-research',
  'glow-blend-ghk-cu-bpc157-tb500': 'glow-peptide-blend-ghk-cu-research-context',
  'follistatin-344-1mg': 'follistatin-344-research-material-overview',
  'bpc-157': 'buy-research-peptides-uk-compliance',
  'ghrp-2-10mg': 'ghrp-2-growth-hormone-secretagogue-research',
  'ghrp-2-pralmorelin-5mg': 'ghrp-2-growth-hormone-secretagogue-research',
};

export function insightSlugForProductSlug(productSlug: string): string | undefined {
  return PRODUCT_TO_INSIGHT_SLUG[productSlug];
}

export function insightArticlePathForProductSlug(productSlug: string): string | undefined {
  const slug = insightSlugForProductSlug(productSlug);
  return slug ? insightPath(slug) : undefined;
}
