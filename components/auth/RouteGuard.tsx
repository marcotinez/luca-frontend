'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

type RouteAccess = 'public' | 'authenticated' | 'superuser';

interface RouteGuardProps {
  /** `public`: solo para sesión anónima (login, registro). `authenticated`: cualquier sesión. `superuser`: además, admin. */
  access: RouteAccess;
  children: React.ReactNode;
}

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
    </div>
  );
}

/** Guarda de rutas única: no renderiza contenido hasta resolver la sesión, evitando el parpadeo. */
export function RouteGuard({ access, children }: RouteGuardProps) {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (access === 'public') {
      if (status === 'authenticated') router.push('/dashboard');
      return;
    }

    if (status === 'anonymous') {
      router.push('/login');
      return;
    }

    if (access === 'superuser' && !user?.is_superuser) {
      router.push('/inicio');
    }
  }, [access, status, user, router]);

  if (status === 'loading') {
    return <Spinner />;
  }

  if (access === 'public') {
    return status === 'authenticated' ? null : <>{children}</>;
  }

  if (status === 'anonymous') {
    return null;
  }

  if (access === 'superuser' && !user?.is_superuser) {
    return null;
  }

  return <>{children}</>;
}
