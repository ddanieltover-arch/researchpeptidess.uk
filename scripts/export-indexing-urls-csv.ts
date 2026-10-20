import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const xml = readFileSync(resolve(root, 'public/sitemap.xml'), 'utf8');
const re = /<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g;

const urls: string[] = [];

let match: RegExpExecArray | null;
while ((match = re.exec(xml))) {
  urls.push(match[1]);
}

const outPath = resolve(root, 'researchpeptidess-uk-indexing-urls.csv');
writeFileSync(outPath, `${urls.join('\n')}\n`, 'utf8');

console.log(`Wrote ${outPath}`);
console.log(`Total URLs: ${urls.length}`);
