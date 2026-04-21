'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Hooks
import { useAuth } from "@/hooks/useAuth";

// Validación
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import axios from "axios";
import { register as apiRegister } from "@/lib/auth.api";

// Tipos
import { EducationLevel, RegisterRequest } from "@/types";

// Componentes míos
import { Navbar } from "@/components/Navbar";
import { PublicRoute } from '@/components/PublicRoute';
import { PasswordField, passwordValidation } from "@/components/PasswordField";

// Componentes Shadcn
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft } from 'lucide-react';

//////////////////////////////////////////////////////////////

// Validación
const registerSchema = z.object({
  email: z.email({ message: "Introduce un email válido" }),
  password: passwordValidation,
  age: z.coerce.number().refine((value) => Number.isFinite(value), { message: "Debes ingresar una edad válida" }).int({ message: "La edad debe ser un número entero" }).min(18, { message: "Debes tener al menos 18 años" }).max(120),
  interests: z.array(z.string()),
});
type RegisterFormValues = z.infer<typeof registerSchema>;

// Valores
export default function RegisterPage() {
  const router = useRouter();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      email: "",
      password: "",
      age: "" as unknown as number,
      interests: [],
    },
  });

  const onSubmit: SubmitHandler<RegisterFormValues> = async (values) => {
    try {
      await apiRegister({
        ...values,
        interests: [],
        education_level: EducationLevel.UNIVERSITARIA_INCOMPLETA,
      } as RegisterRequest);
      router.push(`/login?registeredEmail=${encodeURIComponent(values.email)}`);
    } catch (error) {
      let errorMessage = "Error al registrar el usuario. Intenta con otro email.";
      if (axios.isAxiosError(error) && error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          errorMessage = detail
            .map((err) => {
              if (!err || typeof err !== "object") return "";
              const item = err as { loc?: unknown[]; msg?: string };
              const location = Array.isArray(item.loc) ? item.loc.join(".") : "request";
              return item.msg ? `${location}: ${item.msg}` : "";
            })
            .filter(Boolean)
            .join(", ");
        } else if (detail.msg) {
          errorMessage = detail.msg;
        }
      }
      toast.error(errorMessage);
    }
  };

  return (
    <PublicRoute>
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center px-5 pt-20 pb-8 sm:pt-32 sm:px-4 sm:pb-10">
          <div className="w-full max-w-lg mb-4">
            <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground p-0 h-auto">
              <Link href="/" className="flex items-center gap-2 text-sm font-medium">
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio
              </Link>
            </Button>
          </div>
          <Card className="w-full max-w-lg shadow-xl border-border bg-card transition-all duration-300">
            <CardHeader className="mb-4 flex flex-col items-center space-y-1 border-b border-border pb-5 sm:pb-8">
              <CardTitle className="text-center text-xl font-bold tracking-tight sm:text-3xl">
                Crea tu Cuenta
              </CardTitle>
              <CardDescription className="max-w-md text-center text-sm text-muted-foreground sm:text-base">
                Cuéntanos quién eres para comenzar en Luca
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 sm:px-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-500">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="tu@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <PasswordField
                      control={form.control}
                      name="password"
                    />
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name="age"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Edad</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Ej: 21"
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2 sm:gap-4 sm:pt-4">
                    <Button type="submit" className="h-11 w-full text-base font-bold sm:h-12 sm:text-lg" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? "Registrando..." : "Comenzar mi Aventura"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-center border-t border-border pt-5 sm:pt-6">
              <div className="text-sm text-center text-muted-foreground">
                ¿Ya tienes una cuenta? <span className="text-primary font-semibold hover:underline cursor-pointer" onClick={() => router.push('/login')}>Inicia Sesión</span>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </PublicRoute>
  );
}
