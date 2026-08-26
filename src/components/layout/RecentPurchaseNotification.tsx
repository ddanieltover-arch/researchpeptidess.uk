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
      className="pointer-events-none fixed left-3 z-40 w-[min(calc(100vw-1.5rem),16.5rem)] bottom-[calc(var(--mobile-bottom-nav-height)+0.75rem)] lg:left-4 lg:bottom-4 lg:w-[min(calc(100vw-2rem),22rem)]"
    >
      <div className="pointer-events-auto relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.12)] animate-purchase-notice-in lg:rounded-xl lg:shadow-[0_10px_30px_rgba(15,23,42,0.12)]">
        <AppLink
          href={notice.href}
          className="flex items-center gap-2 py-2 pl-2 pr-7 no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4353FF]/50 lg:gap-3 lg:py-3 lg:pl-3 lg:pr-10"
          onClick={() => setCartDrawerOpen(false)}
        >
          <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-100 bg-slate-50 lg:h-14 lg:w-14">
            {notice.imageUrl ? (
              <img src={notice.imageUrl} alt="" className="h-full w-full object-contain p-0.5 lg:p-1" />
            ) : (
              <span
                aria-hidden="true"
                className="flex h-full w-full items-center justify-center font-display text-xs font-semibold text-[#4353FF] lg:text-sm"
              >
                {notice.productName.slice(0, 1)}
              </span>
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-medium leading-snug text-slate-900 lg:text-[13px]">
              {notice.buyerLabel} just purchased
            </span>
            <span className="mt-0.5 block text-[11px] font-semibold leading-snug text-[#4353FF] underline-offset-2 hover:underline lg:text-[13px]">
              {productLabel}
            </span>
            <span className="mt-0.5 block text-[10px] text-slate-400 lg:mt-1 lg:text-[11px]">
              {formatRelativeMinutesAgo(notice.minutesAgo)}
            </span>
          </span>
        </AppLink>
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-1 right-1 z-10 rounded-md p-0.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4353FF]/50 lg:top-2 lg:right-2 lg:p-1"
          aria-label="Dismiss purchase notification"
        >
          <X className="h-3 w-3 lg:h-3.5 lg:w-3.5" strokeWidth={2.5} />
        </button>
      </div>
    </aside>
  );
};
