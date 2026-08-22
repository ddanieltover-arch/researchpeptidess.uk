/**
 * Research Peptides UK — Dynamic SEO & Head Tags Component
 *
 * Injects document title, meta descriptions, canonical link, OpenGraph tags,
 * and Schema.org JSON-LD structured data into the browser DOM.
 */

import React, { useEffect } from 'react';
import { SeoMetadata } from '../../lib/seo';

interface MetaTagsProps {
  seo: SeoMetadata;
}

export const MetaTags: React.FC<MetaTagsProps> = ({ seo }) => {
  useEffect(() => {
    // 1. Update Document Title
    document.title = seo.title;

    // 2. Helper to set or create meta tag
    const setMetaTag = (attr: string, key: string, content: string) => {
      let element = document.querySelector(`meta[${attr}="${key}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, key);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 3. Update Standard Meta Tags
    setMetaTag('name', 'description', seo.description);
    setMetaTag('name', 'robots', seo.robots);

    // 4. Update OpenGraph Tags
    setMetaTag('property', 'og:title', seo.ogTitle || seo.title);
    setMetaTag('property', 'og:description', seo.ogDescription || seo.description);
    setMetaTag('property', 'og:url', seo.canonicalUrl);
    setMetaTag('property', 'og:type', seo.ogType);
    if (seo.ogImage) {
      setMetaTag('property', 'og:image', seo.ogImage);
    }

    // 5. Update Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', seo.ogTitle || seo.title);
    setMetaTag('name', 'twitter:description', seo.ogDescription || seo.description);
    if (seo.ogImage) {
      setMetaTag('name', 'twitter:image', seo.ogImage);
    }

    // 6. Update Canonical Link
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', seo.canonicalUrl);

    // 7. Inject Structured Data (JSON-LD)
    const existingJsonLd = document.querySelectorAll('script[type="application/ld+json"]');
    existingJsonLd.forEach((el) => el.remove());

    if (seo.jsonLd && seo.jsonLd.length > 0) {
      seo.jsonLd.forEach((data) => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify(data);
        document.head.appendChild(script);
      });
    }
  }, [seo]);

  return null;
};
