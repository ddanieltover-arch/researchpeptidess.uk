/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { AnnouncementBar } from './components/layout/AnnouncementBar';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './components/layout/CartDrawer';
import { ResearchDisclaimerModal } from './components/layout/ResearchDisclaimerModal';
import { CookieConsentBanner } from './components/layout/CookieConsentBanner';
import { MetaTags } from './components/seo/MetaTags';
import { ToastContainer } from './components/ui/Toast';
import { CMSPageView } from './components/content/CMSPageView';
import { MaintenanceView } from './components/layout/MaintenanceView';
import { PrivateBetaBanner } from './components/layout/PrivateBetaBanner';

import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { AccountPage } from './pages/AccountPage';
import { AdminPage } from './pages/AdminPage';
import { NotFoundPage } from './pages/NotFoundPage';

import { getSeoMetadataForPath } from './lib/seo';
import { trackPageView } from './lib/analytics';

const AppContent: React.FC = () => {
  const {
    currentPath,
    currentUser,
    setUserRole,
    products,
    categories,
    selectedCategorySlug,
    cmsPages,
    searchQuery,
    storeSettings,
  } = useStore();

  // Maintenance Mode Guard (Permits Admin access to settings/verification)
  const isMaintenanceActive =
    (storeSettings.storeStatus === 'MAINTENANCE' || storeSettings.maintenanceMode) &&
    currentUser.role !== 'ADMIN' &&
    currentPath !== '/admin';

  if (isMaintenanceActive) {
    return (
      <>
        <MaintenanceView />
        <ToastContainer />
      </>
    );
  }

  // 1. Resolve Active Entity for Dynamic SEO
  const currentProduct = useMemo(() => {
    if (currentPath.startsWith('/product/')) {
      const slug = currentPath.replace('/product/', '');
      return products.find((p) => p.slug === slug);
    }
    return undefined;
  }, [currentPath, products]);

  const currentCategory = useMemo(() => {
    if (currentPath === '/shop' && selectedCategorySlug) {
      return categories.find((c) => c.slug === selectedCategorySlug);
    }
    return undefined;
  }, [currentPath, selectedCategorySlug, categories]);

  const matchedCmsPage = useMemo(() => {
    const cleanPath = currentPath.startsWith('/') ? currentPath.substring(1) : currentPath;
    return cmsPages.find((p) => p.slug === cleanPath);
  }, [currentPath, cmsPages]);

  // 2. Generate Authoritative SEO Metadata & JSON-LD
  const currentSeo = useMemo(() => {
    return getSeoMetadataForPath(currentPath, {
      product: currentProduct,
      category: currentCategory,
      cmsPage: matchedCmsPage,
      searchQuery: searchQuery || undefined,
    });
  }, [currentPath, currentProduct, currentCategory, matchedCmsPage, searchQuery]);

  // 3. Analytics Tracking & Scroll Reset
  useEffect(() => {
    trackPageView(currentPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPath]);

  // 4. Page Router
  const renderCurrentPage = () => {
    if (currentPath === '/' || currentPath === '') {
      return <HomePage />;
    }
    if (currentPath === '/shop') {
      return <ShopPage />;
    }
    if (currentPath.startsWith('/product/')) {
      return <ProductDetailPage />;
    }
    if (currentPath === '/cart') {
      return <CartPage />;
    }
    if (currentPath === '/checkout') {
      return <CheckoutPage />;
    }
    if (currentPath === '/account') {
      return <AccountPage />;
    }
    if (currentPath === '/admin') {
      return <AdminPage />;
    }
    if (matchedCmsPage) {
      return <CMSPageView page={matchedCmsPage} />;
    }
    // Resource Not Located Fallback
    return <NotFoundPage />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-slate-900 selection:bg-amber-200 selection:text-amber-950 font-sans">
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

      {/* Private Beta Real-World Validation Notice */}
      <PrivateBetaBanner />

      {/* Main Header */}
      <Header />

      {/* Main Page Body */}
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        {renderCurrentPage()}
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Global Modals & Drawers */}
      <CartDrawer />
      <ResearchDisclaimerModal />
      <CookieConsentBanner />

      {/* Role Switcher Floating Pill */}
      <div className="fixed bottom-4 right-4 z-40 bg-slate-950/90 text-white rounded-full p-1.5 px-3 border border-amber-500/40 shadow-xl flex items-center gap-2 font-mono text-[11px] backdrop-blur-xs">
        <span className="text-stone-400 hidden sm:inline">Active Mode:</span>
        <span className="font-bold text-amber-400 uppercase">{currentUser.role}</span>
        <button
          onClick={() => setUserRole(currentUser.role.toUpperCase() === 'ADMIN' ? 'CUSTOMER' : 'ADMIN')}
          className="bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded-full transition-colors font-sans text-[10px] font-semibold"
        >
          Switch to {currentUser.role.toUpperCase() === 'ADMIN' ? 'Customer' : 'Admin'}
        </button>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
      <ToastContainer />
    </StoreProvider>
  );
}

