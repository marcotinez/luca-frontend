import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  me as apiMe,
  login as apiLogin,
  register as apiRegister,
  refreshToken as apiRefreshToken,
  updatePassword as apiUpdatePassword
} from '@/lib/auth.api';
import { UserResponse, LoginRequest, RegisterRequest, UpdatePasswordRequest } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Función para iniciar sesión
  const login = async (credentials: LoginRequest) => {
    const response = await apiLogin(credentials);
    localStorage.setItem('token', response.access_token);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
  };

  // Función para registrarse
  const register = async (data: RegisterRequest) => {
    const response = await apiRegister(data);
    localStorage.setItem('token', response.access_token);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
  };

  // Función para actualizar la contraseña
  const updatePassword = async (data: UpdatePasswordRequest) => {
    const response = await apiUpdatePassword(data);
    if (response.access_token) localStorage.setItem('token', response.access_token);

    await refreshUser();
  };

  const refreshUser = useCallback(async () => {
    const userData = await apiMe();
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  // Función para cerrar sesión
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  }, [router]);

  // Verificar si hay sesión al cargar
  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        // Intentamos obtener el usuario
        await refreshUser();
        setLoading(false);
      } catch {
        // Si no hay sesión, limpiamos y redirigimos al login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    validateSession();
  }, [refreshUser]);

  // Renovar el token automaticamente cada X minutos
  useEffect(() => {
    if(!user) return;
    const refreshIntervalMinutes = Number(process.env.NEXT_PUBLIC_TOKEN_REFRESH_INTERVAL_MINUTES) || 29;
    const refreshInterval = refreshIntervalMinutes * 60 * 1000;

    const interval = setInterval( async () => {
      try {
        console.log('Renovando token...');
        const response = await apiRefreshToken();
        localStorage.setItem('token', response.access_token);
      } catch (error) {
        console.log('Error al renovar el token', error);
        logout();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [user, logout]);

  return { user, login, register, logout, loading, updatePassword, refreshUser };
}
