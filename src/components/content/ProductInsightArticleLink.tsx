import React from 'react';
import { BookOpen } from 'lucide-react';
import { AppLink } from '../ui/AppLink';
import { getInsightArticle } from '../../lib/insights';
import { insightArticlePathForProductSlug, insightSlugForProductSlug } from '../../lib/insight-product-links';

interface ProductInsightArticleLinkProps {
  productSlug: string;
  className?: string;
}

export const ProductInsightArticleLink: React.FC<ProductInsightArticleLinkProps> = ({
  productSlug,
  className = '',
}) => {
  const href = insightArticlePathForProductSlug(productSlug);
  if (!href) return null;

  const articleSlug = insightSlugForProductSlug(productSlug);
  const article = articleSlug ? getInsightArticle(articleSlug) : undefined;
  if (!article) return null;

  return (
    <div
      className={`rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-sm text-slate-700 ${className}`}
    >
      <div className="flex items-start gap-2">
        <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-[#4353FF]" aria-hidden="true" />
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#4353FF]">Lab Insights</p>
          <AppLink href={href} className="mt-1 block font-semibold text-slate-900 hover:text-[#4353FF]">
            {article.title}
          </AppLink>
          {article.subtitle ? (
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{article.subtitle}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
};
