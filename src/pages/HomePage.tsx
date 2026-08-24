import React from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ui/ProductCard';
import { AppLink } from '../components/ui/AppLink';
import { NewsletterSignup } from '../components/content/NewsletterSignup';
import { RecentlyViewedRail } from '../components/catalogue/RecentlyViewedRail';
import { categoryPath, ROUTES } from '../lib/routing';
import { getStorefrontTrustMetrics } from '../lib/trust-metrics';
import {
  getBestsellerEntries,
  getFeaturedProducts,
  getNewArrivalProducts,
  getBackInStockProducts,
} from '../lib/merchandising';
import { FileCheck2, FlaskConical, ShieldCheck } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { publishedProducts, categories, orders, inventoryTransactions, shippingMethods, storeSettings } = useStore();
  const metrics = getStorefrontTrustMetrics(publishedProducts, categories, shippingMethods);
  const bestsellers = getBestsellerEntries(publishedProducts, orders, 4);
  const featured = getFeaturedProducts(publishedProducts, 4);
  const newArrivals = getNewArrivalProducts(publishedProducts, Date.now(), 4);
  const restocked = getBackInStockProducts(publishedProducts, inventoryTransactions, Date.now(), 4);
  const discoveryCategories = categories.filter((category) => category.isActive);

  return (
    <div className="space-y-12 bg-slate-50 pb-16 sm:space-y-16">
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-blue-50/50 via-slate-50 to-slate-50 py-14 sm:py-20">
        <div className="pointer-events-none absolute top-0 right-0 flex h-full w-1/2 items-center justify-center opacity-10">
          <div className="h-80 w-80 rounded-full border-[24px] border-[#4353FF]" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white px-3 py-1 font-mono text-xs font-bold tracking-wider text-[#4353FF] uppercase shadow-xs">
              <span className="h-2 w-2 rounded-full bg-[#4353FF]" />
              UK laboratory catalogue
            </div>
            <h1 className="mb-4 font-mono text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Research peptides and biochemical reagents for <span className="text-[#4353FF]">in-vitro work</span>
            </h1>
            <p className="mb-6 max-w-lg text-sm leading-relaxed text-slate-600 sm:text-base">
              Research Peptides UK supplies published catalogue items to laboratories and qualified research purchasers.
              Documentation is shown only when a batch record exists. Products are not for human or veterinary use.
            </p>
            <div className="flex flex-wrap gap-4 pt-1">
              <AppLink
                href={ROUTES.peptides}
                className="inline-flex items-center justify-center rounded-lg border border-[#4353FF] bg-[#4353FF] px-8 py-3.5 font-mono text-xs font-bold tracking-wider text-white uppercase shadow-md shadow-blue-500/20 hover:bg-[#3846E0]"
              >
                Browse peptides
              </AppLink>
              <AppLink
                href="/quality"
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-transparent px-8 py-3.5 font-mono text-xs font-bold tracking-wider text-slate-800 uppercase hover:border-[#4353FF] hover:bg-blue-50 hover:text-[#4353FF]"
              >
                Documentation &amp; quality
              </AppLink>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { value: String(metrics.publishedProductCount), label: 'Published catalogue items' },
            { value: String(metrics.documentedProductCount), label: 'Listings with documentation records' },
            { value: String(metrics.activeCategoryCount), label: 'Active catalogue categories' },
            { value: String(metrics.fulfilmentRegionCount), label: 'Configured fulfilment zones' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="font-mono text-2xl font-extrabold text-slate-900">{item.value}</p>
              <p className="mt-1 text-[11px] font-medium tracking-wide text-slate-500 uppercase">{item.label}</p>
            </div>
          ))}
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {newArrivals.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
          <h2 className="mb-6 font-mono text-xl font-bold text-slate-900">New arrivals</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {restocked.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
          <h2 className="mb-6 font-mono text-xl font-bold text-slate-900">Back in stock</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
              <li>Check out as a guest or with an account using bank transfer or cryptocurrency.</li>
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
