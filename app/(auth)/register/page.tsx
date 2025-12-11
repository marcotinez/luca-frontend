'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiError } from '@/types';
import { Mail, Lock, User, GraduationCap, Sparkles, CheckCircle2 } from 'lucide-react';

const INTERESTS_OPTIONS = [
  "Planificación y presupuesto",
  "Ahorro y metas",
  "El mundo del crédito",
  "Manejo de deudas",
  "Productos bancarios esenciales",
  "Primer empleo y conceptos laborales",
  "Economía práctica",
  "Introducción a la inversión y riesgo",
  "Consumo inteligente",
  "Seguridad financiera"
];

const EDUCATION_LEVELS = [
  "Media Incompleta",
  "Media Completa",
  "Técnica Superior Incompleta",
  "Técnica Superior Completa",
  "Universitaria Incompleta",
  "Universitaria Completa",
  "Postgrado"
];

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    age: '',
    education_level: '',
    interests: [] as string[]
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleInterestChange = (interest: string) => {
    setFormData(prev => {
      const interests = prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest];
      return { ...prev, interests };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        ...formData,
        age: parseInt(formData.age, 10)
      };

      await api.post('/auth/register', payload);
      router.push('/login?registered=true');
    } catch (err: unknown) {
      const apiError = (err as any).response?.data as ApiError;
      if (apiError?.detail) {
         if (Array.isArray(apiError.detail)) {
            setError(apiError.detail.map(e => e.msg).join(', '));
         } else {
            setError(typeof apiError.detail === 'string' ? apiError.detail : 'Error al registrarse');
         }
      } else {
        setError('Ocurrió un error inesperado. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 py-12 relative overflow-hidden">
      {/* Animated gradient orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, -50, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute left-[5%] top-[10%] h-[500px] w-[500px] rounded-full bg-gradient-to-br from-primary/30 to-accent/20 blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          x: [0, 50, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute right-[5%] bottom-[10%] h-[600px] w-[600px] rounded-full bg-gradient-to-bl from-accent/30 to-primary/20 blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl relative z-10"
      >
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl border border-emerald-500/40 shadow-2xl border-emerald-500/20 shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg"
            >
              <Sparkles className="h-8 w-8 text-white" />
            </motion.div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">Crear Cuenta</CardTitle>
            <CardDescription className="text-base">
              Únete a Luca y transforma tu futuro financiero
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Correo Electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="nombre@ejemplo.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="pl-10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-emerald-500/30 shadow-xl h-11 border-emerald-500/20 focus:border-emerald-500/50 transition-all duration-300 ease-in-out"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={8}
                      className="pl-10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-emerald-500/30 shadow-xl h-11 border-emerald-500/20 focus:border-emerald-500/50 transition-all duration-300 ease-in-out"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-sm font-medium">Edad</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="age"
                      name="age"
                      type="number"
                      min="18"
                      value={formData.age}
                      onChange={handleChange}
                      required
                      className="pl-10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-emerald-500/30 shadow-xl h-11 border-emerald-500/20 focus:border-emerald-500/50 transition-all duration-300 ease-in-out"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="education_level" className="text-sm font-medium">Nivel Educacional</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                    <select
                      id="education_level"
                      name="education_level"
                      className="flex h-11 w-full rounded-md border border-emerald-500/20 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-emerald-500/30 shadow-xl pl-10 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 ease-in-out"
                      value={formData.education_level}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Selecciona una opción</option>
                      {EDUCATION_LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Intereses Financieros</Label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {INTERESTS_OPTIONS.map((interest, index) => (
                    <motion.div
                      key={interest}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-emerald-500/20 shadow-2xl p-3 rounded-lg cursor-pointer transition-all duration-300 ease-in-out hover:border-emerald-500/50 ${
                        formData.interests.includes(interest) ? 'border-primary bg-primary/10' : ''
                      }`}
                      onClick={() => handleInterestChange(interest)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all duration-300 ease-in-out ${
                          formData.interests.includes(interest)
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground/30'
                        }`}>
                          {formData.interests.includes(interest) && (
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <label className="text-sm font-medium cursor-pointer flex-1">
                          {interest}
                        </label>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-emerald-500/20 shadow-2xl border-destructive/50 bg-destructive/10 p-3 rounded-lg"
                >
                  <p className="text-sm text-destructive font-medium text-center">{error}</p>
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 ease-in-out text-white font-medium"
                disabled={loading}
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="h-5 w-5" />
                  </motion.div>
                ) : (
                  'Crear Cuenta'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-emerald-500/30 pt-6">
            <p className="text-sm text-muted-foreground">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/login" className="font-medium bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent hover:opacity-80 transition-all duration-300 ease-in-out">
                Inicia sesión aquí
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
