import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { INITIAL_CMS_PAGES } from '../src/lib/cms-data';
import { INITIAL_CATEGORIES } from '../src/lib/data/categories';
import { ALL_CATALOGUE_PRODUCTS } from '../src/lib/data/all-products';
import {
  applyPrerenderShell,
  buildPrerenderBody,
  collectPrerenderPaths,
  resolvePrerenderSeo,
} from '../src/lib/prerender-html';

const root = resolve(process.cwd());
const distDir = resolve(root, 'dist');
const templatePath = resolve(distDir, 'index.html');

const template = readFileSync(templatePath, 'utf8');
const paths = collectPrerenderPaths(ALL_CATALOGUE_PRODUCTS, INITIAL_CATEGORIES, INITIAL_CMS_PAGES);

let written = 0;
for (const path of paths) {
  const seo = resolvePrerenderSeo(path, ALL_CATALOGUE_PRODUCTS, INITIAL_CATEGORIES, INITIAL_CMS_PAGES);
  if (seo.robots.includes('noindex')) {
    continue;
  }
  const body = buildPrerenderBody(path, seo);
  const html = applyPrerenderShell(template, seo, body);
  const relative = path === '/' ? 'index.html' : `${path.replace(/^\//, '')}/index.html`;
  const outPath = resolve(distDir, relative);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html, 'utf8');
  written += 1;
}

console.log(`Prerendered ${written} HTML shells into dist/`);
