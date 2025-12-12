'use client';

import { PublicRoute } from '@/components/PublicRoute';
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { EducationLevel, FinancialTopic } from "@/types/user.types";

export default function RegisterPage() {
  const { register } = useAuth();
  const [error, setError] = useState('');
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState<number>(18);
  const [education_level, setEducationLevel] = useState<EducationLevel>(EducationLevel.MEDIA_INCOMPLETA);
  const [interests, setInterests] = useState<FinancialTopic[]>([]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !age || !education_level || !interests) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await register({ email, password, age, education_level, interests })
      router.push('/inicio')
    } catch (error) {
      setError('Error al registrar el usuario');
    }
  }

  return (
    <PublicRoute>
      <div>
        <h1>Register</h1>
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
          <h3>Age</h3>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
          />
          <h3>Education Level</h3>
          <select
            value={education_level}
            onChange={(e) => setEducationLevel(e.target.value as EducationLevel)}
          >
            <option value="Media Incompleta">Media Incompleta</option>
            <option value="Media Completa">Media Completa</option>
            <option value="Tecnica Incompleta">Tecnica Incompleta</option>
            <option value="Tecnica Completa">Tecnica Completa</option>
            <option value="Universitaria Incompleta">Universitaria Incompleta</option>
            <option value="Universitaria Completa">Universitaria Completa</option>
          </select>
          <h3>Interests</h3>
          <select
            multiple
            value={interests}
            onChange={(e) => setInterests(Array.from(e.target.selectedOptions, option => option.value as FinancialTopic))}
          >
            <option value="Planificación y presupuesto">Planificación y presupuesto</option>
            <option value="Ahorro y metas">Ahorro y metas</option>
            <option value="El mundo del crédito">El mundo del crédito</option>
            <option value="Manejo de deudas">Manejo de deudas</option>
            <option value="Productos bancarios esenciales">Productos bancarios esenciales</option>
            <option value="Primer empleo y conceptos laborales">Primer empleo y conceptos laborales</option>
            <option value="Economía práctica">Economía práctica</option>
            <option value="Introducción a la inversión y riesgo">Introducción a la inversión y riesgo</option>
            <option value="Consumo inteligente">Consumo inteligente</option>
            <option value="Seguridad financiera">Seguridad financiera</option>
          </select>
          <button type="submit">Register</button>
        </form>
      </div>
    </PublicRoute>
  )
}

