'use client';

import { register } from '@/lib/api';

export default function RegisterPage() {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    try {
      const response = await register(data);
      console.log('Registro exitoso:', response);
      // TODO: Guardar token, redirigir, etc.
    } catch (error) {
      console.error('Error en registro:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h1 className="text-2xl font-bold">Registro</h1>
        <input
          name="name"
          type="text"
          placeholder="Nombre"
          className="border p-2 rounded w-full"
          required
        />
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
          Registrarse
        </button>
      </form>
    </div>
  );
}
