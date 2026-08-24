import fs from 'node:fs';
import path from 'node:path';
import { ALL_CATALOGUE_PRODUCTS } from '../src/lib/data/all-products';
import { auditContentGovernance } from '../src/lib/claim-governance';

const hits: Array<{ id: string; slug: string; name: string; terms: string[] }> = [];

for (const product of ALL_CATALOGUE_PRODUCTS) {
  const report = auditContentGovernance(`${product.shortDescription}\n${product.longDescription}`);
  if (report.violations.length === 0) continue;
  hits.push({
    id: product.id,
    slug: product.slug,
    name: product.name,
    terms: [...new Set(report.violations.map((item) => `${item.severity}:${item.term}`))],
  });
}

const lines = [
  '# Content governance review — imported catalogue copy',
  '',
  `Scanned ${ALL_CATALOGUE_PRODUCTS.length} catalogue products.`,
  `Flagged ${hits.length} records with remaining claim-governance terms after neutralization of the highest-risk public phrases.`,
  '',
  'Do not treat this as automatic deletion. Review each record before publication changes.',
  '',
];

for (const hit of hits) {
  lines.push(`- ${hit.name} (\`${hit.slug}\`): ${hit.terms.join(', ')}`);
}

const out = path.join(process.cwd(), 'docs', 'content-governance-review.md');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${lines.join('\n')}\n`);
console.log(`FLAGGED ${hits.length}`);
