/**
 * Parse catalogue longDescription into structured sections for professional PDP layout.
 */

import { Product } from '../types';
import { documentedPurityLabel, formatProductDisplayName } from './product-display';

export type DescriptionSectionVariant = 'default' | 'disclaimer' | 'references';

export interface DescriptionSection {
  id: string;
  title: string;
  paragraphs: string[];
  bullets: string[];
  keyValues: Array<{ label: string; value: string }>;
  variant: DescriptionSectionVariant;
}

const SECTION_TITLE_RE =
  /^(what is|overview|chemical composition|molecular and chemical|product specifications|research applications|how .+ is used|laboratory|trusted source|scientific references|disclaimer|for research|research-use|what are|peptide name|ghk-cu for)/i;

const KEY_VALUE_RE = /^([A-Za-z0-9][^:]{2,60}):\s*(.+)$/;

function slugify(title: string, index: number): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return base || `section-${index}`;
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function isSectionTitle(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 4 || trimmed.length > 120) return false;
  if (trimmed.endsWith('.') && trimmed.split(' ').length > 8) return false;
  if (SECTION_TITLE_RE.test(trimmed)) return true;
  if (/^[A-Z0-9][A-Za-z0-9\s/&–—'-]{3,80}$/.test(trimmed) && !trimmed.includes(':')) {
    const words = trimmed.split(/\s+/);
    if (words.length <= 10 && words[0] === words[0].toUpperCase().slice(0, 1)) {
      return !trimmed.toLowerCase().startsWith('this product');
    }
  }
  return false;
}

function classifyVariant(title: string, body: string): DescriptionSectionVariant {
  const hay = `${title} ${body}`.toLowerCase();
  if (hay.includes('disclaimer') || hay.includes('for research and laboratory use only')) {
    return 'disclaimer';
  }
  if (hay.includes('scientific references') || hay.includes('pubchem')) {
    return 'references';
  }
  return 'default';
}

function parseBlock(block: string, index: number): DescriptionSection | null {
  const lines = block
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;

  let title = 'Overview';
  let bodyLines = lines;

  if (isSectionTitle(lines[0])) {
    title = normalizeWhitespace(lines[0]);
    bodyLines = lines.slice(1);
  } else if (index === 0 && lines.length === 1 && lines[0].length < 100) {
    title = 'Product overview';
  }

  const paragraphs: string[] = [];
  const bullets: string[] = [];
  const keyValues: Array<{ label: string; value: string }> = [];

  let paragraphBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) return;
    paragraphs.push(normalizeWhitespace(paragraphBuffer.join(' ')));
    paragraphBuffer = [];
  };

  for (const line of bodyLines) {
    const kv = line.match(KEY_VALUE_RE);
    if (kv) {
      flushParagraph();
      keyValues.push({ label: kv[1].trim(), value: kv[2].trim() });
      continue;
    }

    if (line.length < 160 && !line.endsWith('.') && bodyLines.length > 3) {
      const mightBeBullet =
        line.split(' ').length <= 14 &&
        (line.startsWith('-') || /^[A-Z]/.test(line) && !line.includes('.'));
      if (mightBeBullet && keyValues.length > 0) {
        bullets.push(normalizeWhitespace(line.replace(/^[-•]\s*/, '')));
        continue;
      }
    }

    paragraphBuffer.push(line);
  }
  flushParagraph();

  if (
    paragraphs.length === 0 &&
    bullets.length === 0 &&
    keyValues.length === 0 &&
    bodyLines.length > 0
  ) {
    paragraphs.push(normalizeWhitespace(bodyLines.join(' ')));
  }

  const bodySample = [...paragraphs, ...bullets.map((b) => b)].join(' ');
  return {
    id: slugify(title, index),
    title,
    paragraphs,
    bullets,
    keyValues,
    variant: classifyVariant(title, bodySample),
  };
}

export function isMinimalCatalogueDescription(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (trimmed.length < 220) return true;
  return /^supplied strictly for in-vitro/i.test(trimmed) && trimmed.length < 400;
}

