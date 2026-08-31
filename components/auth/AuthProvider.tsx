'use client';

import { createContext, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  me as apiMe,
  login as apiLogin,
  register as apiRegister,
  refreshToken as apiRefreshToken,
  updatePassword as apiUpdatePassword,
} from '@/lib/auth.api';
import { clearStoredSession, getStoredToken, getStoredUser, setStoredToken, setStoredUser } from '@/lib/auth-session.storage';
import { UserResponse, LoginRequest, RegisterRequest, UpdatePasswordRequest } from '@/types';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export interface AuthContextValue {
  user: UserResponse | null;
  status: AuthStatus;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  updatePassword: (data: UpdatePasswordRequest) => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function getTokenExpMs(token: string | null): number | null {
  if (!token) return null;
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(atob(normalized));
    if (!json?.exp || typeof json.exp !== 'number') return null;
    return json.exp * 1000;
  } catch {
    return null;
  }
}

/** Única fuente de sesión de la app: un estado, una validación al arrancar, un temporizador de renovación. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    const userData = await apiMe();
    setStoredUser(userData);
    setUser(userData);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setStatus('anonymous');
    clearStoredSession();
    router.push('/login');
  }, [router]);

  const login = useCallback(async (credentials: LoginRequest) => {
    const response = await apiLogin(credentials);
    setStoredToken(response.access_token);
    setStoredUser(response.user);
    setUser(response.user);
    setStatus('authenticated');
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const response = await apiRegister(data);
    setStoredToken(response.access_token);
    setStoredUser(response.user);
    setUser(response.user);
    setStatus('authenticated');
  }, []);

  const updatePassword = useCallback(
    async (data: UpdatePasswordRequest) => {
      const response = await apiUpdatePassword(data);
      if (response.access_token) setStoredToken(response.access_token);
      await refreshUser();
    },
    [refreshUser],
  );

  // Validación única de la sesión al arrancar la app.
  useEffect(() => {
    let cancelled = false;

    const validateSession = async () => {
      const token = getStoredToken();
      if (!token) {
        if (!cancelled) setStatus('anonymous');
        return;
      }

      const storedUser = getStoredUser();
      if (storedUser && !cancelled) setUser(storedUser);

      try {
        await refreshUser();
      } catch {
        if (!cancelled) {
          clearStoredSession();
          setUser(null);
          setStatus('anonymous');
        }
      }
    };

    validateSession();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Renovación proactiva: un único temporizador para toda la app, se recalcula
  // a partir de la expiración del token y se cancela al cerrar sesión.
  useEffect(() => {
    if (status !== 'authenticated') return;

    const configuredMinutes = Number(process.env.NEXT_PUBLIC_TOKEN_REFRESH_INTERVAL_MINUTES) || 5;
    const configuredMs = Math.max(1, configuredMinutes) * 60 * 1000;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const scheduleNextRefresh = () => {
      if (cancelled) return;

      const token = getStoredToken();
      const expMs = getTokenExpMs(token);
      const now = Date.now();

      // Intentar refrescar ~1 minuto antes de expirar.
      const beforeExpiryMs = expMs ? Math.max(30_000, expMs - now - 60_000) : configuredMs;
      const nextInMs = Math.min(configuredMs, beforeExpiryMs);

      timeoutId = setTimeout(async () => {
        try {
          const response = await apiRefreshToken();
          setStoredToken(response.access_token);
          scheduleNextRefresh();
        } catch (error) {
          console.log('Error al renovar el token', error);
          logout();
        }
      }, nextInMs);
    };

    scheduleNextRefresh();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [status, logout]);

  return (
    <AuthContext.Provider value={{ user, status, login, register, logout, updatePassword, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
