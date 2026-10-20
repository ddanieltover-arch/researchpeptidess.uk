import React from 'react';

interface GeoQuickAnswerProps {
  /** Plain-text capsule (no HTML). */
  text: string;
  className?: string;
}

/**
 * Answer capsule for GEO / AI Overviews — `section#answer` per SEO_GEO_Master_Prompt §5.1.
 */
export const GeoQuickAnswer: React.FC<GeoQuickAnswerProps> = ({ text, className = '' }) => {
  if (!text.trim()) return null;

  return (
    <section
      id="answer"
      aria-label="Quick Answer"
      className={`rounded-xl border border-slate-200/90 bg-slate-100/80 px-4 py-3.5 text-sm leading-relaxed text-slate-600 sm:px-5 sm:py-4 ${className}`}
    >
      <p>
        <strong className="font-semibold text-slate-800">Quick Answer:</strong>{' '}
        {text}
      </p>
    </section>
  );
};
