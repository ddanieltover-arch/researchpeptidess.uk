/**
 * Research Peptides UK — Scientific Claim Governance & Content Safety Guard
 *
 * Strictly audits all storefront, product, and CMS content against:
 * 1. Medical / therapeutic / disease treatment claims
 * 2. Personal use / human consumption / cosmetic / bodybuilding / anti-aging promises
 * 3. Dosing / administration / reconstitution / injection instructions
 * 4. Certification & accreditation terms without supporting documentation
 */

export interface ClaimViolation {
  category: 'RESTRICTED_MEDICAL' | 'PERSONAL_USE' | 'DOSING_ADMIN' | 'UNSUPPORTED_CERTIFICATION';
  term: string;
  severity: 'BLOCKING_ERROR' | 'WARNING';
  explanation: string;
  recommendation: string;
}

export interface ContentGovernanceAuditReport {
  isCompliant: boolean;
  score: number; // 0 - 100
  violations: ClaimViolation[];
  containsUnsubstitutedPlaceholders: boolean;
  unsubstitutedPlaceholders: string[];
}

// 1. Prohibited Medical, Therapeutic & Disease Claim Patterns
const MEDICAL_CLAIM_PATTERNS = [
  { term: 'cure', regex: /\b(cure|curing|cures)\b/i, explanation: 'Medical cure claims violate in-vitro research positioning.' },
  { term: 'treat', regex: /\b(treat|treating|treatment|treats)\b/i, explanation: 'Therapeutic treatment claims are strictly prohibited.' },
  { term: 'therapeutic', regex: /\b(therapeutic|therapy)\b/i, explanation: 'Therapeutic efficacy implies clinical/medical utility.' },
  { term: 'disease', regex: /\b(disease|illness|pathology|syndrome)\s+(reversal|prevention|treatment)\b/i, explanation: 'Disease prevention/treatment claims are prohibited.' },
  { term: 'healing', regex: /\b(accelerated healing|wound healing in humans)\b/i, explanation: 'Healing claims must be restricted strictly to in-vitro cellular literature.' },
  { term: 'clinical efficacy', regex: /\b(clinical efficacy|proven in patients)\b/i, explanation: 'Patient or clinical efficacy claims are prohibited.' },
];

// 2. Prohibited Personal Use, Bodybuilding, Fat Loss, & Anti-Aging Patterns
const PERSONAL_USE_PATTERNS = [
  { term: 'human consumption', regex: /\b(human consumption|for consumption|safe to consume|ingest|ingestion)\b/i, explanation: 'Products are strictly for laboratory research and not for human consumption.' },
  { term: 'bodybuilding', regex: /\b(bodybuilding|muscle building|muscle gain|hypertrophy protocol)\b/i, explanation: 'Athletic/bodybuilding claims are strictly prohibited.' },
  { term: 'fat loss', regex: /\b(fat loss|weight loss|appetite suppression in humans|slimming)\b/i, explanation: 'Weight/fat loss claims for human use are prohibited.' },
  { term: 'anti-aging', regex: /\b(anti-aging|anti aging|rejuvenating humans|wrinkle reduction)\b/i, explanation: 'Cosmetic or anti-aging promises are prohibited.' },
  { term: 'sexual enhancement', regex: /\b(libido|sexual enhancement|erectile)\b/i, explanation: 'Personal wellness claims are strictly prohibited.' },
];

// 3. Prohibited Dosing, Administration, Reconstitution, & Injection Directives
const DOSING_ADMIN_PATTERNS = [
  { term: 'injection', regex: /\b(inject|injecting|subcutaneous injection|intramuscular|iv injection|syringe size)\b/i, explanation: 'Human or animal injection instructions are strictly prohibited.' },
  { term: 'dosage guide', regex: /\b(dosage|dosing protocol|cycle length|human dose|recommended dose)\b/i, explanation: 'Dosing guides are prohibited. Use analytical concentration benchmarks (e.g., µg/mL in-vitro).' },
  { term: 'reconstitution guide', regex: /\b(how to reconstitute for injection|mixing with bac water for use)\b/i, explanation: 'Reconstitution instructions intended for self-administration are prohibited.' },
  { term: 'cycle advice', regex: /\b(on-cycle|pct|post cycle therapy|cycle length)\b/i, explanation: 'Cycling advice is prohibited.' },
];

