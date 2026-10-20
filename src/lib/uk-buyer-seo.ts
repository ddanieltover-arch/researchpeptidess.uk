/**
 * UK buyer-intent question copy — rotated by product for even geographic coverage.
 * Research-use positioning only; answers must pass claim-governance scans.
 */

import { Product } from '../types';
import { getPurchasableVariants } from './product-display';
import { formatPrice } from './utils';
import { productPath } from './routing';

const SITE_ORIGIN = 'https://researchpeptidess.uk';

export const UK_BUYER_SECTION_HEADING = 'UK ordering questions';

export interface UkBuyerQuestion {
  question: string;
  answer: string;
}

const UK_NATIONS = [
  'England',
  'Scotland',
  'Wales',
  'Northern Ireland',
] as const;

const UK_CITIES = [
  'London',
  'Manchester',
  'Birmingham',
  'Leeds',
  'Bristol',
  'Liverpool',
  'Glasgow',
  'Edinburgh',
  'Cardiff',
  'Belfast',
  'Newcastle upon Tyne',
  'Sheffield',
  'Nottingham',
  'Southampton',
  'Aberdeen',
  'Leicester',
] as const;

function stableIndex(seed: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % modulo;
}

function pickCities(seed: string, count: number): string[] {
  const start = stableIndex(seed, UK_CITIES.length);
  const picked: string[] = [];
  for (let i = 0; i < UK_CITIES.length && picked.length < count; i += 1) {
    const city = UK_CITIES[(start + i) % UK_CITIES.length];
    if (!picked.includes(city)) picked.push(city);
  }
  return picked;
}

function productLabel(product: Product): string {
  return product.name.trim();
}

export function getLowestActiveGbpPrice(product: Product): number | null {
  const variants = getPurchasableVariants(product);
  const source = variants.length > 0 ? variants : product.variants || [];
  if (source.length === 0) return null;
  return Math.min(...source.map((variant) => variant.price));
}

export function formatLowestGbpPrice(product: Product): string | null {
  const lowest = getLowestActiveGbpPrice(product);
  if (lowest == null) return null;
  return formatPrice(lowest, 'GBP');
}

export function getUkBuyerQuestionsForProduct(product: Product): UkBuyerQuestion[] {
  const label = productLabel(product);
  const seed = product.slug || product.id;
  const cities = pickCities(seed, 3);
  const cityList =
    cities.length >= 3
      ? `${cities[0]}, ${cities[1]}, or ${cities[2]}`
      : cities.join(', ');
  const nation = UK_NATIONS[stableIndex(`${seed}-nation`, UK_NATIONS.length)];
  const priceText = formatLowestGbpPrice(product);

  return [
    {
      question: `How to buy ${label} in the United Kingdom`,
      answer:
        `Authorised researchers and institutional buyers can order ${label} through the published Research Peptides UK catalogue: choose a variant on this page, add it to cart, and complete checkout. Eligibility, payment methods, and shipping options are confirmed at checkout. This listing is supplied for in-vitro laboratory research only.`,
    },
    {
      question: `Where can I buy ${label} in ${cityList}, or elsewhere in the UK?`,
      answer:
        `Orders are placed online at Research Peptides UK and dispatched from UK fulfilment when your delivery address qualifies. Coverage includes ${UK_NATIONS.join(', ')} — including cities such as ${cityList} — subject to validation at checkout.`,
    },
    {
      question: `How much for ${label} in the United Kingdom?`,
      answer: priceText
        ? `Listed prices are shown in GBP on this page (from ${priceText} for an active variant at time of listing). Final totals depend on variant, quantity, and the shipping method selected at checkout.`
        : `Prices for ${label} are shown in GBP on this page when variants are published. Final totals depend on quantity and shipping at checkout.`,
    },
    {
      question: `Can I order ${label} online with UK delivery to ${nation}?`,
      answer:
        `When your address and order meet checkout rules, UK delivery options — including destinations in ${nation} — are shown after you enter shipping details. Tracked services appear only when configured for your order.`,
    },
    {
      question: `Who can buy ${label} from a UK research peptide catalogue?`,
      answer:
        `Purchasers must be qualified researchers, laboratory staff, or institutional buyers who confirm in-vitro use only at checkout. ${label} is not sold for personal, cosmetic, or clinical use.`,
    },
    {
      question: `Is ${label} intended for human use in the UK?`,
      answer:
        `No. ${label} is listed as a research biochemical for qualified laboratory work. It is not a medicine, food supplement, or cosmetic product, and must not be used for human or veterinary administration.`,
    },
  ];
}

