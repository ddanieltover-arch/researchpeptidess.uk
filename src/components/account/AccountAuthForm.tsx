import React, { useState } from 'react';
import { Building2, Lock, Mail, User } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { ACCOUNT_HOME_PATH } from '../../lib/customer-session';
import { toRenderableText } from '../../lib/react-text';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

type Mode = 'signin' | 'register';

export const AccountAuthForm: React.FC = () => {
  const { signInCustomer, registerCustomer, navigate } = useStore();
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [institution, setInstitution] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result =
        mode === 'register'
          ? await registerCustomer({ name, email, password, institution })
          : await signInCustomer(email, password);
      if (!('user' in result)) {
        setError(toRenderableText(result.error) || (mode === 'register' ? 'Unable to create this account.' : 'Invalid email or password.'));
        return;
      }
      navigate(ACCOUNT_HOME_PATH, { replace: true });
    } catch {
      setError(mode === 'register' ? 'Unable to create this account.' : 'Unable to sign in right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => {
            setMode('signin');
            setError('');
          }}
          className={`flex-1 rounded-md px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider ${
            mode === 'signin' ? 'bg-white text-[#4353FF] shadow-xs' : 'text-slate-500'
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('register');
            setError('');
          }}
          className={`flex-1 rounded-md px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider ${
            mode === 'register' ? 'bg-white text-[#4353FF] shadow-xs' : 'text-slate-500'
          }`}
        >
          Create account
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {mode === 'register' && (
          <>
            <Input
              id="account-name"
              label="Full name"
              type="text"
              name="name"
              autoComplete="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              startIcon={<User className="h-4 w-4" />}
            />
            <Input
              id="account-institution"
              label="Institution (optional)"
              type="text"
              name="organization"
              autoComplete="organization"
              value={institution}
              onChange={(event) => setInstitution(event.target.value)}
              startIcon={<Building2 className="h-4 w-4" />}
            />
          </>
        )}
        <Input
          id="account-email"
          label="Email"
          type="email"
          name="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          startIcon={<Mail className="h-4 w-4" />}
        />
        <Input
          id="account-password"
          label="Password"
          type="password"
          name="password"
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          required
          minLength={mode === 'register' ? 8 : undefined}
          helperText={mode === 'register' ? 'At least 8 characters.' : undefined}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          startIcon={<Lock className="h-4 w-4" />}
        />
        {error && (
          <p role="alert" className="text-sm font-medium text-rose-700">
            {error}
          </p>
        )}
        <Button type="submit" variant="brand" className="w-full" isLoading={submitting}>
          {mode === 'register' ? 'Create account' : 'Sign in'}
        </Button>
      </form>
    </div>
  );
};
