import React from 'react';
import { STORE_WHATSAPP_DISPLAY } from '../../lib/store-contact';
import { getProductWhatsAppHref } from '../../lib/whatsapp-product';
import { cn } from '../../lib/utils';
import { WhatsAppIcon } from './WhatsAppIcon';

const layoutClass = {
  icon: 'h-8 w-8',
  compact: 'h-8 w-full gap-1.5 px-3 font-display text-[11px] font-semibold uppercase tracking-[0.12em]',
  full: 'h-12 w-full gap-2 px-5 font-display text-xs font-semibold uppercase tracking-[0.12em]',
} as const;

export function WhatsAppProductButton({
  productName,
  productSlug,
  sku,
  variantLabel,
  variantSku,
  layout = 'icon',
  className,
}: {
  productName: string;
  productSlug: string;
  sku?: string;
  variantLabel?: string;
  variantSku?: string;
  layout?: keyof typeof layoutClass;
  className?: string;
}) {
  const href = getProductWhatsAppHref({
    name: productName,
    slug: productSlug,
    sku,
    variantLabel,
    variantSku,
  });
  const label = `Enquire about ${productName} on WhatsApp`;
  const visibleLabel = layout === 'full' ? 'Enquire on WhatsApp' : layout === 'compact' ? 'WhatsApp' : null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={`${label} (${STORE_WHATSAPP_DISPLAY}, messages only)`}
      aria-label={`${label} (${STORE_WHATSAPP_DISPLAY}, messages only)`}
      onClick={(event) => event.stopPropagation()}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg bg-[#25D366] text-white shadow-sm shadow-emerald-900/15 transition-colors hover:bg-[#1EBE5D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/60',
        layoutClass[layout],
        className
      )}
    >
      <WhatsAppIcon className={layout === 'full' ? 'h-5 w-5' : 'h-4 w-4'} />
      {visibleLabel ? <span>{visibleLabel}</span> : <span className="sr-only">{label}</span>}
    </a>
  );
}