export function buildProductUkSeoDescription(product: Product): string {
  const label = productLabel(product);
  const priceText = formatLowestGbpPrice(product);
  const priceClause = priceText ? ` from ${priceText}` : '';
  const casClause = product.casNumber ? ` CAS ${product.casNumber}.` : '';
  return `Buy ${label} from a UK in-vitro research catalogue — how to order, where UK delivery applies, and GBP pricing${priceClause}.${casClause} Documentation is shown only where a batch record exists. Research use only.`;
}

export function enrichLongDescriptionWithUkBuyer(product: Product): string {
  const base = (product.longDescription || '').trim();
  if (
    base.includes(UK_BUYER_SECTION_HEADING) ||
    (base.includes('how to buy') && base.includes('United Kingdom'))
  ) {
    return product.longDescription || '';
  }
  const label = productLabel(product);
  const cities = pickCities(product.slug || product.id, 2);
  const cityPhrase = cities.length >= 2 ? `${cities[0]} or ${cities[1]}` : cities[0] || 'the UK';
  const priceText = formatLowestGbpPrice(product);
  const pricePhrase = priceText ? ` (listed from ${priceText} in GBP)` : '';
  const snippet = [
    `${UK_BUYER_SECTION_HEADING} — Researchers searching how to buy ${label} in the United Kingdom, where to order with UK delivery to ${cityPhrase}, or how much ${label} costs in the UK${pricePhrase} can use the dedicated section on this product page.`,
    'Checkout confirms eligibility, shipping, and totals. In-vitro laboratory research supply only.',
  ].join(' ');
  if (!base) return snippet;
  return `${base}\n\n${snippet}`;
}

export function enrichShortDescriptionWithUkBuyer(product: Product): string {
  const base = (product.shortDescription || '').trim();
  const marker = 'UK laboratory buyers';
  if (base.includes(marker)) return base;
  const label = productLabel(product);
  const suffix = `${label} for UK laboratory buyers ordering in-vitro research materials online — documentation where batch records exist.`;
  if (!base) return suffix;
  if (base.length > 180) {
    return `${base} Supplied for UK laboratory buyers; in-vitro research use only.`;
  }
  return `${base} For UK laboratory buyers; in-vitro research use only.`;
}

