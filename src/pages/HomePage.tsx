import React from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ui/ProductCard';
import { AppLink } from '../components/ui/AppLink';
import { NewsletterSignup } from '../components/content/NewsletterSignup';
import { RecentlyViewedRail } from '../components/catalogue/RecentlyViewedRail';
import { isListedShopCategory } from '../lib/catalogue-collections';
import { categoryPath, ROUTES } from '../lib/routing';
import {
  getBestsellerEntries,
  getFeaturedProducts,
  getNewArrivalProducts,
  getBackInStockProducts,
} from '../lib/merchandising';
import { FileCheck2, FlaskConical, ShieldCheck } from 'lucide-react';
import { HeroFeaturedProduct } from '../components/home/HeroFeaturedProduct';
import { HeroIntro } from '../components/home/HeroIntro';
import { HeroTrustBar } from '../components/home/HeroTrustBar';
import { HomeProofSection } from '../components/home/HomeProofSection';
import { HomeBuyPeptidesKeywords } from '../components/home/HomeBuyPeptidesKeywords';

export const HomePage: React.FC = () => {
  const { publishedProducts, categories, orders, inventoryTransactions, storeSettings } = useStore();
  const bestsellers = getBestsellerEntries(publishedProducts, orders, 4);
  const featured = getFeaturedProducts(publishedProducts, 4);
  const newArrivals = getNewArrivalProducts(publishedProducts, Date.now(), 4);
  const restocked = getBackInStockProducts(publishedProducts, inventoryTransactions, Date.now(), 4);
  const discoveryCategories = categories.filter(isListedShopCategory);
  const heroProduct =
    publishedProducts.find((product) => product.slug === 'tesamorelin') ||
    featured[0] ||
    bestsellers[0]?.product;
  const heroIsBestseller = Boolean(heroProduct && bestsellers.some((entry) => entry.product.id === heroProduct.id));

  return (
    <div className="space-y-12 bg-slate-50 pb-16 sm:space-y-16">
      <section className="relative border-b border-slate-200 bg-[#F7F8FC] py-16 sm:py-24">
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden opacity-50"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.28) 1px, transparent 0)',
            backgroundSize: '22px 22px',
          }}
        />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-8 lg:px-10">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
            <HeroIntro />
            {heroProduct && (
              <div className="flex justify-center px-4 pt-6 pb-4 sm:px-8 lg:justify-end lg:pt-8 lg:pb-6">
                <HeroFeaturedProduct product={heroProduct} isBestseller={heroIsBestseller} />
              </div>
            )}
          </div>
          <HeroTrustBar />
          <HomeProofSection />
        </div>
      </section>

      {bestsellers.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
          <div className="mb-8 flex items-end justify-between border-b border-slate-200 pb-4">
            <div>
              <span className="mb-1 block font-mono text-xs font-bold tracking-widest text-[#4353FF] uppercase">
                From completed orders
              </span>
              <h2 className="font-mono text-xl font-bold text-slate-900 sm:text-2xl">Bestsellers</h2>
            </div>
            <AppLink href={ROUTES.shop} className="font-mono text-xs font-bold tracking-wider text-[#4353FF] uppercase">
              Shop catalogue →
            </AppLink>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {bestsellers.map((entry) => (
              <ProductCard key={entry.product.id} product={entry.product} />
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
          <div className="mb-8 flex items-end justify-between border-b border-slate-200 pb-4">
            <div>
              <span className="mb-1 block font-mono text-xs font-bold tracking-widest text-[#4353FF] uppercase">
                Admin merchandising
              </span>
              <h2 className="font-mono text-xl font-bold text-slate-900 sm:text-2xl">Featured catalogue</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {newArrivals.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
          <h2 className="mb-6 font-mono text-xl font-bold text-slate-900">New arrivals</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {restocked.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
          <h2 className="mb-6 font-mono text-xl font-bold text-slate-900">Back in stock</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {restocked.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      <section className="border-y border-slate-200 bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-7">
              <span className="block font-mono text-xs font-bold tracking-widest text-[#4353FF] uppercase">
                Quality &amp; documentation
              </span>
              <h2 className="font-mono text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Batch records are a storefront feature, not a slogan
              </h2>
              <p className="text-sm leading-relaxed text-slate-600">
                Listings can carry batch numbers, document type, test dates, and file access when those records exist.
                If a document is pending, unavailable, or demonstration-only, that state is shown instead of a generic
                purity claim.
              </p>
              <AppLink
                href="/quality"
                className="inline-flex items-center gap-2 rounded-lg border border-[#4353FF] bg-[#4353FF] px-5 py-2.5 font-mono text-xs font-bold text-white uppercase"
              >
                <FileCheck2 className="h-4 w-4" />
                Read the quality approach
              </AppLink>
            </div>
            <div className="grid gap-3 lg:col-span-5">
              {[
                { icon: ShieldCheck, title: 'Traceability', copy: 'Batch identifiers stay attached to the product record when uploaded.' },
                { icon: FileCheck2, title: 'COA access', copy: 'Available files can be viewed or downloaded from the product page.' },
                { icon: FlaskConical, title: 'Document states', copy: 'Available, pending, unavailable, and demo are distinct statuses.' },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-1 flex items-center gap-2 font-mono text-xs font-bold text-slate-900 uppercase">
                    <item.icon className="h-4 w-4 text-[#4353FF]" />
                    {item.title}
                  </div>
                  <p className="text-xs text-slate-600">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
        <h2 className="mb-6 font-mono text-xl font-bold text-slate-900">Why this catalogue</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-mono text-sm font-bold text-slate-900">Research-only supply</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Purchasers confirm in-vitro laboratory use. The storefront does not provide dosing or administration advice.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-mono text-sm font-bold text-slate-900">Documented where recorded</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              HPLC values, COAs, and certificates appear only from product and batch records.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-mono text-sm font-bold text-slate-900">Configured shipping</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Destination, method, price, window, and tracking come from the shipping engine at checkout.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
        <div className="mb-6 flex items-end justify-between border-b border-slate-200 pb-4">
          <div>
            <span className="mb-1 block font-mono text-xs font-bold tracking-widest text-[#4353FF] uppercase">
              Browse by category
            </span>
            <h2 className="font-mono text-xl font-bold text-slate-900 sm:text-2xl">Catalogue collections</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {discoveryCategories.map((cat) => (
            <AppLink
              key={cat.id}
              href={categoryPath(cat.slug)}
              className="group space-y-3 rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-[#4353FF] hover:shadow-lg"
            >
              <span className="inline-flex rounded-md border border-blue-200 bg-blue-50 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#4353FF] uppercase">
                {cat.productCount ?? 0} published
              </span>
              <h3 className="font-mono text-sm font-bold text-slate-900 group-hover:text-[#4353FF]">{cat.name}</h3>
              <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">{cat.description}</p>
              <span className="inline-flex font-mono text-[11px] font-bold tracking-wider text-[#4353FF] uppercase">
                View collection
              </span>
            </AppLink>
          ))}
        </div>
      </section>

      <HomeBuyPeptidesKeywords />

      <section className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
        <div className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 md:grid-cols-2">
          <div>
            <h2 className="font-mono text-lg font-bold text-slate-900">Research account</h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              A customer account already provides order history, saved compounds, and checkout of quantity pricing shown
              on product pages. This is not a paid membership and does not claim exclusive catalogue prices.
            </p>
            <AppLink href={ROUTES.account} className="mt-4 inline-flex font-mono text-xs font-bold text-[#4353FF] uppercase">
              Open account →
            </AppLink>
          </div>
          <div>
            <h2 className="font-mono text-lg font-bold text-slate-900">How purchasing works</h2>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-slate-600">
              <li>Choose a category or search the catalogue.</li>
              <li>Select a format, quantity, and add it to the cart.</li>
              <li>Check out as a guest or with an account. Cryptocurrency is available on every order; bank transfer is available from £100.</li>
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
          <NewsletterSignup />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
        <div className="flex items-end justify-between">
          <h2 className="font-mono text-xl font-bold text-slate-900">Support</h2>
          <AppLink href="/faq" className="font-mono text-xs font-bold text-[#4353FF] uppercase">
            FAQ →
          </AppLink>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <AppLink href="/faq" className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
            <h3 className="font-mono text-sm font-bold text-slate-900">FAQ</h3>
            <p className="mt-1">Ordering, payments, and research-use questions.</p>
          </AppLink>
          <AppLink href="/contact" className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
            <h3 className="font-mono text-sm font-bold text-slate-900">Contact</h3>
            <p className="mt-1">Email {storeSettings.supportEmail} or use the contact form.</p>
          </AppLink>
          <AppLink href="/shipping" className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
            <h3 className="font-mono text-sm font-bold text-slate-900">Shipping</h3>
            <p className="mt-1">Configured destinations, prices, and tracking.</p>
          </AppLink>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
        <RecentlyViewedRail products={publishedProducts} />
      </section>
    </div>
  );
};
