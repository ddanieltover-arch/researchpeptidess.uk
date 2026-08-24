import React, { useState } from 'react';
import { Product } from '../../types';
import { Badge } from '../ui/Badge';
import { getDocumentationPresentation } from '../../lib/product-display';
import { FileCheck, AlertTriangle } from 'lucide-react';

interface BatchDocumentationPanelProps {
  product: Product;
}

export const BatchDocumentationPanel: React.FC<BatchDocumentationPanelProps> = ({ product }) => {
  const presentation = getDocumentationPresentation(product);
  const batches = product.batches || [];
  const documents = product.documents || [];
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || '');
  const activeBatch = batches.find((batch) => batch.id === selectedBatchId) || batches[0];

  const toneVariant =
    presentation.tone === 'available' ? 'success' : presentation.tone === 'pending' ? 'warning' : presentation.tone === 'demo' ? 'brand' : 'neutral';

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-slate-500">Batch documentation</p>
          <p className="mt-1 text-sm font-bold text-slate-900">{presentation.label}</p>
        </div>
        <Badge variant={toneVariant} size="sm">
          {presentation.tone}
        </Badge>
      </div>

      {presentation.tone === 'demo' && (
        <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-950">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Demonstration files may be shown for interface testing. They are not a certified analytical record.</p>
        </div>
      )}

      {batches.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {batches.map((batch) => (
            <button
              key={batch.id}
              type="button"
              onClick={() => setSelectedBatchId(batch.id)}
              className={`rounded-md border px-3 py-1.5 ${
                activeBatch?.id === batch.id
                  ? 'border-[#4353FF] bg-[#4353FF] text-white'
                  : 'border-slate-300 bg-white text-slate-700'
              }`}
            >
              {batch.batchNumber}
            </button>
          ))}
        </div>
      )}

      {activeBatch ? (
        <dl className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <dt className="text-[10px] uppercase text-slate-500">Batch number</dt>
            <dd className="mt-1 font-bold text-slate-900">{activeBatch.batchNumber}</dd>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <dt className="text-[10px] uppercase text-slate-500">Document status</dt>
            <dd className="mt-1 font-bold text-slate-900">{activeBatch.status}</dd>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <dt className="text-[10px] uppercase text-slate-500">Test / document date</dt>
            <dd className="mt-1 font-bold text-slate-900">{activeBatch.testDate || 'Not recorded'}</dd>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <dt className="text-[10px] uppercase text-slate-500">Documented purity</dt>
            <dd className="mt-1 font-bold text-slate-900">
              {activeBatch.purityValue ? `${activeBatch.purityValue}%` : 'Not recorded'}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="text-slate-600">No batch records are attached to this product.</p>
      )}

      {documents.length > 0 ? (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-emerald-600" />
                <div>
                  <p className="font-bold text-slate-900">{doc.title}</p>
                  <p className="text-[10px] text-slate-500">
                    {doc.documentType}
                    {doc.batchNumber ? ` · ${doc.batchNumber}` : ''}
                    {doc.testDate ? ` · ${doc.testDate}` : ''}
                  </p>
                </div>
              </div>
              {doc.fileUrl ? (
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-slate-300 px-3 py-1 text-[11px] font-bold uppercase text-slate-800 hover:bg-slate-50"
                >
                  View / download
                </a>
              ) : (
                <span className="text-[11px] text-slate-400">File not attached</span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-600">
          {presentation.tone === 'pending'
            ? 'Documentation is marked pending. Files will appear here when a record is uploaded.'
            : 'No COA or laboratory file is available for this listing.'}
        </p>
      )}
    </div>
  );
};