export function buildProductUkFaqJsonLd(
  product: Product,
  canonicalUrl: string
): Record<string, unknown> {
  const questions = getUkBuyerQuestionsForProduct(product);
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${canonicalUrl}#uk-ordering-questions`,
    mainEntity: questions.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export interface HomeUkBuyerTopic {
  question: string;
  answer: string;
  href?: string;
  linkLabel?: string;
}

/** Homepage and CMS snippets — locations rotate; links stay on real routes only. */
export const HOME_UK_BUYER_TOPICS: HomeUkBuyerTopic[] = [
  {
    question: 'How to buy research peptides in the United Kingdom',
    answer:
      'Browse the published catalogue, add your chosen format to cart, and complete checkout as a qualified researcher. Payment verification and UK shipping methods are shown when your order qualifies.',
    href: '/peptides',
    linkLabel: 'Open the peptide catalogue',
  },
  {
    question: 'Where can I buy laboratory peptides in London, Manchester, or Scotland?',
    answer:
      'Orders ship to qualifying addresses across England, Scotland, Wales, and Northern Ireland — including major cities such as London, Manchester, Birmingham, Glasgow, and Edinburgh — when checkout validates your delivery details.',
    href: '/shipping',
    linkLabel: 'Shipping policy',
  },
  {
    question: 'How much for research-grade peptides in the United Kingdom?',
    answer:
      'Each product page lists active variant prices in GBP. Totals at checkout reflect quantity, selected shipping, and any configured settlement discounts.',
    href: '/shop',
    linkLabel: 'Browse the shop',
  },
  {
    question: 'Can I buy peptides online with tracked UK dispatch?',
    answer:
      'Tracked UK services appear at checkout when configured for your address and order. Dispatch timing follows payment verification and the method you select.',
    href: '/faq',
    linkLabel: 'Ordering FAQ',
  },
  {
    question: 'Who is eligible to order from a UK research peptide supplier?',
    answer:
      'Purchasers must confirm in-vitro laboratory use and meet age and institutional requirements stated at checkout. Products are not sold for human or veterinary administration.',
    href: '/research-use',
    linkLabel: 'Research-use policy',
  },
  {
    question: 'How to buy BPC-157 in the United Kingdom',
    answer:
      'Select a vial size on the BPC-157 product page, add to cart, and finish checkout. COA and batch documentation appear only when records exist on the listing.',
    href: productPath('bpc-157'),
    linkLabel: 'View BPC-157 listing',
  },
];

export function buildHomeUkBuyerFaqJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${SITE_ORIGIN}/#uk-buyer-questions`,
    mainEntity: HOME_UK_BUYER_TOPICS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.href ? `${item.answer} (${SITE_ORIGIN}${item.href})` : item.answer,
      },
    })),
  };
}

export const SHIPPING_UK_BUYER_TOPICS: HomeUkBuyerTopic[] = [
  {
    question: 'Where can I buy research peptides in the United Kingdom with UK shipping?',
    answer:
      'Place your order through the published catalogue; qualifying UK addresses receive dispatch options from the shipping engine at checkout — including England, Scotland, Wales, and Northern Ireland.',
    href: '/peptides',
    linkLabel: 'Peptide catalogue',
  },
  {
    question: 'How to buy peptides online in London, Manchester, or Glasgow',
    answer:
      'Select products online, complete checkout, and enter your delivery address. Cities such as London, Manchester, Birmingham, Glasgow, Edinburgh, Cardiff, and Belfast are served when checkout validates your postcode.',
    href: '/shop',
    linkLabel: 'Browse the shop',
  },
  {
    question: 'How much is UK delivery for research peptide orders?',
    answer:
      'Shipping prices, free-delivery thresholds, and estimated windows are taken from live store configuration and shown at checkout — not from marketing copy on this page.',
    href: '/faq',
    linkLabel: 'Ordering FAQ',
  },
  {
    question: 'Can I track my peptide order within the United Kingdom?',
    answer:
      'Tracked methods display at checkout when configured for your order. Tracking links activate after dispatch according to the courier record.',
  },
  {
    question: 'Do you ship research chemicals to Scotland and Wales?',
    answer:
      'Scottish, Welsh, English, and Northern Irish addresses can qualify when the shipping engine allows them at checkout. Remote or Highland postcodes may use alternate methods or rates.',
  },
  {
    question: 'How quickly are UK orders dispatched after payment?',
    answer:
      'Dispatch follows payment verification and the method you select. Estimated windows are shown per shipping method at checkout rather than as a site-wide guarantee.',
  },
];

export const FAQ_UK_BUYER_TOPICS: HomeUkBuyerTopic[] = [
  ...HOME_UK_BUYER_TOPICS,
  {
    question: 'Where can I buy peptides in Leeds, Bristol, or Newcastle upon Tyne?',
    answer:
      'Online checkout supports qualifying UK delivery addresses across major English cities including Leeds, Bristol, and Newcastle upon Tyne, alongside Scotland, Wales, and Northern Ireland when validated.',
    href: '/shop',
    linkLabel: 'Shop catalogue',
  },
  {
    question: 'How to buy research chemicals in the United Kingdom',
    answer:
      'Use the research chemicals collection, add items to cart, and complete checkout with the research-use declaration. The same payment and shipping rules apply as the peptide catalogue.',
    href: '/research-chemicals',
    linkLabel: 'Research chemicals',
  },
  {
    question: 'How much for BPC-157 or TB-500 in the United Kingdom?',
    answer:
      'Open the product page for each compound to see active GBP variant prices. Totals are confirmed at checkout with shipping and quantity.',
    href: productPath('bpc-157'),
    linkLabel: 'BPC-157 listing',
  },
];

