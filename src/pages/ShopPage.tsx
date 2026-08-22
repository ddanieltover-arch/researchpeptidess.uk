import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ui/ProductCard';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { EmptyState } from '../components/ui/EmptyState';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { Badge } from '../components/ui/Badge';
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  FlaskConical,
  Check,
  ShieldCheck,
} from 'lucide-react';

export const ShopPage: React.FC = () => {
  const {
    products,
    categories,
    selectedCategorySlug,
    setSelectedCategorySlug,
    searchQuery,
    setSearchQuery,
    navigate,
  } = useStore();

  const [sortBy, setSortBy] = useState<string>('featured');
  const [minPurity, setMinPurity] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Category match
        if (selectedCategorySlug && selectedCategorySlug !== 'all') {
          const cat = categories.find((c) => c.slug === selectedCategorySlug);
          if (cat && product.categoryId !== cat.id) return false;
        }

        // Search Query match
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = product.name.toLowerCase().includes(q);
          const matchesSku = product.variants.some((v) => v.sku.toLowerCase().includes(q));
          const matchesCas = product.variants.some((v) => v.casNumber?.toLowerCase().includes(q));
          const matchesDesc = product.shortDescription.toLowerCase().includes(q);
          if (!matchesName && !matchesSku && !matchesCas && !matchesDesc) return false;
        }

        // Min Purity filter
        if (minPurity === '99.5') {
          const highestPurity = Math.max(...product.variants.map((v) => v.purityScore));
          if (highestPurity < 99.5) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') {
          const minPriceA = Math.min(...a.variants.map((v) => v.price));
          const minPriceB = Math.min(...b.variants.map((v) => v.price));
          return minPriceA - minPriceB;
        }
        if (sortBy === 'price-desc') {
          const maxPriceA = Math.max(...a.variants.map((v) => v.price));
          const maxPriceB = Math.max(...b.variants.map((v) => v.price));
          return maxPriceB - maxPriceA;
        }
        if (sortBy === 'purity') {
          const purityA = Math.max(...a.variants.map((v) => v.purityScore));
          const purityB = Math.max(...b.variants.map((v) => v.purityScore));
          return purityB - purityA;
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        // default featured
        return a.isFeatured ? -1 : 1;
      });
  }, [products, selectedCategorySlug, searchQuery, minPurity, sortBy, categories]);

  const activeCategoryName =
    categories.find((c) => c.slug === selectedCategorySlug)?.name || 'All Research Products';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Shop Catalogue', onClick: () => setSelectedCategorySlug(null) },
          ...(selectedCategorySlug
            ? [{ label: activeCategoryName }]
            : []),
        ]}
      />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#4353FF]">
            Institutional Laboratory Supply
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 tracking-tight mt-1">
            {activeCategoryName}
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl mt-1 leading-relaxed">
            Analytical standards, dual-compound blends, and synthetic peptide reagents tested under
            ISO/IEC 17025 certified laboratory conditions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="brand" size="md">
            {filteredProducts.length} Compounds Available
          </Badge>
        </div>
      </div>

      {/* Main Content Layout (Sidebar Filters + Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Filter Sidebar */}
        <aside className="lg:col-span-3 space-y-6">
          {/* Search Box */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 block">
              Compound Search
            </span>
            <div className="relative">
              <Input
                placeholder="Search name, CAS, SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startIcon={<Search className="h-4 w-4" />}
                className="text-xs h-9"
              />
            </div>
          </div>

          {/* Category Filter List */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 block">
              Categories
            </span>
            <div className="space-y-1 text-xs">
              <button
                onClick={() => setSelectedCategorySlug(null)}
                className={`w-full text-left px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-between font-mono ${
                  !selectedCategorySlug
                    ? 'bg-[#4353FF] text-white font-bold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>All Categories</span>
                <span className="text-[10px] opacity-80">{products.length}</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategorySlug(cat.slug)}
                  className={`w-full text-left px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-between font-mono ${
                    selectedCategorySlug === cat.slug
                      ? 'bg-[#4353FF] text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] opacity-80">{cat.productCount}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Purity Level Filter */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 block">
              Verified HPLC Purity
            </span>
            <div className="space-y-1.5 text-xs font-mono">
              <button
                onClick={() => setMinPurity('all')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                  minPurity === 'all'
                    ? 'bg-blue-50 text-[#4353FF] font-bold border border-blue-200'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>All Certified (≥99.0%)</span>
              </button>
              <button
                onClick={() => setMinPurity('99.5')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                  minPurity === '99.5'
                    ? 'bg-blue-50 text-[#4353FF] font-bold border border-blue-200'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>Ultra-Pure Grade (≥99.5%)</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Right Product Grid */}
        <main className="lg:col-span-9 space-y-6">
          {/* Controls Bar: Sort & View Toggle */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-500 font-mono shrink-0">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#4353FF] focus:ring-1 focus:ring-[#4353FF] font-medium font-mono"
              >
                <option value="featured">Featured Standards</option>
                <option value="purity">Purity Score (High to Low)</option>
                <option value="price-asc">Price (Low to High)</option>
                <option value="price-desc">Price (High to Low)</option>
                <option value="name">Product Name (A-Z)</option>
              </select>
            </div>

            <div className="flex items-center gap-1 self-end sm:self-auto">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg border ${
                  viewMode === 'grid'
                    ? 'bg-[#4353FF] text-white border-[#4353FF] shadow-xs'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
                title="Grid Layout"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg border ${
                  viewMode === 'list'
                    ? 'bg-[#4353FF] text-white border-[#4353FF] shadow-xs'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
                title="List Layout"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Product Items */}
          {filteredProducts.length === 0 ? (
            <EmptyState
              title="No compounds match your filter"
              description="Try adjusting your search query, purity threshold, or category selection."
              actionText="Reset All Filters"
              onAction={() => {
                setSelectedCategorySlug(null);
                setSearchQuery('');
                setMinPurity('all');
              }}
            />
          ) : (
            <div
              className={`grid gap-6 ${
                viewMode === 'grid'
                  ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                  : 'grid-cols-1'
              }`}
            >
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
