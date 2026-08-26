import React, { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { categoryPath, productPath, ROUTES } from '../lib/routing';
import { Tabs } from '../components/ui/Tabs';
import { ProductCard } from '../components/ui/ProductCard';
import { formatPrice } from '../lib/utils';
import { calculateTierDiscountForLine } from '../lib/pricing';
import { formatProductDisplayName, documentedPurityLabel } from '../lib/product-display';
import { getRelatedProducts } from '../lib/related-products';
import { recordRecentlyViewed } from '../lib/recently-viewed';
import { ProductShippingPanel } from '../components/product/ProductShippingPanel';
import { BatchDocumentationPanel } from '../components/product/BatchDocumentationPanel';
import { RecentlyViewedRail } from '../components/catalogue/RecentlyViewedRail';
import {
  ShieldCheck,
  Plus,
  Minus,
  Heart,
  Share2,
  Zap,
  Eye,
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const {
    products,
    categories,
    selectedProductSlug,
    addToCart,
    wishlist,
    toggleWishlist,
    currency,
    navigate,
    addToast,
    currentUser,
    setProductStatus,
    shippingMethods,
    destinationCountryCode,
    publishedProducts,
  } = useStore();

  const product = products.find((p) => p.slug === selectedProductSlug);
  const category = product ? categories.find((c) => c.id === product.categoryId) : undefined;

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product?.variants[0]?.id || ''
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<string>('specs');
  const [isAdding, setIsAdding] = useState<boolean>(false);

  useEffect(() => {
    if (product?.id) {
      recordRecentlyViewed(product.id);
    }
  }, [product?.id]);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold font-mono">Compound not found</h2>
        <Button onClick={() => navigate('/shop')} className="mt-4">
          Return to Catalogue
        </Button>
      </div>
    );
  }

  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];

  const isWishlisted = wishlist.includes(product.id);
  const currentImages =
    product.images && product.images.length > 0
      ? product.images
      : [
          {
            id: 'fallback',
            productId: product.id,
            url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
            altText: product.name,
            sortOrder: 1,
            isPrimary: true,
          },
        ];

  const isDraftOrUnpublished = product.status !== 'PUBLISHED';
  const displayName = formatProductDisplayName(product.name);
  const purityLabel = documentedPurityLabel(product, selectedVariant);
  const relatedProducts = getRelatedProducts(product, publishedProducts, 3);
  const lineDiscount = calculateTierDiscountForLine(
    quantity,
    selectedVariant.price,
    selectedVariant.pricingTiers || product.pricingTiers
  );

  const handleAddToCart = () => {
    setIsAdding(true);
    addToCart(product, selectedVariant.id, quantity);
    setTimeout(() => {
      setIsAdding(false);
    }, 500);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    addToast('info', 'Link Copied', 'Product link copied to clipboard.');
  };

  const tabsList = [
    { id: 'specs', label: 'Specifications' },
    {
      id: 'coa',
      label: 'Batch documentation',
      badge: product.documentationStatus === 'VERIFIED' || product.documentationStatus === 'AVAILABLE' ? 'Records' : undefined,
    },
    { id: 'handling', label: 'Storage' },
    { id: 'compliance', label: 'Research-use statement' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Admin Draft Preview Banner */}
      {isDraftOrUnpublished && (
        <div className="rounded-xl border border-blue-400 bg-blue-500/10 p-4 text-blue-900 font-mono text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Eye className="h-5 w-5 text-[#4353FF] shrink-0 animate-pulse" />
            <div>
              <span className="font-bold uppercase tracking-wider block">
                [ADMIN PREVIEW MODE — STATUS: {product.status}]
              </span>
              <span className="text-[11px] font-sans text-slate-700">
                This compound is currently unpublished and not visible to standard public store visitors.
              </span>
            </div>
          </div>
          {currentUser.role === 'ADMIN' && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="primary"
                size="sm"
                className="h-8 text-xs font-mono shadow-xs"
                onClick={() => setProductStatus(product.id, 'PUBLISHED')}
              >
                Publish Compound
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Shop Catalogue', href: ROUTES.shop },
          {
            label: product.categoryName || 'Category',
            href: category ? categoryPath(category.slug) : ROUTES.shop,
          },
          { label: product.name, href: productPath(product.slug) },
        ]}
      />

      {/* Main Product Hero / Purchase Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-6 flex items-center justify-center shadow-xs">
            {purityLabel ? (
              <Badge
                variant="brand"
                size="md"
                className="absolute left-4 top-4 z-10 bg-[#4353FF] text-white border-[#4353FF] shadow-xs font-mono"
              >
                {purityLabel}
              </Badge>
            ) : (
              <Badge
                variant="neutral"
                size="md"
                className="absolute left-4 top-4 z-10 bg-slate-800 text-slate-200 border-slate-700 shadow-xs font-mono text-[10px]"
              >
                LABORATORY STANDARD
              </Badge>
            )}

            <img
              src={currentImages[selectedImageIndex]?.url || currentImages[0].url}
              alt={currentImages[selectedImageIndex]?.altText || product.name}
              className="max-h-full max-w-full object-contain object-center rounded-lg"
            />
          </div>

          {/* Thumbnails */}
          {currentImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {currentImages.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`h-20 w-20 shrink-0 rounded-lg border p-1 bg-white overflow-hidden transition-all cursor-pointer ${
                    selectedImageIndex === idx
                      ? 'border-[#4353FF] ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <img src={img.url} alt={img.altText} className="h-full w-full object-cover rounded-md" />
                </button>
              ))}
            </div>
          )}

          {/* Laboratory In-Vitro Governance Notice */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-xs text-blue-950 space-y-1 font-mono">
            <div className="flex items-center gap-1.5 font-bold text-[#4353FF]">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>IN-VITRO LABORATORY STANDARD REAGENT</span>
            </div>
            <p className="text-[11px] font-sans text-slate-700 leading-relaxed">
              Manufactured exclusively for analytical liquid chromatography, mass spectrometry calibration, and cell-free in-vitro research. Strictly not for human or veterinary administration.
            </p>
          </div>
        </div>

        {/* Right Configuration & Purchase Panel */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500">
              <span>SKU: {selectedVariant.sku}</span>
              {product.casNumber && <span>CAS: {product.casNumber}</span>}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold font-mono text-slate-950 tracking-tight">
              {displayName}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1 font-sans">
              {product.shortDescription}
            </p>
          </div>

          {/* Variant Selection */}
          <div className="space-y-2.5 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-800 font-mono">
              <span>Select Quantity / Format:</span>
              <span className="text-[#4353FF] font-bold">{selectedVariant.size}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {product.variants.map((v) => {
                const isSelected = v.id === selectedVariant.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariantId(v.id)}
                    className={`flex flex-col p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#4353FF] bg-blue-50/50 shadow-xs ring-1 ring-blue-500/30'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-900 font-mono">{v.size}</span>
                    <span className="text-xs font-mono font-semibold text-slate-700 mt-1">
                      {formatPrice(v.price, currency)}
                    </span>
                    <span className="text-[10px] font-mono mt-0.5 text-emerald-700">In stock</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Volume Pricing Matrix Table */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-900 uppercase font-mono tracking-wider text-[11px]">
              <span>Volume Tier Schedule</span>
              <span className="text-[#4353FF]">Authoritative Tier Pricing</span>
            </div>
            <div
              className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-4"
              role="radiogroup"
              aria-label="Volume pricing tier"
            >
              {[
                { label: '1–2 units', qty: 1, min: 1, max: 2 },
                { label: '3–5 units', qty: 3, min: 3, max: 5 },
                { label: '6–9 units', qty: 6, min: 6, max: 9 },
                { label: '10+ units', qty: 10, min: 10, max: Number.POSITIVE_INFINITY },
              ].map((tier) => {
                const discount = calculateTierDiscountForLine(
                  tier.qty,
                  selectedVariant.price,
                  selectedVariant.pricingTiers || product.pricingTiers
                );
                const unit = selectedVariant.price - discount / tier.qty;
                const isSelected = quantity >= tier.min && quantity <= tier.max;
                const nextQuantity =
                  selectedVariant.stock > 0 ? Math.min(tier.qty, selectedVariant.stock) : tier.qty;
                return (
                  <button
                    key={tier.label}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => {
                      if (isSelected) return;
                      setQuantity(Math.max(1, nextQuantity));
                    }}
                    className={`min-h-12 appearance-none rounded-lg border p-2 text-center font-mono text-[11px] transition-all cursor-pointer outline-none ${
                      isSelected
                        ? 'border-[#4353FF] bg-blue-50 shadow-xs ring-1 ring-[#4353FF]/30'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="block text-[10px] text-slate-500">{tier.label}</span>
                    <span className="font-bold text-slate-900">{formatPrice(unit, currency)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pricing, Quantity & Purchase Actions */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-500 font-mono block">Order Total (ex. VAT)</span>
                <div className="text-3xl font-extrabold font-mono text-slate-950 tracking-tight">
                  {formatPrice(selectedVariant.price * quantity - lineDiscount, currency)}
                </div>
              </div>

              {/* Quantity Counter */}
              <div className="flex items-center border border-slate-300 rounded-lg bg-white shadow-2xs">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-l-lg transition-colors cursor-pointer"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 text-sm font-mono font-bold text-slate-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-r-lg transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={handleAddToCart}
                isLoading={isAdding}
                className="sm:col-span-9 font-mono text-sm tracking-wide shadow-md shadow-blue-500/20"
              >
                <span>Add to Cart</span>
              </Button>

              <div className="sm:col-span-3 flex gap-2">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => toggleWishlist(product.id)}
                  className={`flex-1 ${isWishlisted ? 'text-rose-600 border-rose-300 bg-rose-50' : ''}`}
                  title="Save for later"
                >
                  <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-rose-600' : ''}`} />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleShare}
                  className="flex-1"
                  title="Share Reference"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Guarantees */}
            <ProductShippingPanel
              shippingMethods={shippingMethods}
              countryCode={destinationCountryCode}
              subtotal={selectedVariant.price * quantity - lineDiscount}
              currency={currency}
            />
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600">
              <Zap className="h-3.5 w-3.5 text-[#4353FF] shrink-0" />
              <span>5% cryptocurrency settlement discount is applied at checkout when that method is selected.</span>
            </div>
          </div>
        </div>
      </div>

      {/* TECHNICAL DOCUMENTATION VIEWER & TABS */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 md:p-8 shadow-2xs space-y-6">
        <Tabs tabs={tabsList} activeTab={activeTab} onChange={setActiveTab} />

        {/* Tab 1: Technical Documentation Viewer */}
        {activeTab === 'specs' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed font-sans">
              <h4 className="text-sm font-bold text-slate-900 uppercase font-mono">
                Laboratory Product Specification &amp; Overview
              </h4>
              <p className="whitespace-pre-wrap">{product.longDescription || product.shortDescription}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                <span className="text-slate-500 block text-[11px]">CAS Registry Number</span>
                <span className="font-bold text-slate-900">{product.casNumber || 'Unavailable in record'}</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                <span className="text-slate-500 block text-[11px]">Molecular Formula</span>
                <span className="font-bold text-slate-900">{product.molecularFormula || 'Proprietary / Unavailable'}</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                <span className="text-slate-500 block text-[11px]">Molecular Weight</span>
                <span className="font-bold text-slate-900">
                  {product.molecularWeight ? `${product.molecularWeight} g/mol` : 'Unavailable'}
                </span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1 md:col-span-2 lg:col-span-2">
                <span className="text-slate-500 block text-[11px]">Amino Acid Sequence / Formulation</span>
                <span className="font-bold text-slate-900 break-all">
                  {product.sequence || 'Protected analytical sequence standard'}
                </span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                <span className="text-slate-500 block text-[11px]">Physical Appearance</span>
                <span className="font-bold text-slate-900">{product.appearance}</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                <span className="text-slate-500 block text-[11px]">Manufacturer / Lab Origin</span>
                <span className="font-bold text-slate-900">{product.manufacturer || 'Not recorded'}{product.origin ? ` (${product.origin})` : ''}</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                <span className="text-slate-500 block text-[11px]">Documentation Status</span>
                <Badge
                  variant={
                    product.documentationStatus === 'VERIFIED'
                      ? 'success'
                      : product.documentationStatus === 'AVAILABLE'
                      ? 'brand'
                      : 'warning'
                  }
                  size="sm"
                >
                  {product.documentationStatus.replace('_', ' ')}
                </Badge>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                <span className="text-slate-500 block text-[11px]">Analytical Data Mode</span>
                <span className="font-bold text-slate-800">
                  {product.analyticalDataSource === 'VERIFIED'
                    ? 'Verified batch record'
                    : product.analyticalDataSource === 'DEMO'
                    ? 'Demonstration only'
                    : product.analyticalDataSource === 'DOCUMENTED'
                    ? 'Documented'
                    : 'Unavailable'}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'coa' && <BatchDocumentationPanel product={product} />}

        {/* Tab 3: Laboratory Handling & Storage */}
        {activeTab === 'handling' && (
          <div className="space-y-4 text-xs text-slate-700 leading-relaxed animate-in fade-in duration-150">
            <h4 className="text-sm font-bold text-slate-900 font-mono uppercase">
              Laboratory Storage &amp; In-Vitro Handling Guidelines
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200 font-sans">
                <h5 className="font-bold text-slate-900 font-mono">Lyophilized Peptide Preservation:</h5>
                <ul className="list-disc pl-4 space-y-1 text-slate-600">
                  <li>{product.storageRequirements}</li>
                  <li>Store in sealed amber or desiccated containers away from direct UV exposure.</li>
                  <li>Allow vial to reach ambient laboratory temperature before opening to avoid moisture condensation.</li>
                </ul>
              </div>
              <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200 font-sans">
                <h5 className="font-bold text-slate-900 font-mono">Laboratory Solvent Compatibility:</h5>
                <ul className="list-disc pl-4 space-y-1 text-slate-600">
                  <li>Compatible Solvents: {product.solubility}</li>
                  <li>Gently swirl analytical solutions; avoid harsh agitation to prevent peptide chain shearing.</li>
                  <li>Store prepared analytical aliquots at -80°C for extended assay stability.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Statutory Declaration */}
        {activeTab === 'compliance' && (
          <div className="space-y-3 text-xs text-slate-700 leading-relaxed animate-in fade-in duration-150">
            <div className="rounded-xl bg-blue-50/60 border border-blue-200 p-4 text-blue-950 font-mono space-y-2">
              <h5 className="font-bold uppercase tracking-wider text-[#4353FF]">
                UK Statutory Instrument Research Exemption Clause
              </h5>
              <p className="font-sans text-xs text-slate-800 leading-relaxed">
                This biochemical reagent is supplied strictly under UK analytical and laboratory research exemptions.
                It is neither a pharmaceutical preparation nor an approved medicine. It must not be administered to humans or animals under any circumstances. Purchasing institutions confirm full responsibility for laboratory containment and compliance.
              </p>
            </div>
          </div>
        )}
      </section>

      {relatedProducts.length > 0 && (
        <section className="space-y-6 pt-6 border-t border-slate-200">
          <h3 className="text-xl font-bold font-mono text-slate-950">Related catalogue items</h3>
          <p className="text-xs text-slate-500">Shown from the same category or product type. This is not a biological similarity claim.</p>
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
      <RecentlyViewedRail products={publishedProducts} excludeProductId={product.id} />
    </div>
  );
};
