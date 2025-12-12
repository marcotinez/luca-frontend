'use client';

import { PublicRoute } from '@/components/PublicRoute';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await login({ email, password });
      router.push('/inicio');
    } catch (error) {
      setError('Invalid email or password');
    }
  }

  return (
    <PublicRoute>
      <div>
        <h1>Login</h1>
        {error && <p>{error}</p>}
        <form onSubmit={handleSubmit}>
          <h3>Email</h3>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <h3>Password</h3>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Login</button>
        </form>
      </div>
    </PublicRoute>
  );
}

