/**
 * Research Peptides UK — Compliance & Regulatory Guard Engine
 *
 * Enforces strict scientific in-vitro presentation:
 * - Rejects any human/veterinary therapeutic, cosmetic, or dosing claims
 * - Governs explicit research-use disclaimer requirements
 * - Validates product descriptions and labels for compliance
 */

export const PROHIBITED_KEYWORDS = [
  'cure',
  'treat',
  'treatment',
  'fat loss',
  'muscle gain',
  'bodybuilding',
  'inject',
  'injection guide',
  'dosage for humans',
  'anti-aging',
  'skin rejuvenation',
  'sexual enhancement',
  'disease prevention',
  'human consumption',
];

export const MANDATORY_RESEARCH_NOTICE =
  'All products sold by Research Peptides UK are exclusively manufactured and distributed for in-vitro laboratory experimentation, analytical standards, and biochemical research. These substances are strictly NOT for human consumption, clinical trials, therapeutic administration, or diagnostic procedures.';

export interface ComplianceAuditResult {
  isCompliant: boolean;
  violations: string[];
  classification: string;
}

export function auditProductCompliance(text: string): ComplianceAuditResult {
  const lower = text.toLowerCase();
  const violations: string[] = [];

  for (const keyword of PROHIBITED_KEYWORDS) {
    if (lower.includes(keyword)) {
      violations.push(`Contains prohibited claim or directive: "${keyword}"`);
    }
  }

  return {
    isCompliant: violations.length === 0,
    violations,
    classification: 'In-Vitro Laboratory Standard (ISO/IEC 17025 Tested)',
  };
}
