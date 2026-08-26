import React, { useMemo, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ui/ProductCard';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { Badge } from '../components/ui/Badge';
import { AppLink } from '../components/ui/AppLink';
import { categoryPath, ROUTES, searchPath } from '../lib/routing';
import { productMatchesQuery } from '../lib/catalogue-search';
import { getProductPriceBounds } from '../lib/product-display';
import { calculateBestsellerScores } from '../lib/merchandising';
import { isListedShopCategory, RESEARCH_CHEMICALS_CATEGORY_SLUG } from '../lib/catalogue-collections';
import { Search, LayoutGrid, List } from 'lucide-react';

export const ShopPage: React.FC = () => {
  const {
    publishedProducts,
    categories,
    selectedCategorySlug,
    searchQuery,
    setSearchQuery,
    navigate,
    orders,
  } = useStore();

  const [sortBy, setSortBy] = useState<string>('featured');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const bestsellerScores = useMemo(() => calculateBestsellerScores(orders), [orders]);
  const activeCategory = categories.find((category) => category.slug === selectedCategorySlug);

  const filteredProducts = useMemo(() => {
    const min = minPrice ? Number(minPrice) : null;
    const max = maxPrice ? Number(maxPrice) : null;

    return publishedProducts
      .filter((product) => {
        if (selectedCategorySlug && selectedCategorySlug !== 'all') {
          if (!activeCategory || product.categoryId !== activeCategory.id) return false;
        }

        if (searchQuery.trim() && !productMatchesQuery(product, searchQuery, activeCategory?.name)) {
          return false;
        }

        const bounds = getProductPriceBounds(product);
        if (bounds) {
          if (min !== null && !Number.isNaN(min) && bounds.max < min) return false;
          if (max !== null && !Number.isNaN(max) && bounds.min > max) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') {
          return (getProductPriceBounds(a)?.min || 0) - (getProductPriceBounds(b)?.min || 0);
        }
        if (sortBy === 'price-desc') {
          return (getProductPriceBounds(b)?.max || 0) - (getProductPriceBounds(a)?.max || 0);
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'newest') {
          return Date.parse(b.publishedAt || b.createdAt) - Date.parse(a.publishedAt || a.createdAt);
        }
        if (sortBy === 'bestseller') {
          return (bestsellerScores.get(b.id)?.score || 0) - (bestsellerScores.get(a.id)?.score || 0);
        }
        if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }, [
    publishedProducts,
    selectedCategorySlug,
    searchQuery,
    minPrice,
    maxPrice,
    sortBy,
    activeCategory,
    bestsellerScores,
  ]);

  const isResearchChemicalsEmpty =
    selectedCategorySlug === RESEARCH_CHEMICALS_CATEGORY_SLUG && filteredProducts.length === 0 && !searchQuery.trim();

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: 'Shop', href: ROUTES.shop },
          ...(selectedCategorySlug
            ? [{ label: activeCategory?.name || 'Category', href: categoryPath(selectedCategorySlug) }]
            : searchQuery
              ? [{ label: `Search`, href: searchPath(searchQuery) }]
              : []),
        ]}
      />

      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end">
        <div>
          <span className="font-mono text-xs font-bold tracking-wider text-[#4353FF] uppercase">
            Laboratory catalogue
          </span>
          <h1 className="mt-1 font-mono text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {activeCategory?.name || (searchQuery ? `Search results` : 'All research products')}
          </h1>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
            {activeCategory?.description ||
              'Filter and sort published catalogue items. Membership of each collection is driven by category records.'}
          </p>
        </div>
        <Badge variant="brand" size="md">
          {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <aside className="space-y-6 lg:sticky lg:top-20 lg:z-10 lg:col-span-3 lg:self-start lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto">
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="block font-mono text-xs font-bold tracking-wider text-slate-900 uppercase">Search</span>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                navigate(
                  selectedCategorySlug
                    ? categoryPath(selectedCategorySlug, searchQuery)
                    : searchPath(searchQuery)
                );
              }}
            >
              <Input
                placeholder="Name, CAS, SKU, category..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                startIcon={<Search className="h-4 w-4" />}
                className="h-9 text-xs"
              />
            </form>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="block font-mono text-xs font-bold tracking-wider text-slate-900 uppercase">
              Categories
            </span>
            <div className="space-y-1 text-xs">
              <AppLink
                href={ROUTES.shop}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 font-mono font-medium transition-colors ${
                  !selectedCategorySlug ? 'bg-[#4353FF] font-bold text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>All</span>
                <span className="text-[10px] opacity-80">{publishedProducts.length}</span>
              </AppLink>
              {categories
                .filter(isListedShopCategory)
                .map((cat) => (
                  <AppLink
                    key={cat.id}
                    href={categoryPath(cat.slug)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 font-mono font-medium transition-colors ${
                      selectedCategorySlug === cat.slug
                        ? 'bg-[#4353FF] font-bold text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="pr-2 text-left leading-snug">{cat.name}</span>
                    <span className="text-[10px] opacity-80">{cat.productCount ?? 0}</span>
                  </AppLink>
                ))}
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="block font-mono text-xs font-bold tracking-wider text-slate-900 uppercase">
              Price (GBP)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Min"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                className="h-9 text-xs"
                inputMode="decimal"
              />
              <Input
                placeholder="Max"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                className="h-9 text-xs"
                inputMode="decimal"
              />
            </div>
          </div>
        </aside>

        <div className="space-y-6 lg:col-span-9">
          <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs sm:flex-row">
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <span className="shrink-0 font-mono text-xs text-slate-500">Sort by:</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 font-mono text-xs font-medium focus:border-[#4353FF] focus:ring-1 focus:ring-[#4353FF] focus:outline-none"
              >
                <option value="featured">Featured</option>
                <option value="bestseller">Bestsellers (completed orders)</option>
                <option value="newest">Newest</option>
                <option value="price-asc">Price (low to high)</option>
                <option value="price-desc">Price (high to low)</option>
                <option value="name">Name (A–Z)</option>
              </select>
            </div>
            <div className="flex gap-1 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`rounded-lg border p-1.5 ${
                  viewMode === 'grid' ? 'border-[#4353FF] bg-[#4353FF] text-white' : 'border-slate-200 bg-white text-slate-500'
                }`}
                title="Grid layout"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`rounded-lg border p-1.5 ${
                  viewMode === 'list' ? 'border-[#4353FF] bg-[#4353FF] text-white' : 'border-slate-200 bg-white text-slate-500'
                }`}
                title="List layout"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <EmptyState
              title={isResearchChemicalsEmpty ? 'No research chemicals published' : 'No compounds match these filters'}
              description={
                isResearchChemicalsEmpty
                  ? 'This collection is database-driven. Items appear here only after product, documentation, and eligibility review. None have been invented to populate the page.'
                  : 'Try a different search, price range, or category. You can also browse peptides or the full catalogue.'
              }
              actionText={isResearchChemicalsEmpty ? 'Browse peptides' : 'Reset filters'}
              onAction={() => {
                if (isResearchChemicalsEmpty) navigate(ROUTES.peptides);
                else {
                  navigate(ROUTES.shop);
                  setMinPrice('');
                  setMaxPrice('');
                }
              }}
            />
          ) : (
            <div
              className={`grid gap-3 sm:gap-6 ${
                viewMode === 'grid' ? 'grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'
              }`}
            >
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} layout={viewMode} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
