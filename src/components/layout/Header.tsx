import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  ShoppingBag,
  Search,
  User,
  FlaskConical,
  ShieldCheck,
  Menu,
  X,
  Heart,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { BrandLogo } from '../ui/BrandLogo';

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
    setSelectedCategorySlug,
    currentUser,
  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/shop');
      setSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between h-18 gap-4">
          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Official Brand Logo Badge */}
          <div
            onClick={() => navigate('/')}
            className="cursor-pointer select-none shrink-0 transition-opacity hover:opacity-90"
          >
            <BrandLogo variant="light" size="md" />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8 text-xs font-semibold uppercase tracking-wider text-slate-600 font-mono">
            <button
              onClick={() => {
                setSelectedCategorySlug(null);
                navigate('/shop');
              }}
              className={`transition-colors pb-0.5 ${
                currentPath === '/shop' || currentPath === '/'
                  ? 'text-[#4353FF] border-b-2 border-[#4353FF] font-bold'
                  : 'hover:text-[#4353FF]'
              }`}
            >
              Catalogue
            </button>
            <button
              onClick={() => navigate('/quality')}
              className={`transition-colors pb-0.5 ${
                currentPath === '/quality'
                  ? 'text-[#4353FF] border-b-2 border-[#4353FF] font-bold'
                  : 'hover:text-[#4353FF]'
              }`}
            >
              Quality &amp; HPLC
            </button>
            <div className="relative group">
              <button
                onClick={() => {
                  setSelectedCategorySlug('research-peptides');
                  navigate('/shop');
                }}
                className="flex items-center gap-1 hover:text-[#4353FF] transition-colors pb-0.5"
              >
                Categories
                <ChevronDown className="h-3 w-3 text-slate-400 group-hover:rotate-180 transition-transform" />
              </button>
              <div className="absolute top-full left-0 hidden group-hover:block w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategorySlug(cat.slug);
                      navigate('/shop');
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#4353FF] transition-colors flex items-center justify-between"
                  >
                    <span>{cat.name}</span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                      {cat.productCount}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => navigate('/research-use')}
              className={`transition-colors pb-0.5 ${
                currentPath === '/research-use'
                  ? 'text-[#4353FF] border-b-2 border-[#4353FF] font-bold'
                  : 'hover:text-[#4353FF]'
              }`}
            >
              Compliance &amp; Safety
            </button>
            {currentUser.role === 'ADMIN' && (
              <button
                onClick={() => navigate('/admin')}
                className={`px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-wider rounded-lg transition-colors border ${
                  currentPath === '/admin'
                    ? 'bg-[#4353FF] text-white border-[#4353FF]'
                    : 'bg-blue-50 text-[#4353FF] border-blue-200 hover:bg-[#4353FF] hover:text-white'
                }`}
              >
                Admin Hub
              </button>
            )}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Search Input with Pill Design */}
            <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center relative">
              <input
                type="text"
                placeholder="Search compounds..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-100 border border-slate-200 text-xs py-2 pl-9 pr-4 w-48 xl:w-56 rounded-full focus:outline-none focus:ring-2 focus:ring-[#4353FF]/20 focus:border-[#4353FF] focus:bg-white transition-all text-slate-900 placeholder:text-slate-400 font-mono"
              />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </form>

            {/* Mobile Search Toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
              title="Search"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Saved / Wishlist */}
            <button
              onClick={() => navigate('/account')}
              className="p-2 rounded-lg text-slate-600 hover:text-[#4353FF] hover:bg-blue-50 relative transition-colors"
              title="Saved Requisitions"
            >
              <Heart className="h-4 w-4" />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#4353FF] ring-2 ring-white" />
              )}
            </button>

            {/* Account Link */}
            <button
              onClick={() => navigate('/account')}
              className={`flex items-center gap-1.5 text-xs font-bold uppercase font-mono tracking-tight p-2 rounded-lg transition-colors ${
                currentPath === '/account'
                  ? 'text-[#4353FF] bg-blue-50'
                  : 'text-slate-700 hover:text-[#4353FF] hover:bg-blue-50'
              }`}
              title="Customer Account & Orders"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </button>

            {/* Cart Trigger with Circular Counter */}
            <button
              onClick={() => setCartDrawerOpen(true)}
              className="flex items-center gap-2 cursor-pointer group bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 px-3 py-1.5 rounded-full transition-all"
              title="Requisition Basket"
            >
              <div className="w-5 h-5 bg-[#4353FF] rounded-full flex items-center justify-center text-[10px] font-mono font-bold text-white shadow-xs">
                {totalCartCount}
              </div>
              <span className="hidden md:inline text-xs font-bold uppercase tracking-wider font-mono text-slate-800 group-hover:text-[#4353FF] transition-colors">
                Basket
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Dropdown */}
        {searchOpen && (
          <div className="lg:hidden py-3 border-t border-slate-200">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search compound, CAS # or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 text-xs bg-slate-100 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#4353FF]/20 focus:border-[#4353FF] focus:bg-white"
                autoFocus
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            </form>
          </div>
        )}
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <button
            onClick={() => {
              navigate('/');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 rounded-lg"
          >
            Store Overview
          </button>
          <button
            onClick={() => {
              setSelectedCategorySlug(null);
              navigate('/shop');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 rounded-lg"
          >
            All Research Products
          </button>
          <div className="pl-3 space-y-1 border-l-2 border-[#4353FF] my-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategorySlug(cat.slug);
                  navigate('/shop');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-2 py-1 text-xs text-slate-600 hover:text-[#4353FF] flex items-center justify-between"
              >
                <span>{cat.name}</span>
                <span className="font-mono text-[10px] text-slate-400">({cat.productCount})</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              navigate('/cart');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 rounded-lg flex items-center justify-between"
          >
            <span>Requisition Cart</span>
            <span className="font-mono text-xs font-bold text-[#4353FF]">({totalCartCount} items)</span>
          </button>
          <button
            onClick={() => {
              navigate('/account');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 rounded-lg"
          >
            Customer Account &amp; Order History
          </button>
          {currentUser.role === 'ADMIN' && (
            <button
              onClick={() => {
                navigate('/admin');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm font-bold text-white bg-[#4353FF] rounded-lg shadow-sm"
            >
              Admin Dashboard &amp; Orders
            </button>
          )}
        </div>
      )}
    </header>
  );
};
