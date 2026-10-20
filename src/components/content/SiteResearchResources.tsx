import React from 'react';
import { AppLink } from '../ui/AppLink';
import { InternalResourceLink, resourceLinksForPath } from '../../lib/internal-linking';

interface SiteResearchResourcesProps {
  pathname: string;
  categoryPath?: string;
  title?: string;
  className?: string;
}

export const SiteResearchResources: React.FC<SiteResearchResourcesProps> = ({
  pathname,
  categoryPath,
  title = 'Research resources',
  className = '',
}) => {
  const links = resourceLinksForPath(pathname, categoryPath);

  const renderLink = (link: InternalResourceLink) => (
    <li key={link.href}>
      <AppLink href={link.href} className="text-[#4353FF] hover:underline">
        {link.label}
      </AppLink>
    </li>
  );

  return (
    <nav
      aria-label="Research resources"
      className={`rounded-xl border border-slate-200 bg-slate-50/80 p-5 text-sm text-slate-700 ${className}`}
    >
      <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900">{title}</h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">{links.map(renderLink)}</ul>
    </nav>
  );
};
