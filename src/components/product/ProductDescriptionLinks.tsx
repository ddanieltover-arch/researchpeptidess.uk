import React from 'react';
import { Product } from '../../types';
import { AppLink } from '../ui/AppLink';
import { productPath } from '../../lib/routing';
import {
  getProductCrossLinks,
  getProductInboundSiteLinks,
  getProductOutboundReferences,
} from '../../lib/product-cross-links';

interface ProductDescriptionLinksProps {
  product: Product;
  catalogue: Product[];
}

export const ProductDescriptionLinks: React.FC<ProductDescriptionLinksProps> = ({
  product,
  catalogue,
}) => {
  const crossLinks = getProductCrossLinks(product, catalogue, 10);
  const siteLinks = getProductInboundSiteLinks(product);
  const outbound = getProductOutboundReferences(product);

  return (
    <div className="space-y-6 border-t border-slate-200 pt-6 text-sm text-slate-700">
      <section aria-labelledby="pdp-cross-links-heading">
        <h4
          id="pdp-cross-links-heading"
          className="text-sm font-bold uppercase font-mono text-slate-900"
        >
          Related compounds in this catalogue
        </h4>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">
          Internal links to other published SKUs researchers often compare alongside{' '}
          {product.name.trim()}. Variant facts and documentation remain on each product page.
        </p>
        <ul className="mt-3 space-y-2.5">
          {crossLinks.map((link) => (
            <li key={link.slug} className="leading-snug">
              <AppLink
                href={productPath(link.slug)}
                className="font-semibold text-[#4353FF] hover:underline"
              >
                {link.label}
              </AppLink>
              <span className="text-slate-600"> — {link.note}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="pdp-site-links-heading">
        <h4
          id="pdp-site-links-heading"
          className="text-sm font-bold uppercase font-mono text-slate-900"
        >
          Catalogue &amp; compliance
        </h4>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {siteLinks.map((link) => (
            <li key={link.href}>
              <AppLink href={link.href} className="font-medium text-[#4353FF] hover:underline">
                {link.label}
              </AppLink>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="pdp-outbound-heading">
        <h4
          id="pdp-outbound-heading"
          className="text-sm font-bold uppercase font-mono text-slate-900"
        >
          External references
        </h4>
        <p className="mt-1 text-xs text-slate-500">
          Official or database sources for compound identity and UK laboratory regulation — not
          endorsements of catalogue items.
        </p>
        <ul className="mt-2 space-y-1.5 text-xs">
          {outbound.map((ref) => (
            <li key={ref.href}>
              <a
                href={ref.href}
                rel="noopener noreferrer"
                className="font-medium text-[#4353FF] hover:underline"
              >
                {ref.label}
              </a>
              <span className="text-slate-600"> — {ref.note}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
