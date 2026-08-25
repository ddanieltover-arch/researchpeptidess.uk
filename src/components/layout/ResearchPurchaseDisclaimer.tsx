import React from 'react';
import { AppLink } from '../ui/AppLink';
import { useStore } from '../../context/StoreContext';
import { cn } from '../../lib/utils';

const linkClass = 'underline decoration-white/80 underline-offset-2 hover:text-white';

function DisclaimerSegments({ storeHost, duplicate = false }: { storeHost: string; duplicate?: boolean }) {
  const prefix = duplicate ? 'b' : 'a';
  const segments = [
    <span key={`${prefix}-title`} className="font-bold">
      Disclaimer for Research Peptides UK
    </span>,
    <span key={`${prefix}-intro`}>
      By purchasing from <strong>{storeHost}</strong>, you acknowledge and agree to the following terms
    </span>,
    <span key={`${prefix}-research`}>
      <strong>Research Use Only:</strong> All products are exclusively sold for research purposes. They are not
      intended for human use, therapeutic, diagnostic, or clinical application.
    </span>,
    <span key={`${prefix}-medical`}>
      <strong>Not Medical Products:</strong> None of the products listed on our website are medical products, nor
      should they be marketed or used as such.
    </span>,
    <span key={`${prefix}-compliance`}>
      <strong>Compliance and Responsibility:</strong> The buyer is responsible for ensuring compliance with all
      relevant laws and regulations. <strong>Research Peptides UK</strong> holds no liability for misuse of products
      or any adverse outcomes.
    </span>,
    <span key={`${prefix}-returns`}>
      <strong>No Returns:</strong> Due to the nature of the products we sell, we do not accept returned products.{' '}
      <AppLink href="/returns" className={linkClass}>
        Damaged-in-transit replacements
      </AppLink>{' '}
      are described in the returns policy.
    </span>,
    <span key={`${prefix}-close`}>
      Your purchase signifies your understanding and agreement to these terms.{' '}
      <AppLink href="/research-use" className={linkClass}>
        Read the research-use statement
      </AppLink>
      .
    </span>,
  ];

  return (
    <div className="flex shrink-0 items-center gap-8 px-8">
      {segments.map((segment) => (
        <span key={segment.key} className="flex items-center gap-8">
          <span className="whitespace-nowrap">{segment}</span>
          <span className="text-white/55" aria-hidden="true">
            •
          </span>
        </span>
      ))}
    </div>
  );
}

export const ResearchPurchaseDisclaimer: React.FC<{ className?: string }> = ({ className }) => {
  const { storeSettings } = useStore();
  const storeHost = (storeSettings?.primaryDomain || 'https://researchpeptidess.uk')
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');

  return (
    <aside
      className={cn('group overflow-hidden bg-red-600 font-display text-[12px] leading-5 text-white', className)}
      role="note"
      aria-label="Disclaimer for Research Peptides UK"
    >
      <p className="sr-only">
        Disclaimer for Research Peptides UK. By purchasing from {storeHost}, you acknowledge and agree to the
        following terms. Research Use Only: All products are exclusively sold for research purposes. They are not
        intended for human use, therapeutic, diagnostic, or clinical application. Not Medical Products: None of the
        products listed on our website are medical products, nor should they be marketed or used as such. Compliance
        and Responsibility: The buyer is responsible for ensuring compliance with all relevant laws and regulations.
        Research Peptides UK holds no liability for misuse of products or any adverse outcomes. No Returns: Due to the
        nature of the products we sell, we do not accept returned products. Damaged-in-transit replacements are
        described in the returns policy. Your purchase signifies your understanding and agreement to these terms. Read
        the research-use statement.
      </p>
      <div className="relative overflow-hidden py-2.5 motion-reduce:overflow-x-auto">
        <div
          aria-hidden="true"
          className="flex w-max animate-disclaimer-marquee group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:animate-none"
        >
          <DisclaimerSegments storeHost={storeHost} />
          <div className="motion-reduce:hidden">
            <DisclaimerSegments storeHost={storeHost} duplicate />
          </div>
        </div>
      </div>
    </aside>
  );
};