export function buildStructuredProductNarrative(product: Product): DescriptionSection[] {
  const displayName = formatProductDisplayName(product.name);
  const purity = documentedPurityLabel(product);

  return [
    {
      id: 'identity',
      title: 'Analytical identity',
      paragraphs: [
        `${displayName} is listed on the Research Peptides UK catalogue as a research biochemical for qualified in-vitro laboratory work. This overview summarises published catalogue fields; batch-specific certificates appear only where attached to the SKU.`,
      ],
      bullets: [],
      keyValues: [
        { label: 'Catalogue SKU', value: product.sku },
        ...(product.casNumber ? [{ label: 'CAS registry', value: product.casNumber }] : []),
        ...(product.molecularFormula
          ? [{ label: 'Molecular formula', value: product.molecularFormula }]
          : []),
        ...(product.molecularWeight
          ? [{ label: 'Molecular weight', value: `${product.molecularWeight} g/mol` }]
          : []),
        ...(product.sequence
          ? [{ label: 'Sequence / formulation', value: product.sequence }]
          : []),
        ...(purity ? [{ label: 'Documented purity', value: purity }] : []),
        { label: 'Physical form', value: product.appearance || 'See variant listing' },
      ],
      variant: 'default',
    },
    {
      id: 'research-scope',
      title: 'Intended research scope',
      paragraphs: [
        product.shortDescription?.trim() ||
          `${displayName} is supplied for controlled laboratory experimentation, method development, and analytical reference — not for human, veterinary, cosmetic, or food use.`,
        'Researchers should confirm internal SOP alignment, solvent compatibility, and storage conditions before ordering. Variant masses and GBP pricing are confirmed on this page and at checkout.',
      ],
      bullets: [
        'In-vitro and preclinical research contexts only',
        'Documentation references HPLC or batch records when published for this SKU',
        'UK dispatch subject to checkout validation and research-use acknowledgement',
      ],
      keyValues: [],
      variant: 'default',
    },
    {
      id: 'handling-summary',
      title: 'Laboratory handling notes',
      paragraphs: [
        product.storageRequirements ||
          'Store lyophilised material sealed, protected from moisture and light, according to your laboratory SOP.',
      ],
      bullets: [
        product.solubility ? `Compatible solvents: ${product.solubility}` : 'Confirm solvent grade against your protocol',
        'Allow vials to reach ambient temperature before opening to reduce condensation',
        'Prepared aliquots may be stored at ultra-low temperature when your SOP requires',
      ],
      keyValues: [],
      variant: 'default',
    },
    {
      id: 'mandate',
      title: 'Research-use mandate',
      paragraphs: [
        'FOR RESEARCH AND LABORATORY USE ONLY. This material is not a medicine, food supplement, or cosmetic product. Purchasing institutions accept full responsibility for containment, labelling, and lawful use within the United Kingdom and their jurisdiction.',
      ],
      bullets: [],
      keyValues: [],
      variant: 'disclaimer',
    },
  ];
}

export function parseProductLongDescription(raw: string, product: Product): DescriptionSection[] {
  const text = raw.trim();
  if (!text || isMinimalCatalogueDescription(text)) {
    return buildStructuredProductNarrative(product);
  }

  const blocks = text.split(/\n\s*\n+/).map((b) => b.trim()).filter(Boolean);
  const sections: DescriptionSection[] = [];

  blocks.forEach((block, index) => {
    const section = parseBlock(block, index);
    if (section) sections.push(section);
  });

  if (sections.length === 0) {
    return buildStructuredProductNarrative(product);
  }

  const hasDisclaimer = sections.some((s) => s.variant === 'disclaimer');
  if (!hasDisclaimer) {
    sections.push({
      id: 'mandate',
      title: 'Research-use mandate',
      paragraphs: [
        'FOR RESEARCH AND LABORATORY USE ONLY. Not for human or veterinary administration. See the research-use policy at checkout.',
      ],
      bullets: [],
      keyValues: [],
      variant: 'disclaimer',
    });
  }

  return sections;
}

export function narrativeLeadParagraph(sections: DescriptionSection[]): string {
  for (const section of sections) {
    if (section.variant === 'disclaimer') continue;
    const first = section.paragraphs[0];
    if (first && first.length > 40) return first;
  }
  return sections[0]?.paragraphs[0] ?? '';
}
