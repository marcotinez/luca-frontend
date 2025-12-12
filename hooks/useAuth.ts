import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login as apiLogin, register as apiRegister, me as apiMe } from '@/lib/auth.api';
import { UserResponse, LoginRequest, RegisterRequest } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Función para iniciar sesión
  const login = async (credentials: LoginRequest) => {
    const response = await apiLogin(credentials);

    // Guardamos token y user en localStorage
    localStorage.setItem('token', response.access_token);
    localStorage.setItem('user', JSON.stringify(response.user));

    setUser(response.user);
  };

  // Función para registrarse
  const register = async (data: RegisterRequest) => {
    const response = await apiRegister(data);

    // Guardamos token y user en localStorage
    localStorage.setItem('token', response.access_token);
    localStorage.setItem('user', JSON.stringify(response.user));

    setUser(response.user);
  };

  // Función para cerrar sesión
  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  // Verificar si hay sesión al cargar
  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const userData = await apiMe();
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        setLoading(false);
      } catch (error) {
        console.log('Sesión inválida, limpiando...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    validateSession();
  }, []);

  return { user, login, register, logout, loading };
}
