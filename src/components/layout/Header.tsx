import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Heart, ChevronDown, Search, User, Menu, X } from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';
import { AppLink } from '../ui/AppLink';
import { CatalogueSearchBox } from '../search/CatalogueSearchBox';
import { categoryPath, isNavActive, parseAppPath, ROUTES } from '../../lib/routing';
import {
  categoryNavLabel,
  isListedShopCategory,
  isPrimaryCatalogueCategory,
} from '../../lib/catalogue-collections';

export const Header: React.FC = () => {
  const {
    currentPath,
    navigate,
    cart,
    setCartDrawerOpen,
    wishlist,
    searchQuery,
    setSearchQuery,
    categories,
    publishedProducts,
    isAdminAuthenticated,
    isAccountAuthenticated,
  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const totalCartCount = (cart || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
  const route = parseAppPath(currentPath);
  const moreCategories = (categories || []).filter(
    (category) => isListedShopCategory(category) && !isPrimaryCatalogueCategory(category)
  );

  const navLinkClass = (href: string) =>
    `transition-colors pb-0.5 ${
      isNavActive(currentPath, href) ? 'border-b-2 border-[#4353FF] font-bold text-[#4353FF]' : 'hover:text-[#4353FF]'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-xs backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
        <div className="flex h-18 items-center justify-between gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-800 transition-colors hover:bg-slate-100 md:hidden"
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          <AppLink href={ROUTES.home} className="shrink-0 transition-opacity hover:opacity-90">
            <BrandLogo variant="light" size="md" />
          </AppLink>

          <nav
            className="hidden items-center space-x-5 font-display text-[13px] font-semibold uppercase tracking-[0.14em] text-slate-600 lg:flex xl:space-x-7"
            aria-label="Primary"
          >
            <AppLink href={ROUTES.home} className={navLinkClass(ROUTES.home)}>
              Home
            </AppLink>
            <div className="group relative">
              <AppLink
                href={ROUTES.shop}
                className={`flex items-center gap-1 ${navLinkClass(ROUTES.shop)} ${
                  isNavActive(currentPath, ROUTES.peptides) || isNavActive(currentPath, ROUTES.researchChemicals)
                    ? 'border-b-2 border-[#4353FF] font-bold text-[#4353FF]'
                    : ''
                }`}
              >
                Shop
                <ChevronDown className="h-3 w-3 text-slate-400 transition-transform group-hover:rotate-180 group-focus-within:rotate-180" />
              </AppLink>
              <div className="absolute top-full left-0 z-50 hidden w-72 rounded-xl border border-slate-200 bg-white py-2 shadow-xl group-hover:block group-focus-within:block">
                <AppLink href={ROUTES.shop} className="block px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#4353FF]">
                  All catalogue
                </AppLink>
                <AppLink href={ROUTES.peptides} className="block px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#4353FF]">
                  Peptides
                </AppLink>
                <AppLink href={ROUTES.researchChemicals} className="block px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#4353FF]">
                  Research Chemicals
                </AppLink>
                {moreCategories.map((cat) => (
                  <AppLink
                    key={cat.id}
                    href={categoryPath(cat.slug)}
                    className="flex w-full items-center justify-between px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#4353FF]"
                  >
                    <span>{categoryNavLabel(cat)}</span>
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                      {cat.productCount ?? 0}
                    </span>
                  </AppLink>
                ))}
                <AppLink href={ROUTES.search} className="block px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#4353FF]">
                  Search
                </AppLink>
              </div>
            </div>
            <div className="group relative">
              <AppLink
                href="/about"
                className={`flex items-center gap-1 ${navLinkClass('/about')} ${
                  ['/quality', '/faq', '/contact'].some((path) => isNavActive(currentPath, path))
                    ? 'border-b-2 border-[#4353FF] font-bold text-[#4353FF]'
                    : ''
                }`}
              >
                About
                <ChevronDown className="h-3 w-3 text-slate-400 transition-transform group-hover:rotate-180" />
              </AppLink>
              <div className="absolute top-full left-0 z-50 hidden w-48 rounded-xl border border-slate-200 bg-white py-2 shadow-xl group-hover:block group-focus-within:block">
                <AppLink href="/about" className="block px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50">
                  About
                </AppLink>
                <AppLink href="/quality" className="block px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50">
                  Quality
                </AppLink>
                <AppLink href="/faq" className="block px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50">
                  FAQ
                </AppLink>
                <AppLink href="/contact" className="block px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50">
                  Contact
                </AppLink>
              </div>
            </div>
            {isAdminAuthenticated && (
              <AppLink
                href={ROUTES.admin}
                className={`rounded-lg border px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-wider ${
                  route.kind === 'admin'
                    ? 'border-[#4353FF] bg-[#4353FF] text-white'
                    : 'border-blue-200 bg-blue-50 text-[#4353FF] hover:bg-[#4353FF] hover:text-white'
                }`}
              >
                Admin Hub
              </AppLink>
            )}
          </nav>

          <div className="flex items-center gap-3 sm:gap-5">
            <CatalogueSearchBox
              value={searchQuery}
              onChange={setSearchQuery}
              onNavigate={navigate}
              products={publishedProducts}
              categories={categories}
              className="hidden lg:block"
              inputClassName="w-48 rounded-full border border-slate-200 bg-slate-100 py-2 pl-4 pr-4 font-sans text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#4353FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4353FF]/20 xl:w-56"
            />

            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
              title="Search"
              aria-label="Search catalogue"
            >
              <Search className="h-4 w-4" />
            </button>

            <AppLink
              href={ROUTES.account}
              className="relative rounded-lg p-2 text-slate-600 transition-colors hover:bg-blue-50 hover:text-[#4353FF]"
              title="Saved compounds"
            >
              <Heart className="h-4 w-4" />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#4353FF] ring-2 ring-white" />
              )}
            </AppLink>

            <AppLink
              href={isAccountAuthenticated ? ROUTES.account : ROUTES.accountLogin}
              className={`flex items-center gap-1.5 rounded-lg p-2 font-mono text-xs font-bold uppercase tracking-tight transition-colors ${
                route.kind === 'account' || route.kind === 'account-login'
                  ? 'bg-blue-50 text-[#4353FF]'
                  : 'text-slate-700 hover:bg-blue-50 hover:text-[#4353FF]'
              }`}
              title={isAccountAuthenticated ? 'Account' : 'Sign in'}
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{isAccountAuthenticated ? 'Account' : 'Sign in'}</span>
            </AppLink>

            <button
              onClick={() => setCartDrawerOpen(true)}
              className="group flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 transition-all hover:border-blue-200 hover:bg-blue-50"
              title="Cart"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#4353FF] font-mono text-[10px] font-bold text-white shadow-xs">
                {totalCartCount}
              </div>
              <span className="hidden font-mono text-xs font-bold uppercase tracking-wider text-slate-800 transition-colors group-hover:text-[#4353FF] md:inline">
                Cart
              </span>
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-slate-200 py-3 lg:hidden">
            <CatalogueSearchBox
              value={searchQuery}
              onChange={setSearchQuery}
              onNavigate={(href) => {
                navigate(href);
                setSearchOpen(false);
                setMobileMenuOpen(false);
              }}
              products={publishedProducts}
              categories={categories}
              autoFocus
              inputClassName="h-10 w-full rounded-full border border-slate-300 bg-slate-100 pl-4 pr-4 font-sans text-sm focus:border-[#4353FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4353FF]/20"
            />
          </div>
        )}
      </div>

      {mobileMenuOpen && (
        <div className="space-y-1 border-t border-slate-200 bg-white px-4 py-4 shadow-lg md:hidden">
          {[
            { href: ROUTES.home, label: 'Home' },
            { href: ROUTES.shop, label: 'Shop' },
            { href: ROUTES.peptides, label: 'Peptides' },
            { href: ROUTES.researchChemicals, label: 'Research Chemicals' },
            { href: '/about', label: 'About' },
            { href: '/quality', label: 'Quality' },
            { href: '/faq', label: 'FAQ' },
            { href: '/contact', label: 'Contact' },
            {
              href: isAccountAuthenticated ? ROUTES.account : ROUTES.accountLogin,
              label: isAccountAuthenticated ? 'Account' : 'Sign in',
            },
            { href: ROUTES.cart, label: `Cart (${totalCartCount})` },
          ].map((item) => (
            <AppLink
              key={`${item.href}-${item.label}`}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full rounded-lg px-3 py-2 text-left font-display text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              {item.label}
            </AppLink>
          ))}
          <div className="my-1 space-y-1 border-l-2 border-[#4353FF] pl-3">
            {categories.filter(isListedShopCategory).map((cat) => (
              <AppLink
                key={cat.id}
                href={categoryPath(cat.slug)}
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-between px-2 py-1 text-xs text-slate-600 hover:text-[#4353FF]"
              >
                <span>{categoryNavLabel(cat)}</span>
                <span className="font-mono text-[10px] text-slate-400">({cat.productCount ?? 0})</span>
              </AppLink>
            ))}
          </div>
          {isAdminAuthenticated && (
            <AppLink
              href={ROUTES.admin}
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full rounded-lg bg-[#4353FF] px-3 py-2 text-left text-sm font-bold text-white shadow-sm"
            >
              Admin Dashboard
            </AppLink>
          )}
        </div>
      )}
    </header>
  );
};
