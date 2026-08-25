import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { parseAppPath } from '../../lib/routing';
import {
  buildPurchaseNotificationFeed,
  formatPurchaseProductLabel,
  formatRelativeMinutesAgo,
  shouldShowPurchaseNotifications,
} from '../../lib/purchase-notifications';
import { AppLink } from '../ui/AppLink';

const INITIAL_DELAY_MS = 2500;
const SHOW_MS = 9000;
const HIDE_MS = 14000;
const MAX_SESSION_DISMISSES = 3;

export const RecentPurchaseNotification: React.FC = () => {
  const {
    publishedProducts,
    orders,
    currentPath,
    cartDrawerOpen,
    setCartDrawerOpen,
  } = useStore();
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);
  const [cycleKey, setCycleKey] = useState(0);
  const [dismissCount, setDismissCount] = useState(0);

  const routeKind = useMemo(() => parseAppPath(currentPath).kind, [currentPath]);
  const feed = useMemo(
    () => buildPurchaseNotificationFeed(publishedProducts, orders),
    [publishedProducts, orders]
  );

  const notice = feed[index] || feed[0];
  const hiddenForRoute = !shouldShowPurchaseNotifications(routeKind);
  const stopped = dismissCount >= MAX_SESSION_DISMISSES;

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setDismissCount((count) => count + 1);
    setIndex((current) => (feed.length === 0 ? 0 : (current + 1) % feed.length));
    setCycleKey((key) => key + 1);
  }, [feed.length]);

  useEffect(() => {
    if (stopped || hiddenForRoute || cartDrawerOpen || feed.length === 0) {
      setVisible(false);
      return;
    }

    let showTimer = 0;
    let hideTimer = 0;
    let showing = false;

    const clearTimers = () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };

    const queueShow = (delay: number) => {
      showTimer = window.setTimeout(() => {
        if (document.hidden) {
          queueShow(1000);
          return;
        }
        showing = true;
        setVisible(true);
        hideTimer = window.setTimeout(() => {
          showing = false;
          setVisible(false);
          setIndex((current) => (current + 1) % feed.length);
          queueShow(HIDE_MS);
        }, SHOW_MS);
      }, delay);
    };

    queueShow(cycleKey === 0 ? INITIAL_DELAY_MS : 1600);

    const onVisibility = () => {
      if (document.hidden) {
        clearTimers();
        if (showing) {
          showing = false;
          setVisible(false);
        }
        return;
      }
      queueShow(2000);
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearTimers();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [cartDrawerOpen, cycleKey, feed.length, hiddenForRoute, stopped]);

  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleDismiss();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleDismiss, visible]);

  if (hiddenForRoute || stopped || !notice || !visible) return null;

  const productLabel = formatPurchaseProductLabel(notice.productName, notice.extraProductCount);

  return (
    <aside
      aria-label="Recent purchase"
      className="pointer-events-none fixed left-4 z-40 w-[min(calc(100vw-2rem),22rem)] bottom-[calc(var(--mobile-bottom-nav-height)+1rem)] lg:bottom-4"
    >
      <div className="pointer-events-auto relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.12)] animate-purchase-notice-in">
        <AppLink
          href={notice.href}
          className="flex items-center gap-3 py-3 pl-3 pr-10 no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4353FF]/50"
          onClick={() => setCartDrawerOpen(false)}
        >
          <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-slate-100 bg-slate-50">
            {notice.imageUrl ? (
              <img src={notice.imageUrl} alt="" className="h-full w-full object-contain p-1" />
            ) : (
              <span
                aria-hidden="true"
                className="flex h-full w-full items-center justify-center font-display text-sm font-semibold text-[#4353FF]"
              >
                {notice.productName.slice(0, 1)}
              </span>
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-medium leading-snug text-slate-900">
              {notice.buyerLabel} just purchased
            </span>
            <span className="mt-0.5 block text-[13px] font-semibold leading-snug text-[#4353FF] underline-offset-2 hover:underline">
              {productLabel}
            </span>
            <span className="mt-1 block text-[11px] text-slate-400">
              {formatRelativeMinutesAgo(notice.minutesAgo)}
            </span>
          </span>
        </AppLink>
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-2 right-2 z-10 rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4353FF]/50"
          aria-label="Dismiss purchase notification"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
      </div>
    </aside>
  );
};
