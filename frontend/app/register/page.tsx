'use client';

import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function RegisterRedirectPage() {
  const { register } = useAuth();

  useEffect(() => {
    register();
  }, [register]);

  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center space-y-3">
      <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-xs font-semibold text-zinc-600">
        Redirecting to Keycloak Registration...
      </p>
    </div>
  );
}
