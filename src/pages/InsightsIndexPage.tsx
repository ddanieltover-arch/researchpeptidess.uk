import React from 'react';
import { AppLink } from '../components/ui/AppLink';
import { ROUTES, insightPath } from '../lib/routing';
import { listPublishedInsights } from '../lib/insights';
import { getSeoMetadataForPath } from '../lib/seo';
import { MetaTags } from '../components/seo/MetaTags';
import { ChevronRight, BookOpen } from 'lucide-react';

export const InsightsIndexPage: React.FC = () => {
  const seo = getSeoMetadataForPath(ROUTES.insights);
  const posts = listPublishedInsights();

  return (
    <div className="min-h-screen bg-stone-50 py-10 px-4 sm:px-6 lg:px-8">
      <MetaTags seo={seo} />
      <div className="mx-auto max-w-4xl space-y-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-mono text-xs text-stone-500">
          <AppLink href={ROUTES.home} className="hover:text-stone-900">HOME</AppLink>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-semibold text-stone-900">Lab Insights</span>
        </nav>

        <header className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-2 font-mono text-xs font-bold tracking-widest text-[#4353FF] uppercase">
            <BookOpen className="h-4 w-4" />
            Editorial
          </div>
          <h1 className="mt-2 font-mono text-3xl font-extrabold text-slate-950">Lab Insights</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
            Research-oriented articles for UK laboratory buyers — catalogue context, documentation, and compliance.
            Not medical advice. For orders, use the{' '}
            <AppLink href={ROUTES.peptides} className="font-semibold text-[#4353FF] hover:underline">
              peptide catalogue
            </AppLink>
            .
          </p>
        </header>

        <ul className="space-y-4">
          {posts.map((post) => (
            <li key={post.id}>
              <AppLink
                href={insightPath(post.slug)}
                className="block rounded-xl border border-stone-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <time
                  dateTime={post.publishedAt || post.lastUpdated}
                  className="font-mono text-[11px] font-bold uppercase tracking-wider text-stone-500"
                >
                  {post.publishedAt || post.lastUpdated}
                </time>
                <h2 className="mt-2 font-mono text-lg font-bold text-slate-900">{post.title}</h2>
                {post.subtitle && <p className="mt-2 text-sm text-stone-600">{post.subtitle}</p>}
                <span className="mt-3 inline-block text-xs font-bold text-[#4353FF] uppercase tracking-wide">
                  Read article →
                </span>
              </AppLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
