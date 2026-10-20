import React from 'react';
import { AppLink } from '../ui/AppLink';
import { insightPath, ROUTES } from '../../lib/routing';
import { listPublishedInsights } from '../../lib/insights';

interface InsightRelatedReadingProps {
  currentSlug: string;
  maxItems?: number;
}

export const InsightRelatedReading: React.FC<InsightRelatedReadingProps> = ({
  currentSlug,
  maxItems = 3,
}) => {
  const related = listPublishedInsights()
    .filter((post) => post.slug !== currentSlug)
    .slice(0, maxItems);

  if (related.length === 0) return null;

  return (
    <nav
      aria-label="Related Lab Insights"
      className="rounded-xl border border-stone-200 bg-white p-5 text-sm shadow-sm"
    >
      <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900">Related reading</h2>
      <ul className="mt-3 space-y-2">
        {related.map((post) => (
          <li key={post.id}>
            <AppLink href={insightPath(post.slug)} className="font-medium text-[#4353FF] hover:underline">
              {post.title}
            </AppLink>
          </li>
        ))}
      </ul>
      <AppLink
        href={ROUTES.insights}
        className="mt-4 inline-block font-mono text-[11px] font-bold uppercase tracking-wider text-slate-600 hover:text-[#4353FF]"
      >
        All Lab Insights →
      </AppLink>
    </nav>
  );
};
