import React from 'react';
import { SiteResearchResources } from './SiteResearchResources';
import { RegulatoryExternalReferences } from './RegulatoryExternalReferences';

const GEO_RESOURCE_SLUGS = new Set([
  'quality',
  'shipping',
  'research-use',
  'faq',
  'research',
  'about',
  'contact',
]);

export const CmsGeoCatalogueLinks: React.FC<{ slug: string }> = ({ slug }) => {
  if (!GEO_RESOURCE_SLUGS.has(slug)) {
    return null;
  }

  return (
    <div className="space-y-4">
      <SiteResearchResources pathname={`/${slug}`} />
      {slug === 'research' || slug === 'research-use' || slug === 'quality' ? (
        <RegulatoryExternalReferences />
      ) : null}
    </div>
  );
};
