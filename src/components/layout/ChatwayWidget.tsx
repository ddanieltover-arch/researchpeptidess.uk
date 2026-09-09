import React, { useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { parseAppPath } from '../../lib/routing';
import { CHATWAY_WIDGET_ID, CHATWAY_WIDGET_SRC } from '../../lib/chatway';

const SCRIPT_ID = 'chatway';
const HIDDEN_CLASS = 'chatway-hidden';

/**
 * Loads Chatway live chat (bottom-right). Hidden on admin routes and when the cart drawer is open.
 * Position (right) is controlled in the Chatway dashboard; keep WhatsApp on the left.
 */
export const ChatwayWidget: React.FC = () => {
  const { currentPath, cartDrawerOpen } = useStore();
  const kind = parseAppPath(currentPath).kind;
  const hideWidget = kind === 'admin' || kind === 'admin-login' || cartDrawerOpen;

  useEffect(() => {
    if (typeof document === 'undefined') return;

    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.async = true;
      script.src = `${CHATWAY_WIDGET_SRC}?id=${CHATWAY_WIDGET_ID}`;
      document.body.appendChild(script);
    }

    return () => {
      // Keep the script for SPA navigations; only remove on full unmount of the storefront shell.
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle(HIDDEN_CLASS, hideWidget);
    return () => {
      document.documentElement.classList.remove(HIDDEN_CLASS);
    };
  }, [hideWidget]);

  return null;
};
