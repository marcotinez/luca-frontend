import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  me as apiMe,
  login as apiLogin,
  register as apiRegister,
  refreshToken as apiRefreshToken,
  updatePassword as apiUpdatePassword
} from '@/lib/auth.api';
import { clearStoredSession, getStoredToken, getStoredUser, setStoredToken, setStoredUser } from '@/lib/auth-session.storage';
import { UserResponse, LoginRequest, RegisterRequest, UpdatePasswordRequest } from '@/types';

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

export function useAuth() {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Función para iniciar sesión
  const login = async (credentials: LoginRequest) => {
    const response = await apiLogin(credentials);
    setStoredToken(response.access_token);
    setStoredUser(response.user);
    setUser(response.user);
    setLoading(false);
  };

  // Función para registrarse
  const register = async (data: RegisterRequest) => {
    const response = await apiRegister(data);
    setStoredToken(response.access_token);
    setStoredUser(response.user);
    setUser(response.user);
    setLoading(false);
  };

  // Función para actualizar la contraseña
  const updatePassword = async (data: UpdatePasswordRequest) => {
    const response = await apiUpdatePassword(data);
    if (response.access_token) setStoredToken(response.access_token);

    await refreshUser();
  };

  const refreshUser = useCallback(async () => {
    const userData = await apiMe();
    setStoredUser(userData);
    setUser(userData);
    setLoading(false);
  }, []);

  // Función para cerrar sesión
  const logout = useCallback(() => {
    setUser(null);
    clearStoredSession();
    router.push('/login');
  }, [router]);

  // Verificar si hay sesión al cargar
  useEffect(() => {
    const validateSession = async () => {
      const storedUser = getStoredUser();
      setLoading(true);
      const token = getStoredToken();
      if (!token) {
        setLoading(false);
        return;
      }

      if (storedUser) {
        setUser(storedUser as UserResponse);
      }
      try {
        // Intentamos obtener el usuario
        await refreshUser();
        setLoading(false);
      } catch {
        // Si no hay sesión, limpiamos y redirigimos al login
        clearStoredSession();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    validateSession();
  }, [refreshUser]);

  // Renovar token de forma proactiva: antes de expirar y también por intervalo fijo.
  useEffect(() => {
    if (!user) return;

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
  }, [user, logout]);

  return { user, login, register, logout, loading, updatePassword, refreshUser };
}
