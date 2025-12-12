'use client';

import { login } from '@/lib/api';

export default function LoginPage() {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const data = await login(email, password);
      console.log('Login exitoso:', data);
      // TODO: Guardar token, redirigir, etc.
    } catch (error) {
      console.error('Error en login:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h1 className="text-2xl font-bold">Login</h1>
        <input
          name="email"
          type="email"
          placeholder="Email"
          className="border p-2 rounded w-full"
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          className="border p-2 rounded w-full"
          required
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded w-full">
          Iniciar Sesión
        </button>
      </form>
    </div>
  );
}
