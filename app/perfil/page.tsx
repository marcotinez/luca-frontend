'use client'

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { updatePassword } from "@/lib/auth.api";
import Modal from "@/components/Modal";

export default function Perfil() {
  const { user } = useAuth();
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  })
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await updatePassword(formData);
      localStorage.setItem('token', response.access_token);
      setIsModalOpen(false);
      setFormData({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      })
    } catch (error: any) {
      // Manejar diferentes formatos de error de FastAPI
      let errorMessage = 'Error al actualizar la contraseña';

      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;

        // Si es un string, usarlo directamente
        if (typeof detail === 'string') {
          errorMessage = detail;
        }
        // Si es un array de errores de validación de Pydantic
        else if (Array.isArray(detail)) {
          errorMessage = detail.map((err: any) => err.msg).join(', ');
        }
        // Si es un objeto con mensaje
        else if (detail.msg) {
          errorMessage = detail.msg;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedRoute>
      <div>
        <h1>Perfil</h1>
        <p>Email: {user?.email}</p>

        <div>
          <h2>Gamificación</h2>
          <p>XP Total: {user?.gamification.total_xp}</p>
          <p>Racha actual: {user?.gamification.current_streak}</p>
          <p>Racha máxima: {user?.gamification.max_streak}</p>
        </div>

        <button onClick={() => setIsModalOpen(true)}>
          Cambiar Contraseña
        </button>

        <button onClick={() => router.push('/inicio')}>
          Volver al Inicio
        </button>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Cambiar Contraseña"
        >
          <form onSubmit={handleSubmit}>
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <div>
              <label>Contraseña Actual</label>
              <input
                type="password"
                value={formData.current_password}
                onChange={(e) => setFormData({
                  ...formData,
                  current_password: e.target.value
                })}
                required
              />
            </div>

            <div>
              <label>Nueva Contraseña</label>
              <input
                type="password"
                value={formData.new_password}
                onChange={(e) => setFormData({
                  ...formData,
                  new_password: e.target.value
                })}
                required
              />
            </div>

            <div>
              <label>Confirmar Nueva Contraseña</label>
              <input
                type="password"
                value={formData.new_password_confirmation}
                onChange={(e) => setFormData({
                  ...formData,
                  new_password_confirmation: e.target.value
                })}
                required
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
            </button>
            <button type="button" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
          </form>
        </Modal>
      </div>
    </ProtectedRoute>
  );
}
