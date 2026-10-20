import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { INITIAL_CMS_PAGES } from '../src/lib/cms-data';
import { INSIGHT_ARTICLES } from '../src/lib/cms-insights-posts';
import { INITIAL_CATEGORIES } from '../src/lib/data/categories';
import { ALL_CATALOGUE_PRODUCTS } from '../src/lib/data/all-products';
import { categoryPath } from '../src/lib/routing';
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
const cmsForPrerender = [...INITIAL_CMS_PAGES, ...INSIGHT_ARTICLES];
const paths = collectPrerenderPaths(ALL_CATALOGUE_PRODUCTS, INITIAL_CATEGORIES, cmsForPrerender);

let written = 0;
for (const path of paths) {
  const seo = resolvePrerenderSeo(path, ALL_CATALOGUE_PRODUCTS, INITIAL_CATEGORIES, cmsForPrerender);
  if (seo.robots.includes('noindex')) {
    continue;
  }
  let categoryPathForNav: string | undefined;
  if (path.startsWith('/product/')) {
    const slug = path.replace('/product/', '');
    const product = ALL_CATALOGUE_PRODUCTS.find((p) => p.slug === slug);
    const cat = product ? INITIAL_CATEGORIES.find((c) => c.id === product.categoryId) : undefined;
    categoryPathForNav = cat ? categoryPath(cat.slug) : undefined;
  }
  const body = buildPrerenderBody(path, seo, { categoryPath: categoryPathForNav });
  const html = applyPrerenderShell(template, seo, body);
  const relative = path === '/' ? 'index.html' : `${path.replace(/^\//, '')}/index.html`;
  const outPath = resolve(distDir, relative);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html, 'utf8');
  written += 1;
}

console.log(`Prerendered ${written} HTML shells into dist/`);
