import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { BrandLogo } from '../components/ui/BrandLogo';
import { AdminLoginForm } from '../components/admin/AdminLoginForm';

export const AdminLoginPage: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-stone-100 text-slate-900">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <div className="mb-8 flex justify-center">
          <BrandLogo variant="light" size="md" />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 space-y-2">
            <p className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#4353FF]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">Laboratory console sign in</h1>
            <p className="text-sm text-slate-600">
              Access is limited to authorised Research Peptides UK operators.
            </p>
          </div>
          <AdminLoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">
          Strictly in-vitro laboratory supply. Not for human or veterinary use.
        </p>
      </div>
    </div>
  );
};

export const AdminSessionLoading: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100">
      <p className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500">
        Checking admin session…
      </p>
    </div>
  );
};