// 4. Certification & Accreditation Language Requiring Documentary Proof
const CERTIFICATION_PATTERNS = [
  { term: 'ISO 17025', regex: /\b(ISO[\s-]?17025|ISO\/IEC[\s-]?17025)\b/i, explanation: 'ISO 17025 must only refer to independent third-party analytical testing facilities, not the merchant entity.' },
  { term: 'GMP', regex: /\b(GMP|cGMP|good manufacturing practice)\b/i, explanation: 'GMP statements must specify supplier raw-material synthesis standards and be supported by batch documentation.' },
  { term: 'pharmaceutical grade', regex: /\b(pharmaceutical grade|pharma grade)\b/i, explanation: 'Avoid "pharmaceutical grade" unless explicitly referencing analytical reagent grade (e.g. USP / EP analytical standard).' },
  { term: 'medical grade', regex: /\b(medical grade|clinical grade)\b/i, explanation: '"Medical grade" is misleading for non-clinical research biochemicals.' },
  { term: '100% pure', regex: /\b(100% pure|guaranteed 100%)\b/i, explanation: 'Chemical compounds have measurable analytical variance. Always cite specific HPLC batch values (e.g. "≥98.0% by HPLC") rather than absolute 100% purity.' },
];

// Known business placeholders that must be resolved before production launch
export const KNOWN_BUSINESS_PLACEHOLDERS = [
  '[LEGAL_ENTITY_NAME]',
  '[REGISTERED_OFFICE_ADDRESS]',
  '[COMPANY_NUMBER]',
  '[VAT_NUMBER]',
  '[PRIMARY_CONTACT_EMAIL]',
  '[SUPPORT_CONTACT_EMAIL]',
  '[DATA_PROTECTION_EMAIL]',
  '[PRIMARY_CONTACT_PHONE]',
  '[GOVERNING_LAW_COUNTRY]',
];

/**
 * Validates text against all compliance & claim governance rules
 */
export function auditContentGovernance(
  text: string,
  hasSupportingDocument = false
): ContentGovernanceAuditReport {
  if (!text) {
    return {
      isCompliant: true,
      score: 100,
      violations: [],
      containsUnsubstitutedPlaceholders: false,
      unsubstitutedPlaceholders: [],
    };
  }

  const violations: ClaimViolation[] = [];

  // Check Medical Claims
  for (const item of MEDICAL_CLAIM_PATTERNS) {
    if (item.regex.test(text)) {
      violations.push({
        category: 'RESTRICTED_MEDICAL',
        term: item.term,
        severity: 'BLOCKING_ERROR',
        explanation: item.explanation,
        recommendation: 'Remove therapeutic claims. Describe exclusively in terms of receptor binding affinities or cellular assay models.',
      });
    }
  }

  // Check Personal Use Claims
  for (const item of PERSONAL_USE_PATTERNS) {
    if (item.regex.test(text)) {
      violations.push({
        category: 'PERSONAL_USE',
        term: item.term,
        severity: 'BLOCKING_ERROR',
        explanation: item.explanation,
        recommendation: 'Remove personal use references. Reiterate in-vitro laboratory research classification.',
      });
    }
  }

  // Check Dosing / Administration Directives
  for (const item of DOSING_ADMIN_PATTERNS) {
    if (item.regex.test(text)) {
      violations.push({
        category: 'DOSING_ADMIN',
        term: item.term,
        severity: 'BLOCKING_ERROR',
        explanation: item.explanation,
        recommendation: 'Remove dosage directives. If applicable, cite academic in-vitro assay concentrations (e.g. 10 nM - 1 µM).',
      });
    }
  }

  // Check Certification Claims
  for (const item of CERTIFICATION_PATTERNS) {
    if (item.regex.test(text)) {
      if (!hasSupportingDocument) {
        violations.push({
          category: 'UNSUPPORTED_CERTIFICATION',
          term: item.term,
          severity: 'WARNING',
          explanation: item.explanation,
          recommendation: 'Ensure a batch Certificate of Analysis (COA) or analytical report is attached, or rephrase to "Analytically documented purity".',
        });
      }
    }
  }

  // Check for business placeholders
  const unsubstitutedPlaceholders: string[] = [];
  for (const placeholder of KNOWN_BUSINESS_PLACEHOLDERS) {
    if (text.includes(placeholder)) {
      unsubstitutedPlaceholders.push(placeholder);
    }
  }

  const hasBlockingErrors = violations.some((v) => v.severity === 'BLOCKING_ERROR');
  const warningCount = violations.filter((v) => v.severity === 'WARNING').length;

  let score = 100;
  if (hasBlockingErrors) {
    score -= 50 + violations.filter((v) => v.severity === 'BLOCKING_ERROR').length * 10;
  }
  score -= warningCount * 10;
  if (unsubstitutedPlaceholders.length > 0) {
    score -= unsubstitutedPlaceholders.length * 5;
  }
  score = Math.max(0, Math.min(100, score));

  return {
    isCompliant: !hasBlockingErrors,
    score,
    violations,
    containsUnsubstitutedPlaceholders: unsubstitutedPlaceholders.length > 0,
    unsubstitutedPlaceholders,
  };
}
