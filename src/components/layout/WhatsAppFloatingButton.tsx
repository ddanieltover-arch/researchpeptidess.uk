import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatProductDisplayName } from '../../lib/product-display';
import { parseAppPath } from '../../lib/routing';
import { STORE_WHATSAPP_DISPLAY, STORE_WHATSAPP_URL } from '../../lib/store-contact';
import { getProductWhatsAppHref } from '../../lib/whatsapp-product';
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
  const { currentPath, cartDrawerOpen, selectedProductSlug, publishedProducts } = useStore();
  const kind = parseAppPath(currentPath).kind;
  const pageProduct =
    kind === 'product' && selectedProductSlug
      ? publishedProducts.find((product) => product.slug === selectedProductSlug)
      : undefined;
  const pageProductName = pageProduct ? formatProductDisplayName(pageProduct.name) : '';
  const whatsappHref = pageProduct
    ? getProductWhatsAppHref({
        name: pageProduct.name,
        slug: pageProduct.slug,
        sku: pageProduct.sku,
      })
    : STORE_WHATSAPP_URL;
  const whatsappLabel = pageProduct
    ? `Enquire about ${pageProductName} on WhatsApp (${STORE_WHATSAPP_DISPLAY}, messages only)`
    : `WhatsApp ${STORE_WHATSAPP_DISPLAY} (messages only)`;
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
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={whatsappLabel}
        className={`${fabClass} bg-[#25D366] text-white shadow-emerald-900/20 hover:bg-[#1EBE5D] focus-visible:ring-[#25D366]/60`}
      >
        <WhatsAppIcon className="h-6 w-6 text-white" />
      </a>
    </div>
  );
};
