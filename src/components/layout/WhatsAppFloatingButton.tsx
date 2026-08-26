import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { parseAppPath } from '../../lib/routing';
import { STORE_WHATSAPP_DISPLAY, STORE_WHATSAPP_URL } from '../../lib/store-contact';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';

const fabClass =
  'flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2';

const SHOW_AFTER_PX = 400;

function scrollToTop() {
  const reducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
}

export const WhatsAppFloatingButton: React.FC = () => {
  const { currentPath, cartDrawerOpen } = useStore();
  const kind = parseAppPath(currentPath).kind;
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const update = () => {
      setShowBackToTop(window.scrollY > SHOW_AFTER_PX);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [currentPath]);

  if (kind === 'admin' || kind === 'admin-login' || cartDrawerOpen) {
    return null;
  }

  return (
    <div className="fixed right-4 z-40 flex items-center gap-2 bottom-[calc(var(--mobile-bottom-nav-height)+1rem)] lg:bottom-6">
      {showBackToTop ? (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Back to top"
          className={`${fabClass} bg-[#0B132B] text-white shadow-slate-900/20 hover:bg-[#4353FF] focus-visible:ring-[#4353FF]/60`}
        >
          <ArrowUp className="h-5 w-5" strokeWidth={2.4} />
        </button>
      ) : null}
      <a
        href={STORE_WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`WhatsApp ${STORE_WHATSAPP_DISPLAY} (messages only)`}
        className={`${fabClass} bg-[#25D366] text-white shadow-emerald-900/20 hover:bg-[#1EBE5D] focus-visible:ring-[#25D366]/60`}
      >
        <WhatsAppIcon className="h-6 w-6 text-white" />
      </a>
    </div>
  );
};
