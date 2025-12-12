// Ejemplo: Aquí van tus llamadas a la API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function login(email: string, password: string) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
}

export async function register(data: { email: string; password: string; name: string }) {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}
