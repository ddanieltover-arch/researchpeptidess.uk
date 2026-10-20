import { CMSPage } from '../types';
import { INSIGHT_ARTICLES } from './cms-insights-posts';

export function listPublishedInsights(): CMSPage[] {
  return INSIGHT_ARTICLES
    .filter((page) => page.isPublished)
    .sort((a, b) => (b.publishedAt || b.lastUpdated).localeCompare(a.publishedAt || a.lastUpdated));
}

export function getInsightArticle(slug: string): CMSPage | undefined {
  return INSIGHT_ARTICLES.find((page) => page.slug === slug && page.isPublished);
}

export function insightArticlePaths(): string[] {
  return listPublishedInsights().map((page) => `/insights/${page.slug}`);
}
