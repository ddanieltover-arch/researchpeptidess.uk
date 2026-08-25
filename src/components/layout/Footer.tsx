import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';
import { AppLink } from '../ui/AppLink';
import { NewsletterSignup } from '../content/NewsletterSignup';
import { ROUTES } from '../../lib/routing';
import { useStore } from '../../context/StoreContext';

export const Footer: React.FC = () => {
  const { storeSettings } = useStore();
  const footerLinkClass = 'text-left text-xs text-slate-400 hover:text-white transition-colors';

  return (
    <footer className="border-t border-slate-800 bg-[#0B132B] pt-12 pb-8 text-white">
      <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-8 lg:px-10">
        <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-5 text-slate-300 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-sky-500/40 bg-slate-950 text-sky-400 shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="space-y-1 text-xs">
              <h4 className="font-display text-xs font-semibold tracking-[0.14em] text-sky-400 uppercase">
                Strictly for laboratory research and in-vitro analytical use
              </h4>
              <p className="text-xs leading-relaxed text-slate-400">
                Compounds supplied by <strong className="text-white">Research Peptides UK</strong> are offered for
                qualified laboratory research and analytical work. They are not for human or veterinary administration.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <AppLink href={ROUTES.home} className="inline-block">
              <BrandLogo variant="dark" size="sm" />
            </AppLink>
            <p className="text-xs leading-relaxed text-slate-400">
              UK laboratory catalogue for research peptides, reagents, and documented batches where records exist.
            </p>
            <a
              href={`mailto:${storeSettings.supportEmail}`}
              className="text-xs text-slate-500 hover:text-white transition-colors"
            >
              {storeSettings.supportEmail}
            </a>
          </div>

          <div className="flex flex-col gap-2">
            <span className="mb-1 font-display text-xs font-semibold tracking-[0.14em] text-sky-400 uppercase">Catalogue</span>
            <AppLink href={ROUTES.peptides} className={footerLinkClass}>
              Peptides
            </AppLink>
            <AppLink href={ROUTES.researchChemicals} className={footerLinkClass}>
              Research Chemicals
            </AppLink>
            <AppLink href={ROUTES.shop} className={footerLinkClass}>
              Shop
            </AppLink>
            <AppLink href={ROUTES.account} className={footerLinkClass}>
              Account
            </AppLink>
            <AppLink href={ROUTES.cart} className={footerLinkClass}>
              Cart
            </AppLink>
            <AppLink href={ROUTES.account} className={footerLinkClass}>
              Order history
            </AppLink>
          </div>

          <div className="flex flex-col gap-2">
            <span className="mb-1 font-display text-xs font-semibold tracking-[0.14em] text-sky-400 uppercase">Company &amp; policies</span>
            <AppLink href="/about" className={footerLinkClass}>
              About
            </AppLink>
            <AppLink href="/quality" className={footerLinkClass}>
              Quality
            </AppLink>
            <AppLink href="/research" className={footerLinkClass}>
              Research
            </AppLink>
            <AppLink href="/faq" className={footerLinkClass}>
              FAQ
            </AppLink>
            <AppLink href="/contact" className={footerLinkClass}>
              Contact
            </AppLink>
            <AppLink href="/shipping" className={footerLinkClass}>
              Shipping
            </AppLink>
            <AppLink href="/returns" className={footerLinkClass}>
              Returns
            </AppLink>
            <AppLink href="/terms" className={footerLinkClass}>
              Terms
            </AppLink>
            <AppLink href="/privacy" className={footerLinkClass}>
              Privacy
            </AppLink>
            <AppLink href="/cookies" className={footerLinkClass}>
              Cookies
            </AppLink>
            <AppLink href="/research-use" className={footerLinkClass}>
              Research-use statement
            </AppLink>
          </div>

          <NewsletterSignup variant="dark" />
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-800/80 pt-6 text-xs md:flex-row">
          <p className="text-slate-500">© {new Date().getFullYear()} Research Peptides UK. All rights reserved.</p>
          <div className="flex items-center gap-2 font-display">
            <div className="rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-[10px] font-bold text-slate-300">
              FASTER PAYMENTS
            </div>
            <div className="rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-[10px] font-bold text-sky-400">
              BTC (-5%)
            </div>
            <div className="rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-[10px] font-bold text-sky-400">
              USDT (-5%)
            </div>
            <div className="rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-[10px] font-bold text-slate-300">
              GBP (£)
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
