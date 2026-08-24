import { auditContentGovernance } from '../../src/lib/claim-governance';
import { auditProductCompliance } from '../../src/lib/compliance';

const ENTITY_MAP: Record<string, string> = {
  amp: '&',
  quot: '"',
  apos: "'",
  lt: '<',
  gt: '>',
  nbsp: ' ',
};

export function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (_, name: string) => ENTITY_MAP[name.toLowerCase()] ?? '');
}

export function htmlToText(html: string): string {
  if (!html) return '';
  const withBreaks = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<h[1-6][^>]*>/gi, '\n\n')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<\/(ul|ol|table)>/gi, '\n\n');
  const stripped = withBreaks.replace(/<[^>]+>/g, ' ');
  return decodeEntities(stripped)
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function dropPromoLines(text: string): string {
  return text
    .split('\n')
    .filter((line) => {
      const lower = line.toLowerCase();
      if (lower.includes('researchpeptide.co.uk')) return false;
      if (/\bbuy\b.{0,40}\bpeptides\b/.test(lower)) return false;
      if (lower.includes('peptides for sale')) return false;
      return true;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const REPLACEMENTS: Array<[RegExp, string]> = [
  [/\banti-aging\b/gi, 'cellular ageing research'],
  [/\banti aging\b/gi, 'cellular ageing research'],
  [/\bwound healing\b/gi, 'tissue-repair'],
  [/\bbodybuilding\b/gi, 'musculoskeletal research models'],
  [/\bfat loss\b/gi, 'lipid-metabolism research'],
  [/\bweight loss\b/gi, 'metabolic research'],
  [/\bsexual enhancement\b/gi, 'melanocortin-pathway research'],
  [/\blibido\b/gi, 'melanocortin signalling'],
  [/\binjecting\b/gi, 'laboratory administration in experimental models'],
  [/\binject\b/gi, 'laboratory administration in experimental models'],
  [/\bsubcutaneous\b/gi, 'in-vitro assay'],
  [/\bintramuscular\b/gi, 'in-vitro assay'],
  [/\bdosage\b/gi, 'assay concentration'],
  [/\bdosing protocol\b/gi, 'experimental concentration range'],
  [/\btreatment\b/gi, 'investigation'],
  [/\btreating\b/gi, 'investigating'],
  [/\btreats\b/gi, 'is studied for'],
  [/\btreat\b/gi, 'investigate'],
  [/\btherapeutic\b/gi, 'experimental'],
  [/\btherapy\b/gi, 'research'],
];

export function rewriteForCompliance(text: string): string {
  let next = text;
  for (const [pattern, replacement] of REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }
  return next.replace(/[ \t]{2,}/g, ' ').trim();
}

const RESEARCH_CLOSE =
  'Supplied strictly for in-vitro laboratory research and analytical use. Not for human or veterinary use.';

export function sanitizeProductCopy(html: string, excerptHtml = ''): {
  shortDescription: string;
  longDescription: string;
  warnings: string[];
} {
  const raw = dropPromoLines(htmlToText(html) || htmlToText(excerptHtml));
  const rewritten = rewriteForCompliance(raw);
  const hasResearchFrame =
    /in-vitro|not for human|research use only|laboratory and research use only/i.test(rewritten);
  const longDescription = hasResearchFrame || !rewritten
    ? rewritten || RESEARCH_CLOSE
    : `${rewritten}\n\n${RESEARCH_CLOSE}`.trim();

  const firstParagraph = longDescription.split(/\n{2,}/)[0] || longDescription;
  const shortDescription =
    firstParagraph.length > 280 ? `${firstParagraph.slice(0, 277).trim()}…` : firstParagraph;

  const governance = auditContentGovernance(longDescription);
  const compliance = auditProductCompliance(longDescription);
  const warnings = [
    ...governance.violations.map((item) => `${item.severity}: ${item.term}`),
    ...compliance.violations,
  ];

  return { shortDescription, longDescription, warnings };
}

export function extractSpecs(text: string): {
  casNumber?: string;
  molecularFormula?: string;
  molecularWeight?: number;
  sequence?: string;
  purityValue?: number;
  appearance?: string;
  storageRequirements?: string;
  solubility?: string;
} {
  const specs: ReturnType<typeof extractSpecs> = {};
  const cas = text.match(/\bCAS(?:\s+Number)?\s*[:–-]?\s*([0-9]{2,7}-\d{2}-\d)\b/i);
  if (cas) specs.casNumber = cas[1];

  const formula = text.match(/Molecular Formula\s*[:–-]?\s*([A-Z][A-Za-z0-9₀-₉\-]{2,80})/i);
  if (formula) specs.molecularFormula = formula[1].replace(/\s+/g, '');

  const mw = text.match(/Molecular Weight\s*[:–-]?\s*~?\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (mw) specs.molecularWeight = Number(mw[1]);

  const sequence = text.match(
    /(?:Amino Acid Sequence|Sequence)\s*[:–-]?\s*([A-Za-z][A-Za-z0-9\-–₂NHAc(),\s]{4,500}?)(?=\s*(?:Molecular Formula|Molecular Weight|Peptide Type|Peptide Form|Form:|Purity|Testing Methods|$))/i
  );
  if (sequence) specs.sequence = sequence[1].replace(/\s+/g, ' ').trim();

  const purity = text.match(/Purity\s*[:–-]?\s*(?:≥|>=)?\s*([0-9]{2}(?:\.[0-9]+)?)\s*%/i);
  if (purity) specs.purityValue = Number(purity[1]);

  if (/lyophilized/i.test(text)) specs.appearance = 'Lyophilized White Powder';
  if (/nasal spray|metered/i.test(text)) specs.appearance = 'Metered aqueous solution';
  if (/bacteriostatic water|sterile water/i.test(text) && /benzyl alcohol/i.test(text)) {
    specs.appearance = 'Clear, Colourless Liquid in Crimp-Sealed Glass Vial';
  }

  if (/-20\s*°?\s*C/i.test(text)) {
    specs.storageRequirements = 'Store sealed at -20°C in a desiccated laboratory freezer';
  } else if (/2\s*[–-]\s*8\s*°?\s*C/i.test(text)) {
    specs.storageRequirements = 'Store refrigerated at 2°C–8°C, protected from light';
  }

  if (/reconstitute|sterile/i.test(text)) {
    specs.solubility = 'Sterile Water / Bacteriostatic Laboratory Solvent';
  }

  return specs;
}
