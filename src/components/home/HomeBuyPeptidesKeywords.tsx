import React from 'react';
import { AppLink } from '../ui/AppLink';
import { categoryPath, productPath, ROUTES } from '../../lib/routing';

/** Homepage keyword links mapped onto existing catalogue URLs only. */
const BUY_PEPTIDES_LINKS = [
  { label: 'Peptide Capsules', href: productPath('mk-677-ibutamoren-10mg-100-tablets') },
  { label: 'Purchase Peptides', href: ROUTES.peptides },
  { label: 'Peptide Blends', href: productPath('glow-blend-ghk-cu-bpc157-tb500') },
  { label: 'IGF-1 Proteins', href: productPath('igf-1-lr3-1mg') },
  { label: 'Melanotan Peptides', href: productPath('mt-2-melanotan-2-acetate-10mg') },
  { label: 'Peptides Tablets', href: productPath('tesofensine-500mcg-100-tablets') },
  { label: 'Peptides Vials', href: productPath('bpc-157') },
] as const;

export const HomeBuyPeptidesKeywords: React.FC = () => {
  return (
    <section className="border-y border-slate-800 bg-[#0B132B] py-12 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-8 lg:grid-cols-12 lg:px-10">
        <div className="lg:col-span-4">
          <AppLink href={ROUTES.peptides} className="inline-block">
            <h2 className="font-display text-xl font-bold tracking-tight text-white hover:text-sky-300">
              Buy Peptides
            </h2>
          </AppLink>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
            Research-use listings from the UK catalogue. Each link opens a related collection or product page.
          </p>
          <AppLink
            href={categoryPath('buy-peptides-online')}
            className="mt-4 inline-flex font-display text-xs font-semibold tracking-[0.14em] text-sky-400 uppercase hover:text-white"
          >
            Featured peptides →
          </AppLink>
        </div>

        <nav aria-label="Buy peptides keywords" className="lg:col-span-8">
          <ul className="grid grid-cols-1 gap-x-10 gap-y-2 sm:grid-cols-2">
            {BUY_PEPTIDES_LINKS.map((item) => (
              <li key={item.label}>
                <AppLink
                  href={item.href}
                  className="text-sm text-white transition-colors hover:text-sky-300"
                >
                  {item.label}
                </AppLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
};
