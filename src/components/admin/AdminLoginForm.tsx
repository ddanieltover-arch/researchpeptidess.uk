import React, { useState } from 'react';
import { Lock, Mail } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { ADMIN_HOME_PATH } from '../../lib/admin-session';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export const AdminLoginForm: React.FC = () => {
  const { signInAdmin, navigate } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await signInAdmin(email, password);
      if ('error' in result) {
        setError(result.error);
        return;
      }
      navigate(ADMIN_HOME_PATH, { replace: true });
    } catch {
      setError('Unable to sign in right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Input
        id="admin-email"
        label="Admin email"
        type="email"
        name="email"
        autoComplete="username"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        startIcon={<Mail className="h-4 w-4" />}
      />
      <Input
        id="admin-password"
        label="Password"
        type="password"
        name="password"
        autoComplete="current-password"
        required
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
        Sign in
      </Button>
    </form>
  );
};
