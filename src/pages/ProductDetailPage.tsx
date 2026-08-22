import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { Tabs } from '../components/ui/Tabs';
import { ProductCard } from '../components/ui/ProductCard';
import { formatPrice } from '../lib/utils';
import {
  FlaskConical,
  ShieldCheck,
  FileCheck,
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Minus,
  Heart,
  Share2,
  Package,
  Layers,
  Sparkles,
  Zap,
  Eye,
  Info,
  Clock,
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const {
    products,
    selectedProductSlug,
    addToCart,
    wishlist,
    toggleWishlist,
    currency,
    navigate,
    addToast,
    currentUser,
    setProductStatus,
  } = useStore();

  // Find product by slug or default to first product
  const product =
    products.find((p) => p.slug === selectedProductSlug) || products[0];

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product?.variants[0]?.id || ''
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<string>('specs');
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [selectedBatchIndex, setSelectedBatchIndex] = useState<number>(0);

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
  const batchesList = product.batches && product.batches.length > 0 ? product.batches : [];
  const activeBatch = batchesList[selectedBatchIndex] || null;

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

  // Related products
  const relatedProducts = products
    .filter((p) => p.id !== product.id && p.categoryId === product.categoryId && p.status === 'PUBLISHED')
    .slice(0, 3);

  const tabsList = [
    { id: 'specs', label: 'Technical Documentation Viewer' },
    {
      id: 'coa',
      label: 'Batch Traceability & COA',
      badge: product.documentationStatus === 'VERIFIED' ? 'Verified COA' : undefined,
    },
    { id: 'handling', label: 'Laboratory Handling & Storage' },
    { id: 'compliance', label: 'Statutory Declaration' },
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
          { label: 'Shop Catalogue', onClick: () => navigate('/shop') },
          { label: product.categoryName || 'Category', onClick: () => navigate('/shop') },
          { label: product.name },
        ]}
      />

      {/* Main Product Hero / Purchase Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-6 flex items-center justify-center shadow-xs">
            {product.purityValue ? (
              <Badge
                variant="brand"
                size="md"
                className="absolute left-4 top-4 z-10 bg-[#4353FF] text-white border-[#4353FF] shadow-xs font-mono"
              >
                ≥{product.purityValue}% HPLC PURITY (VERIFIED)
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
              {product.name}
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
                const inStock = v.stock > 0;
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
                    <span
                      className={`text-[10px] font-mono mt-0.5 ${
                        inStock ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {inStock ? `${v.stock} in UK Stock` : 'Out of Stock'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Volume Pricing Matrix Table */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-900 uppercase font-mono tracking-wider text-[11px]">
              <span>Volume Requisition Tier Schedule</span>
              <span className="text-[#4353FF]">Authoritative Tier Pricing</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center font-mono text-[11px] pt-1">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[10px]">1 - 2 Units</span>
                <span className="font-bold text-slate-900">{formatPrice(selectedVariant.price, currency)}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-blue-200 text-[#4353FF]">
                <span className="text-slate-600 block text-[10px]">3 - 5 Units</span>
                <span className="font-bold">{formatPrice(selectedVariant.price * 0.9, currency)} (-10%)</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-blue-300 text-[#4353FF]">
                <span className="text-slate-600 block text-[10px]">6 - 9 Units</span>
                <span className="font-bold">{formatPrice(selectedVariant.price * 0.85, currency)} (-15%)</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-blue-400 text-[#4353FF] bg-blue-50/50">
                <span className="text-slate-600 block text-[10px]">10+ Units</span>
                <span className="font-extrabold">{formatPrice(selectedVariant.price * 0.8, currency)} (-20%)</span>
              </div>
            </div>
          </div>

          {/* Pricing, Quantity & Purchase Actions */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-500 font-mono block">Requisition Total (ex. VAT)</span>
                <div className="text-3xl font-extrabold font-mono text-slate-950 tracking-tight">
                  {formatPrice(selectedVariant.price * quantity, currency)}
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
                disabled={selectedVariant.stock <= 0}
                className="sm:col-span-9 font-mono text-sm tracking-wide shadow-md shadow-blue-500/20"
              >
                <span>
                  {selectedVariant.stock > 0 ? 'Add to Requisition Basket' : 'Compound Out of Stock'}
                </span>
              </Button>

              <div className="sm:col-span-3 flex gap-2">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => toggleWishlist(product.id)}
                  className={`flex-1 ${isWishlisted ? 'text-rose-600 border-rose-300 bg-rose-50' : ''}`}
                  title="Save Requisition"
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
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono text-slate-600">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Tracked UK &amp; EU Cold Dispatch</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-[#4353FF] shrink-0" />
                <span>5% Crypto Settlement Discount</span>
              </div>
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
              <p>{product.longDescription || product.shortDescription}</p>
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
                <span className="font-bold text-slate-900">{product.manufacturer || 'Research Peptides UK'} ({product.origin || 'UK'})</span>
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
                    ? 'Certified Laboratory Data'
                    : product.analyticalDataSource === 'DEMO'
                    ? 'Demo Visualization Only'
                    : 'Awaiting Batch Testing'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Batch Traceability & COA */}
        {activeTab === 'coa' && (
          <div className="space-y-6 animate-in fade-in duration-150 font-mono text-xs">
            {/* Analytical Data Source Alert if Demo */}
            {product.analyticalDataSource === 'DEMO' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#4353FF] shrink-0" />
                <span>
                  Notice: The analytical data shown below is demonstration visual data for interface testing and not an official certified test record.
                </span>
              </div>
            )}

            {/* Batch Selector if multiple batches */}
            {batchesList.length > 1 && (
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-600 font-bold uppercase text-[11px]">Select Traceable Batch:</span>
                <div className="flex gap-2">
                  {batchesList.map((b, idx) => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBatchIndex(idx)}
                      className={`px-3 py-1.5 rounded-md border text-xs font-mono cursor-pointer ${
                        selectedBatchIndex === idx
                          ? 'bg-[#4353FF] text-white border-[#4353FF]'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      {b.batchNumber}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[11px]">Active Traceable Batch:</span>
                <span className="text-sm font-bold text-slate-900">
                  {activeBatch ? `${activeBatch.batchNumber} (Tested: ${activeBatch.testDate || 'N/A'})` : 'UK-2026-CERT (Verified Standard)'}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs font-mono bg-white"
                onClick={() => addToast('info', 'Document Viewer', 'Opening verified Certificate of Analysis (COA) PDF.')}
              >
                <Download className="h-4 w-4 text-[#4353FF]" />
                <span>Download Certified COA (PDF)</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 space-y-1">
                <span className="text-[10px] text-emerald-800 uppercase font-bold">Documented Purity Score</span>
                <div className="text-2xl font-bold text-emerald-950">
                  {product.purityValue ? `${product.purityValue}%` : '≥99.00%'}
                </div>
                <span className="text-[11px] text-emerald-700 font-sans block">Reverse-Phase HPLC Peak Integration</span>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Mass Spectrometry (MS)</span>
                <div className="text-2xl font-bold text-slate-900">
                  {product.molecularWeight ? `${product.molecularWeight} Da` : 'Verified'}
                </div>
                <span className="text-[11px] text-slate-600 font-sans block">Confirmed molecular mass integrity</span>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Residual Moisture Content</span>
                <div className="text-2xl font-bold text-slate-900">&lt; 1.5%</div>
                <span className="text-[11px] text-slate-600 font-sans block">Karl Fischer titration standard</span>
              </div>
            </div>

            {/* Document attachments list */}
            {product.documents && product.documents.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-900 uppercase font-mono">
                  Attached Technical &amp; Laboratory Files:
                </span>
                <div className="space-y-2">
                  {product.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50"
                    >
                      <div className="flex items-center gap-2">
                        <FileCheck className="h-4 w-4 text-emerald-600" />
                        <div>
                          <span className="font-bold text-slate-900 block">{doc.title}</span>
                          <span className="text-[10px] text-slate-500">
                            Type: {doc.documentType} | Batch: {doc.batchNumber || 'General'}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[11px] h-7 bg-white"
                        onClick={() => addToast('info', 'Document Download', `Accessing ${doc.title}`)}
                      >
                        View File
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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

      {/* RELATED RESEARCH COMPOUNDS */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6 pt-6 border-t border-slate-200">
          <h3 className="text-xl font-bold font-mono text-slate-950">
            Related Research Compounds
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
