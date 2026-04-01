'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Hooks
import { useAuth } from "@/hooks/useAuth";
import { getRegistrationTaxonomy, type RegistrationTaxonomyResponse } from "@/lib/auth.api";

// Validación
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import axios from "axios";

// Tipos
import { EducationLevel, RegisterRequest } from "@/types";

// Componentes míos
import { Navbar } from "@/components/Navbar";
import { PublicRoute } from '@/components/PublicRoute';
import { PasswordField, passwordValidation } from "@/components/PasswordField";

// Componentes Shadcn
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

//////////////////////////////////////////////////////////////

// Validación
const registerSchema = z.object({
  email: z.email({ message: "Introduce un email válido" }),
  password: passwordValidation,
  age: z.number().int({ message: "La edad debe ser un número entero" }).min(18, { message: "Debes tener al menos 18 años" }).max(120),
  interests: z.array(z.string()).min(1, { message: "Selecciona al menos un interés" }),
});
type RegisterFormValues = z.infer<typeof registerSchema>;

// Valores
export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [registrationTaxonomy, setRegistrationTaxonomy] = useState<RegistrationTaxonomyResponse | null>(null);
  const [isLoadingTaxonomy, setIsLoadingTaxonomy] = useState(true);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      email: "",
      password: "",
      age: 18,
      interests: [],
    },
  });

  useEffect(() => {
    let isMounted = true;

    const loadRegistrationTaxonomy = async () => {
      try {
        const response = await getRegistrationTaxonomy();
        if (!isMounted) return;
        setRegistrationTaxonomy(response);
      } catch {
        if (!isMounted) return;
        toast.error("No se pudieron cargar las categorías de registro");
      } finally {
        if (isMounted) setIsLoadingTaxonomy(false);
      }
    };

    loadRegistrationTaxonomy();

    return () => {
      isMounted = false;
    };
  }, []);

  // Validamos solo los campos del primer paso
  const nextStep = async () => {
    const fieldsToValidate = ['email', 'password', 'age'] as const;
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setStep(2);
      setTimeout(() => form.clearErrors('interests'), 0);
    }
  };
  // Validamos solo los campos del segundo paso
  const prevStep = () => {
    form.clearErrors();
    setStep(1);
  };

  const onSubmit: SubmitHandler<RegisterFormValues> = async (values) => {
    try {
      await register({
        ...values,
        education_level: EducationLevel.UNIVERSITARIA_INCOMPLETA,
      } as RegisterRequest);
      toast.success("¡Cuenta creada con éxito!");
      router.push('/dashboard');
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
              {/* Stepper Indicator */}
              <div className="mb-3 flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors sm:h-10 sm:w-10 sm:text-base ${step === 1 ? 'bg-primary text-primary-foreground' : 'bg-green-500 text-white'}`}>
                  {step > 1 ? <CheckCircle2 className="h-4 w-4 sm:h-6 sm:w-6" /> : 1}
                </div>
                <div className="h-1 w-10 overflow-hidden rounded-full bg-muted sm:w-12">
                  <div className={`h-full bg-primary transition-all duration-500 ${step === 2 ? 'w-full' : 'w-0'}`} />
                </div>
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors sm:h-10 sm:w-10 sm:text-base ${step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  2
                </div>
              </div>

              <CardTitle className="text-center text-xl font-bold tracking-tight sm:text-3xl">
                {step === 1 ? "Crea tu Cuenta" : "Tus Intereses"}
              </CardTitle>
              <CardDescription className="max-w-md text-center text-sm text-muted-foreground sm:text-base">
                {step === 1
                  ? "Cuéntanos quién eres para personalizar tu experiencia en Luca"
                  : "Selecciona los temas que más te apasionan para comenzar"}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 sm:px-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  {step === 1 && (
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
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                      <FormField
                        control={form.control}
                        name="interests"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            {isLoadingTaxonomy ? (
                              <p className="text-sm text-muted-foreground">Cargando categorías...</p>
                            ) : (
                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                              {(registrationTaxonomy?.categories || []).map((topic) => {
                                const isSelected = field.value?.includes(topic);

                                return (
                                  <label
                                    key={topic}
                                    htmlFor={`topic-${topic}`}
                                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${
                                      isSelected
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-border bg-background hover:bg-muted/50'
                                    }`}
                                  >
                                    <FormControl>
                                      <Checkbox
                                        id={`topic-${topic}`}
                                        checked={isSelected}
                                        onCheckedChange={(checked) => {
                                          const currentValues = field.value || [];
                                          const newValue = checked
                                            ? [...currentValues, topic]
                                            : currentValues.filter((v: string) => v !== topic);
                                          field.onChange(newValue);
                                        }}
                                      />
                                    </FormControl>
                                    <span className="flex-1 leading-snug">{topic}</span>
                                  </label>
                                );
                              })}
                            </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <div className="flex gap-3 pt-2 sm:gap-4 sm:pt-4">
                    {step === 2 && (
                      <Button type="button" variant="outline" onClick={prevStep} className="h-11 flex-1 sm:h-12">
                        <ArrowLeft className="mr-2 w-4 h-4" /> Atrás
                      </Button>
                    )}

                    {step === 1 ? (
                      <Button type="button" onClick={nextStep} className="group h-11 w-full text-base font-bold sm:h-12 sm:text-lg">
                        Siguiente <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    ) : (
                      <Button type="submit" className="h-11 flex-[2] text-base font-bold sm:h-12 sm:text-lg" disabled={form.formState.isSubmitting || isLoadingTaxonomy || !registrationTaxonomy}>
                        {form.formState.isSubmitting ? "Registrando..." : "Comenzar mi Aventura"}
                      </Button>
                    )}
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
