'use client';

import { Navbar } from "@/components/Navbar";
import { PublicRoute } from '@/components/PublicRoute';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";

// Componentes Shadcn
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { LogIn, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.email({ message: "Introduce un email válido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [successMessage, setSuccessMessage] = useState("");

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const registeredEmail = params.get('registeredEmail');
      if (registeredEmail) {
        form.setValue('email', registeredEmail);
        setSuccessMessage("¡Registro exitoso! Por favor, inicia sesión.");
        // Limpiamos la URL para evitar que el toast vuelva a salir al recargar
        window.history.replaceState(null, '', '/login');
      }
    }
  }, [form]);

  const onSubmit: SubmitHandler<LoginFormValues> = async (values) => {
    try {
      await login(values);
      toast.success("¡Bienvenido de nuevo!");
      router.push('/dashboard');
    } catch (error) {
      toast.error("Email o contraseña incorrectos");
    }
  };

  return (
    <PublicRoute>
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-10 sm:pt-24 sm:px-4">
          <div className="w-full max-w-md mb-4">
            <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground p-0 h-auto">
              <Link href="/" className="flex items-center gap-2 text-sm font-medium">
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio
              </Link>
            </Button>
          </div>

          {successMessage && (
            <div className="w-full max-w-md mb-6 animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 p-4 rounded-xl shadow-sm">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{successMessage}</p>
              </div>
            </div>
          )}

          <Card className="w-full max-w-md shadow-lg border-border bg-card">
          <CardHeader className="space-y-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary">
                <LogIn className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-xl font-bold tracking-tight">Iniciar Sesión</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Ingresa tus credenciales para acceder a Luca
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="nombre@ejemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Iniciando..." : "Ingresar"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-muted-foreground">
              ¿No tienes una cuenta? <span className="text-primary font-semibold hover:underline cursor-pointer" onClick={() => router.push('/register')}>Regístrate</span>
            </div>
          </CardFooter>
        </Card>
        </div>
      </div>
    </PublicRoute>
  );
}
