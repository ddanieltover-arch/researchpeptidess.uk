import React from 'react';
import { FileText, FlaskConical, ShieldAlert } from 'lucide-react';
import { Product } from '../../types';
import { formatProductDisplayName, documentedPurityLabel } from '../../lib/product-display';
import {
  parseProductLongDescription,
  narrativeLeadParagraph,
  DescriptionSection,
} from '../../lib/product-description-template';
import { Badge } from '../ui/Badge';

interface ProductSpecificationDocumentProps {
  product: Product;
}

function SectionBlock({ section }: { section: DescriptionSection }) {
  const isDisclaimer = section.variant === 'disclaimer';
  const isReferences = section.variant === 'references';

  return (
    <section
      aria-labelledby={`pdp-section-${section.id}`}
      className={
        isDisclaimer
          ? 'rounded-xl border border-amber-200 bg-amber-50/80 p-5 text-amber-950'
          : isReferences
            ? 'rounded-xl border border-slate-200 bg-slate-50/90 p-5'
            : 'space-y-3'
      }
    >
      <h3
        id={`pdp-section-${section.id}`}
        className={
          isDisclaimer
            ? 'flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-amber-900 font-mono'
            : 'border-l-4 border-[#4353FF] pl-3 text-base font-semibold text-slate-900'
        }
      >
        {isDisclaimer ? <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
        {section.title}
      </h3>

      {section.paragraphs.map((paragraph) => (
        <p
          key={paragraph.slice(0, 48)}
          className={`text-sm leading-relaxed ${
            isDisclaimer ? 'text-amber-950/90' : 'text-slate-600'
          }`}
        >
          {paragraph}
        </p>
      ))}

      {section.keyValues.length > 0 ? (
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          {section.keyValues.map((row) => (
            <div
              key={row.label}
              className="rounded-lg border border-slate-200/90 bg-white px-3 py-2.5 shadow-xs"
            >
              <dt className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {row.label}
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-slate-900">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {section.bullets.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600">
          {section.bullets.map((item) => (
            <li key={item.slice(0, 40)}>{item}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export const ProductSpecificationDocument: React.FC<ProductSpecificationDocumentProps> = ({
  product,
}) => {
  const displayName = formatProductDisplayName(product.name);
  const purity = documentedPurityLabel(product);
  const sections = parseProductLongDescription(product.longDescription || product.shortDescription, product);
  const lead = narrativeLeadParagraph(sections);

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 bg-linear-to-br from-slate-50 via-white to-blue-50/40 px-5 py-6 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#4353FF]">
                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                Laboratory specification
              </span>
              {purity ? (
                <Badge variant="brand" size="sm" className="font-mono text-[10px]">
                  {purity}
                </Badge>
              ) : null}
            </div>
            <h2 className="font-display text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
              {displayName}
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-600">{lead}</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
            <FlaskConical className="h-4 w-4 text-[#4353FF]" aria-hidden="true" />
            <span className="font-mono font-semibold text-slate-800">In-vitro research grade</span>
          </div>
        </div>
      </header>

      <div className="space-y-8 px-5 py-7 sm:px-8">
        {sections.map((section) => (
          <SectionBlock key={section.id} section={section} />
        ))}
      </div>
    </article>
  );
};
