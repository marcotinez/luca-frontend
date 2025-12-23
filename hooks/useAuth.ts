import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  login as apiLogin,
  register as apiRegister,
  me as apiMe,
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

  // Función para actualizar la contraseña
  const updatePassword = async (data: UpdatePasswordRequest) => {
    const response = await apiUpdatePassword(data);

    // Guardamos el nuevo token si se recibe uno
    if (response.access_token) {
      localStorage.setItem('token', response.access_token);
    }

    // Refrescamos los datos del usuario para mantener el estado sincronizado
    const userData = await apiMe();
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
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
        // Intentamos obtener el usuario
        const userData = await apiMe();
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        setLoading(false);
      } catch (error) {
        // Si no hay sesión, limpiamos y redirigimos al login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    validateSession();
  }, []);

  // Renovar el token automaticamente cada X minutos
  useEffect(() => {
    // ejecutamos la renovación solo si hay usuario
    if(!user) return;

    const refreshIntervalMinutes = Number(process.env.NEXT_PUBLIC_TOKEN_REFRESH_INTERVAL_MINUTES) || 29;
    const refreshInterval = refreshIntervalMinutes * 60 * 1000;

    const interval = setInterval( async () => {
      try {
        console.log('Renovando token...');
        // renovar el token
        const response = await apiRefreshToken();
        localStorage.setItem('token', response.access_token);

      } catch (error) {
        console.log('Error al renovar el token', error);
        logout();
      }
    }, refreshInterval);

    // Limpiar intervalo al desmontar el componente
    return () => clearInterval(interval);
  }, [user]);

  return { user, login, register, logout, loading, updatePassword };
}
