import React, { useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { parseAppPath } from '../../lib/routing';
import {
  TAWK_EMBED_SRC,
  TAWK_MOBILE_X_OFFSET,
  TAWK_MOBILE_Y_OFFSET,
} from '../../lib/tawk';

const SCRIPT_ID = 'tawk-to-script';
const HIDDEN_CLASS = 'tawk-hidden';

function setTawkVisibility(hidden: boolean) {
  const api = window.Tawk_API;
  if (!api) return;
  if (hidden) {
    api.hideWidget?.();
  } else {
    api.showWidget?.();
  }
}

/**
 * Loads Tawk.to live chat (bottom-right). Hidden on admin routes and when the cart drawer is open.
 * Mobile yOffset lifts the bubble above the bottom nav to align with WhatsApp on the left.
 */
export const TawkWidget: React.FC = () => {
  const { currentPath, cartDrawerOpen } = useStore();
  const kind = parseAppPath(currentPath).kind;
  const hideWidget = kind === 'admin' || kind === 'admin-login' || cartDrawerOpen;

  useEffect(() => {
    if (typeof document === 'undefined') return;

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = window.Tawk_LoadStart || new Date();

    // Must be set before the embed script loads (Tawk ignores later changes).
    window.Tawk_API.customStyle = {
      visibility: {
        desktop: {
          position: 'br',
          xOffset: 20,
          yOffset: 24,
        },
        mobile: {
          position: 'br',
          xOffset: TAWK_MOBILE_X_OFFSET,
          yOffset: TAWK_MOBILE_Y_OFFSET,
        },
      },
    };

    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.async = true;
      script.src = TAWK_EMBED_SRC;
      script.charset = 'UTF-8';
      script.setAttribute('crossorigin', '*');
      const first = document.getElementsByTagName('script')[0];
      first?.parentNode?.insertBefore(script, first);
    }

    return () => {
      // Keep the script for SPA navigations; only remove on full unmount of the storefront shell.
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    document.documentElement.classList.toggle(HIDDEN_CLASS, hideWidget);

    const api = window.Tawk_API || (window.Tawk_API = {});
    const previousOnLoad = api.onLoad;
    api.onLoad = () => {
      previousOnLoad?.();
      setTawkVisibility(hideWidget);
    };
    setTawkVisibility(hideWidget);

    return () => {
      document.documentElement.classList.remove(HIDDEN_CLASS);
    };
  }, [hideWidget]);

  return null;
};
