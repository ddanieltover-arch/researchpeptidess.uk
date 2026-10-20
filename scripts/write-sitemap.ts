import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ALL_CATALOGUE_PRODUCTS } from '../src/lib/data/all-products';
import { INITIAL_CATEGORIES } from '../src/lib/data/categories';
import { INITIAL_CMS_PAGES } from '../src/lib/cms-data';
import { generateRobotsTxt, generateXmlSitemap } from '../src/lib/seo';

const root = resolve(process.cwd());
writeFileSync(
  resolve(root, 'public/sitemap.xml'),
  generateXmlSitemap(ALL_CATALOGUE_PRODUCTS, INITIAL_CATEGORIES, INITIAL_CMS_PAGES)
);
writeFileSync(resolve(root, 'public/robots.txt'), generateRobotsTxt());
console.log('Wrote public/sitemap.xml and public/robots.txt');
