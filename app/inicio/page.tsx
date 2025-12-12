'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function PaginaInicio() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <ProtectedRoute>
      <div>
        <h1>Inicio</h1>
        <p>Bienvenido, {user?.email}</p>

        <div>
          <h2>Tu Perfil</h2>
          <p>Edad: {user?.profile.age}</p>
          <p>Nivel educativo: {user?.profile.education_level}</p>
        </div>

        <div>
          <h2>Gamificación</h2>
          <p>XP Total: {user?.gamification.total_xp}</p>
          <p>Racha actual: {user?.gamification.current_streak}</p>
          <p>Racha máxima: {user?.gamification.max_streak}</p>
        </div>

        <button onClick={() => router.push('/perfil')}>Perfil</button>
        <button onClick={logout}>Cerrar Sesión</button>
      </div>
    </ProtectedRoute>
  );
}