export type CatalogueBuyerContext = 'shop' | 'peptides' | 'research-chemicals' | 'category';

export function getCatalogueUkBuyerTopics(context: CatalogueBuyerContext): HomeUkBuyerTopic[] {
  if (context === 'peptides') {
    return [
      {
        question: 'Can you buy peptides in the UK?',
        answer:
          'Qualified researchers and institutional buyers may order published in-vitro listings through this catalogue when checkout rules are met. Products are not medicines and are not for human or veterinary use. See the research-use policy before payment.',
        href: '/research-use',
        linkLabel: 'Research-use policy',
      },
      {
        question: 'How to buy research peptides in the United Kingdom',
        answer:
          'This catalogue lists published in-vitro peptide formats. Add a variant to cart and finish checkout as a qualified researcher.',
        href: '/faq',
        linkLabel: 'FAQ',
      },
      {
        question: 'Where can I buy peptides in London, Edinburgh, or Cardiff?',
        answer:
          'UK delivery is confirmed at checkout for qualifying addresses across nations and major cities when the shipping engine allows your postcode.',
        href: '/shipping',
        linkLabel: 'Shipping policy',
      },
      {
        question: 'How much for peptides in the United Kingdom?',
        answer:
          'Each card shows GBP pricing from live variant records. Compare sizes on the product page before checkout.',
      },
      {
        question: 'Which peptides ship from the UK catalogue?',
        answer:
          'Published, in-stock listings on this page are available for UK dispatch subject to checkout rules and payment verification.',
      },
    ];
  }
  if (context === 'research-chemicals') {
    return [
      {
        question: 'How to buy research chemicals in the United Kingdom',
        answer:
          'Browse non-peptide compounds in this collection, add to cart, and complete checkout with the research-use acknowledgement.',
        href: '/research-use',
        linkLabel: 'Research-use policy',
      },
      {
        question: 'Where can I order laboratory reagents for UK delivery?',
        answer:
          'Enter your UK address at checkout to see whether England, Scotland, Wales, or Northern Ireland methods apply.',
        href: '/shipping',
        linkLabel: 'Shipping',
      },
      {
        question: 'How much for research chemicals in Manchester or Birmingham?',
        answer:
          'Prices are listed per SKU in GBP. Shipping to English cities such as Manchester and Birmingham uses the rates shown at checkout.',
      },
    ];
  }
  return [
    {
      question: 'How to buy from the UK research catalogue',
      answer:
        'Filter by category or search, open a product page for documentation and variant prices, then check out when ready.',
      href: '/faq',
      linkLabel: 'FAQ',
    },
    {
      question: 'Where can I buy peptides in the United Kingdom?',
      answer:
        'The peptide catalogue and shop list published SKUs with UK dispatch when checkout qualifies your address.',
      href: '/peptides',
      linkLabel: 'Peptides',
    },
    {
      question: 'How much for research-grade listings in the UK?',
      answer:
        'GBP prices appear on product cards and detail pages. Checkout calculates shipping and any settlement discounts.',
    },
  ];
}

export function buildPageUkBuyerFaqJsonLd(
  canonicalPath: string,
  topics: HomeUkBuyerTopic[]
): Record<string, unknown> {
  const canonicalUrl = `${SITE_ORIGIN}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${canonicalUrl}#uk-buyer-questions`,
    mainEntity: topics.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.href ? `${item.answer} (${SITE_ORIGIN}${item.href})` : item.answer,
      },
    })),
  };
}

export function withUkBuyerCatalogueCopy(product: Product): Product {
  const shortDescription = enrichShortDescriptionWithUkBuyer(product);
  const longDescription = enrichLongDescriptionWithUkBuyer(product);
  if (
    shortDescription === product.shortDescription &&
    longDescription === (product.longDescription || '')
  ) {
    return product;
  }
  return { ...product, shortDescription, longDescription };
}
