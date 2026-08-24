/**
 * Neutralizes a narrow set of clearly unsafe public claims in imported catalogue copy.
 * Does not delete whole descriptions. Broader promotional language is reported separately.
 */
const UNSAFE_PUBLIC_PATTERNS: Array<[RegExp, string]> = [
  [/\bbodybuilding\b/gi, 'laboratory muscle-physiology research'],
  [/\bmuscle building\b/gi, 'muscle-physiology research'],
  [/\bfat loss\b/gi, 'adipose-metabolism research models'],
  [/\bweight loss\b/gi, 'energy-balance research models'],
  [/\brecommended dose\b/gi, 'analytical concentration (research only)'],
  [/\bhuman dose\b/gi, 'in-vitro concentration'],
  [/\bdosing protocol\b/gi, 'analytical protocol (research only)'],
  [/\bsubcutaneous injection\b/gi, 'in-vitro application (not for administration)'],
  [/\bintramuscular injection\b/gi, 'in-vitro application (not for administration)'],
];

export function neutralizeUnsafePublicCopy(text: string): string {
  if (!text) return text;
  return UNSAFE_PUBLIC_PATTERNS.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), text);
}
