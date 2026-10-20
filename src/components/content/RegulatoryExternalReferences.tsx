import React from 'react';
import { REGULATORY_EXTERNAL_REFERENCES } from '../../lib/internal-linking';

export const RegulatoryExternalReferences: React.FC = () => {
  return (
    <section
      aria-label="Regulatory reference links"
      className="rounded-xl border border-stone-200 bg-stone-50 p-5 text-sm text-stone-700"
    >
      <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-stone-900">
        Regulatory context (external)
      </h2>
      <p className="mt-2 text-xs leading-relaxed text-stone-600">
        These official sources describe how medicines and hazardous laboratory substances are regulated in the UK.
        They are provided for researcher orientation only and do not imply regulatory approval of catalogue items.
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5">
        {REGULATORY_EXTERNAL_REFERENCES.map((ref) => (
          <li key={ref.href}>
            <a
              href={ref.href}
              rel="noopener noreferrer"
              className="font-medium text-[#4353FF] hover:underline"
            >
              {ref.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
};
