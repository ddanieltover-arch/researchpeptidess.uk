import React from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ui/ProductCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  FlaskConical,
  ShieldCheck,
  Zap,
  Truck,
  FileCheck2,
  FileSpreadsheet,
  ArrowRight,
  Sparkles,
  Lock,
  Layers,
  ChevronRight,
  Award,
} from 'lucide-react';
import { formatPrice } from '../lib/utils';

export const HomePage: React.FC = () => {
  const { products, categories, setSelectedCategorySlug, navigate, currency } = useStore();

  const featuredProducts = products.filter((p) => p.isFeatured).slice(0, 4);

  return (
    <div className="space-y-12 sm:space-y-16 pb-16 bg-slate-50">
      {/* 1. HERO SECTION */}
      <section className="relative bg-gradient-to-b from-blue-50/50 via-slate-50 to-slate-50 border-b border-slate-200 flex items-center overflow-hidden py-14 sm:py-20">
        {/* Subtle geometric ring accent */}
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-10 flex items-center justify-center pointer-events-none">
          <div className="w-80 h-80 border-[24px] border-[#4353FF] rounded-full"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-8 lg:px-10 z-10 w-full">
          <div className="max-w-2xl">
            {/* Tag */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-blue-200 text-[#4353FF] text-xs font-mono font-bold uppercase tracking-wider rounded-full mb-4 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#4353FF]"></span>
              Precision Laboratory Synthesis
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-4 text-slate-900 font-mono">
              The Gold Standard in <br />
              <span className="text-[#4353FF]">Biochemical Research</span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-600 text-sm sm:text-base max-w-lg mb-6 leading-relaxed">
              Providing the UK scientific and institutional community with high-purity peptides, rigorous HPLC batch testing, and comprehensive analytical documentation for in-vitro research.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 pt-1">
              <Button
                variant="primary"
                onClick={() => {
                  setSelectedCategorySlug(null);
                  navigate('/shop');
                }}
                className="px-8 py-3.5 text-xs shadow-md shadow-blue-500/20"
              >
                Browse Catalogue
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/product/bpc-157-reference-standard')}
                className="px-8 py-3.5 text-xs"
              >
                View COA Library
              </Button>
            </div>

            {/* Micro Trust Points */}
            <div className="pt-8 mt-6 border-t border-slate-200 grid grid-cols-3 gap-4 text-xs font-mono">
              <div>
                <span className="block text-slate-900 font-extrabold text-base">≥99.0%</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">HPLC Purity</span>
              </div>
              <div>
                <span className="block text-slate-900 font-extrabold text-base">Next Day</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">UK Tracked 24</span>
              </div>
              <div>
                <span className="block text-[#4353FF] font-extrabold text-base">-5% Auto</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Crypto Discount</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BRITISH SCIENTIFIC ASSURANCE & CERTIFICATIONS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-2 hover:border-[#4353FF] hover:shadow-md transition-all">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-50 text-[#4353FF] flex items-center justify-center rounded-lg shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">≥99% HPLC Certified</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every compound is verified via reverse-phase HPLC chromatography prior to batch release.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-2 hover:border-[#4353FF] hover:shadow-md transition-all">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-50 text-[#4353FF] flex items-center justify-center rounded-lg shrink-0">
                <FlaskConical className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">ISO 9001 Synthesis</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Lyophilized in sterile ISO-certified UK facilities with full batch segregation and inert atmosphere.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-2 hover:border-[#4353FF] hover:shadow-md transition-all">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-50 text-[#4353FF] flex items-center justify-center rounded-lg shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">Royal Mail Tracked 24</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Same-day dispatch for UK orders placed before 3 PM. Insulated temperature-controlled dispatch.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-2 hover:border-[#4353FF] hover:shadow-md transition-all">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-50 text-[#4353FF] flex items-center justify-center rounded-lg shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">5% Crypto Discount</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Automatic 5% pricing deduction on Bitcoin, USDT &amp; crypto settlement with instant confirmation.
            </p>
          </div>
        </div>
      </section>

      {/* 2. FEATURED ANALYTICAL COMPOUNDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10">
        <div className="flex justify-between items-end mb-8 border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#4353FF] block mb-1">
              Analytical Standards
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
              Featured Reference Compounds
            </h2>
          </div>
          <button
            onClick={() => {
              setSelectedCategorySlug(null);
              navigate('/shop');
            }}
            className="text-xs font-bold uppercase font-mono tracking-wider text-[#4353FF] hover:text-[#3846E0] transition-colors"
          >
            View All Products →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 3. CATEGORIES SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10 space-y-6">
        <div className="flex justify-between items-end border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#4353FF] block mb-1">
              Catalogue Taxonomy
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
              Research Classifications
            </h2>
          </div>
          <button
            onClick={() => {
              setSelectedCategorySlug(null);
              navigate('/shop');
            }}
            className="text-xs font-mono font-bold uppercase tracking-wider text-[#4353FF] hover:text-[#3846E0] transition-colors"
          >
            Explore Taxonomy →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => {
                setSelectedCategorySlug(cat.slug);
                navigate('/shop');
              }}
              className="group bg-white border border-slate-200 p-6 hover:border-[#4353FF] hover:shadow-lg hover:shadow-blue-500/5 transition-all cursor-pointer space-y-3 rounded-xl"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono font-bold text-[#4353FF] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
                  {cat.productCount} Compounds
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#4353FF] group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-[#4353FF] transition-colors font-mono">
                {cat.name}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{cat.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. QUALITY & HPLC ASSURANCE */}
      <section className="bg-white border-y border-slate-200 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#4353FF] block">
                Quality &amp; Verification
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
                Dual-Stage <span className="text-[#4353FF]">HPLC &amp; Mass Spec Analysis</span>
              </h2>
              <p className="text-xs sm:text-base text-slate-600 leading-relaxed">
                We believe scientific research demands complete analytical clarity. Every batch of Research Peptides UK lyophilized vials carries an immutable batch ID correlating directly with an unedited third-party HPLC spectrogram and Mass Spectrometry (ESI-MS) readout.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-800">
                  <div className="w-5 h-5 rounded-full bg-[#4353FF] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 shadow-xs">
                    ✓
                  </div>
                  <div>
                    <strong className="font-bold">RP-HPLC Chromatograms:</strong> Peak area integration confirming absence of synthesis truncations.
                  </div>
                </div>
                <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-800">
                  <div className="w-5 h-5 rounded-full bg-[#4353FF] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 shadow-xs">
                    ✓
                  </div>
                  <div>
                    <strong className="font-bold">Electrospray Ionization MS:</strong> Exact mass matching within ±0.5 Daltons of theoretical molecular mass.
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <Button
                  variant="primary"
                  onClick={() => navigate('/product/bpc-157-reference-standard')}
                  className="text-xs shadow-md shadow-blue-500/20"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  <span>View Sample Certificate of Analysis</span>
                </Button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="border border-slate-200 bg-slate-900 text-white p-6 space-y-4 font-mono text-xs rounded-xl shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="font-bold text-slate-100 uppercase tracking-wider text-xs">HPLC Trace &amp; Peak Area Log</span>
                  <span className="text-[10px] text-sky-400 font-bold bg-sky-950/60 border border-sky-500/40 px-2.5 py-0.5 rounded-md uppercase">
                    PASS ≥99.0%
                  </span>
                </div>

                <div className="h-36 bg-slate-950 p-3 relative overflow-hidden flex flex-col justify-between rounded-lg border border-slate-800">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>mAU @ 214nm</span>
                    <span>Retention Time: 14.82 min</span>
                  </div>
                  <svg className="w-full h-20 text-[#38BDF8]" viewBox="0 0 300 80" fill="none">
                    <path
                      d="M0,75 L60,75 L90,74 L120,73 L140,70 L150,8 L160,70 L180,74 L240,75 L300,75"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    />
                  </svg>
                  <div className="flex justify-between text-[10px] text-slate-400 border-t border-slate-800 pt-1">
                    <span>0.00 min</span>
                    <span className="text-sky-400 font-bold">Main Peak Area: 99.58%</span>
                    <span>30.00 min</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[10px] pt-1">
                  <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                    <span className="text-slate-400 block uppercase text-[9px]">Solvent Gradient</span>
                    <span className="font-bold text-white">0.1% TFA in H2O / ACN</span>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                    <span className="text-slate-400 block uppercase text-[9px]">Column Type</span>
                    <span className="font-bold text-white">C18 4.6 × 250mm (5μm)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
