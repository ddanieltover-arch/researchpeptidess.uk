import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { AccountAuthForm } from '../components/account/AccountAuthForm';

export const AccountLoginPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 space-y-2">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#4353FF]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Customer account
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Sign in to continue</h1>
          <p className="text-sm text-slate-600">
            Order history, saved compounds, and facility details are only available after you sign in.
          </p>
        </div>
        <AccountAuthForm />
      </div>
    </div>
  );
};
