import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS } from '../src/lib/mock-data';
import { INITIAL_CMS_PAGES } from '../src/lib/cms-data';
import { generateRobotsTxt, generateXmlSitemap } from '../src/lib/seo';

const root = resolve(process.cwd());
writeFileSync(resolve(root, 'public/sitemap.xml'), generateXmlSitemap(INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_CMS_PAGES));
writeFileSync(resolve(root, 'public/robots.txt'), generateRobotsTxt());
console.log('Wrote public/sitemap.xml and public/robots.txt');
