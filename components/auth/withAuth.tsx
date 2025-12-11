'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { User } from '@/types';

export default function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requireSuperUser: boolean = false
) {
  return function WithAuth(props: P) {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
      if (!loading && !user) {
        router.push('/login');
      } else if (!loading && user && requireSuperUser && !user.is_superuser) {
        router.push('/dashboard');
      }
    }, [user, loading, router]);

    if (loading) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-lg font-medium">Cargando...</div>
        </div>
      );
    }

    if (!user) {
      return null;
    }

    if (requireSuperUser && !user.is_superuser) {
      return null;
    }

    return <WrappedComponent {...props} user={user} />;
  };
}
