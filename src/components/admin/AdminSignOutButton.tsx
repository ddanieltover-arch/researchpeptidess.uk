import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Button } from '../ui/Button';

interface AdminSignOutButtonProps {
  className?: string;
}

export const AdminSignOutButton: React.FC<AdminSignOutButtonProps> = ({ className }) => {
  const { signOutAdmin, navigate } = useStore();
  const [busy, setBusy] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      isLoading={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await signOutAdmin();
          navigate('/admin/login', { replace: true });
        } finally {
          setBusy(false);
        }
      }}
    >
      <LogOut className="h-3.5 w-3.5" />
      Sign out
    </Button>
  );
};
