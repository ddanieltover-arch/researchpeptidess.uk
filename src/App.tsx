/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { AnnouncementBar } from './components/layout/AnnouncementBar';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { CartDrawer } from './components/layout/CartDrawer';
import { CookieConsentBanner } from './components/layout/CookieConsentBanner';
import { RecentPurchaseNotification } from './components/layout/RecentPurchaseNotification';
import { WhatsAppFloatingButton } from './components/layout/WhatsAppFloatingButton';
import { MetaTags } from './components/seo/MetaTags';
import { ToastContainer } from './components/ui/Toast';
import { CMSPageView } from './components/content/CMSPageView';
import { MaintenanceView } from './components/layout/MaintenanceView';

import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { AccountPage } from './pages/AccountPage';
import { AccountLoginPage } from './pages/AccountLoginPage';
import { AdminPage } from './pages/AdminPage';
import { AdminLoginPage, AdminSessionLoading } from './pages/AdminLoginPage';
import { NotFoundPage } from './pages/NotFoundPage';

import { getSeoMetadataForPath } from './lib/seo';
import { trackPageView } from './lib/analytics';
import { parseAppPath } from './lib/routing';
import { RouteErrorBoundary } from './components/system/ErrorBoundaries';

const AppContent: React.FC = () => {
  const {
    currentPath,
    authReady,
    isAdminAuthenticated,
    isAccountAuthenticated,
    navigate,
    products,
    categories,
    cmsPages,
    searchQuery,
    storeSettings,
  } = useStore();

  const activeRoute = useMemo(() => parseAppPath(currentPath), [currentPath]);

  // 1. Resolve Active Entity for Dynamic SEO
  const currentProduct = useMemo(() => {
    if (activeRoute.kind === 'product' && activeRoute.slug) {
      return products.find((p) => p.slug === activeRoute.slug);
    }
    return undefined;
  }, [activeRoute, products]);

  const currentCategory = useMemo(() => {
    if (activeRoute.kind === 'category' && activeRoute.slug) {
      return categories.find((c) => c.slug === activeRoute.slug);
    }
    if (currentProduct) {
      return categories.find((c) => c.id === currentProduct.categoryId);
    }
    return undefined;
  }, [activeRoute, categories, currentProduct]);

  const matchedCmsPage = useMemo(() => {
    if (activeRoute.kind !== 'cms' || !activeRoute.slug) return undefined;
    return cmsPages.find((p) => p.slug === activeRoute.slug);
  }, [activeRoute, cmsPages]);

  // 2. Generate Authoritative SEO Metadata & JSON-LD
  const currentSeo = useMemo(() => {
    return getSeoMetadataForPath(currentPath, {
      product: currentProduct,
      category: currentCategory,
      cmsPage: matchedCmsPage,
      searchQuery: searchQuery || undefined,
    });
  }, [currentPath, currentProduct, currentCategory, matchedCmsPage, searchQuery]);

  // 3. Analytics Tracking
  useEffect(() => {
    trackPageView(currentPath);
  }, [currentPath]);

  useEffect(() => {
    if (!authReady || !isAdminAuthenticated) return;
    if (activeRoute.kind === 'admin-login') {
      navigate('/admin', { replace: true });
    }
  }, [authReady, isAdminAuthenticated, activeRoute.kind, navigate]);

  useEffect(() => {
    if (!authReady || !isAccountAuthenticated) return;
    if (activeRoute.kind === 'account-login') {
      navigate('/account', { replace: true });
    }
  }, [authReady, isAccountAuthenticated, activeRoute.kind, navigate]);

  // Maintenance Mode Guard (Permits Admin access to settings/verification)
  const isMaintenanceActive =
    (storeSettings?.storeStatus === 'MAINTENANCE' || storeSettings?.maintenanceMode) &&
    !isAdminAuthenticated &&
    activeRoute.kind !== 'admin' &&
    activeRoute.kind !== 'admin-login';

  if (isMaintenanceActive) {
    return (
      <>
        <MaintenanceView />
        <ToastContainer />
      </>
    );
  }

  if (activeRoute.kind === 'admin' || activeRoute.kind === 'admin-login') {
    if (!authReady) {
      return <AdminSessionLoading />;
    }
    if (!isAdminAuthenticated) {
      return <AdminLoginPage />;
    }
    return (
      <div className="min-h-screen bg-stone-50 text-slate-900">
        <MetaTags seo={currentSeo} />
        <RouteErrorBoundary resetKey="admin-console" title="The admin console could not be displayed">
          <AdminPage />
        </RouteErrorBoundary>
      </div>
    );
  }

  // 4. Page Router — unique slug per page
  const renderCurrentPage = () => {
    switch (activeRoute.kind) {
      case 'home':
        return <HomePage />;
      case 'shop':
      case 'category':
      case 'search':
        if (activeRoute.kind === 'category' && activeRoute.slug && !currentCategory) {
          return <NotFoundPage />;
        }
        return <ShopPage />;
      case 'product':
        if (!currentProduct) {
          return <NotFoundPage />;
        }
        return <ProductDetailPage key={currentProduct.id} />;
      case 'cart':
        return <CartPage />;
      case 'checkout':
        return <CheckoutPage />;
      case 'account':
      case 'account-login':
        if (!authReady) {
          return (
            <div className="flex justify-center px-4 py-16">
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500">
                Checking account session…
              </p>
            </div>
          );
        }
        if (!isAccountAuthenticated) {
          return <AccountLoginPage />;
        }
        return <AccountPage />;
      case 'cms':
        if (matchedCmsPage) {
          return <CMSPageView page={matchedCmsPage} />;
        }
        return <NotFoundPage />;
      default:
        return <NotFoundPage />;
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col bg-stone-50 text-slate-900 selection:bg-amber-200 selection:text-amber-950 font-sans ${
        activeRoute.kind === 'admin' || activeRoute.kind === 'admin-login'
          ? ''
          : 'pb-[var(--mobile-bottom-nav-height)] lg:pb-0'
      }`}
    >
      {/* Dynamic SEO & Schema.org JSON-LD Injection */}
      <MetaTags seo={currentSeo} />

      {/* Accessible Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-amber-500 focus:text-slate-950 focus:font-bold focus:rounded-md focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Announcement Bar */}
      <AnnouncementBar />

      {/* Main Header */}
      <Header />

      {/* Main Page Body */}
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        <RouteErrorBoundary resetKey={currentPath}>{renderCurrentPage()}</RouteErrorBoundary>
      </main>

      {/* Global Footer */}
      <Footer />

      <MobileBottomNav />

      {/* Global Modals & Drawers */}
      <CartDrawer />
      <CookieConsentBanner />
      <RecentPurchaseNotification />
      <WhatsAppFloatingButton />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <RouteErrorBoundary title="The storefront could not be displayed">
        <AppContent />
      </RouteErrorBoundary>
      <ToastContainer />
    </StoreProvider>
  );
}

