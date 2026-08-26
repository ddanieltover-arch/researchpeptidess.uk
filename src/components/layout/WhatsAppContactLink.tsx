import React from 'react';
import { STORE_WHATSAPP_DISPLAY, STORE_WHATSAPP_URL } from '../../lib/store-contact';
import { cn } from '../../lib/utils';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';

export function WhatsAppContactLink({
  className,
  showNumber = true,
  compact = false,
}: {
  className?: string;
  showNumber?: boolean;
  compact?: boolean;
}) {
  return (
    <a
      href={STORE_WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-2 text-[#25D366] transition-colors hover:text-[#1EBE5D]',
        className
      )}
      aria-label={`WhatsApp ${STORE_WHATSAPP_DISPLAY} (messages only)`}
    >
      <span className="text-[#25D366]">
        <WhatsAppIcon className={compact ? 'h-5 w-5' : 'h-4 w-4'} />
      </span>
      {showNumber ? (
        <span className="leading-tight">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-current/80">
            WhatsApp
          </span>
          <span className="block font-mono text-xs font-semibold">{STORE_WHATSAPP_DISPLAY}</span>
        </span>
      ) : (
        <span className="sr-only">WhatsApp {STORE_WHATSAPP_DISPLAY}</span>
      )}
    </a>
  );
}
