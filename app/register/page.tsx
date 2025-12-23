'use client';

import { Navbar } from "@/components/Navbar";
import { PublicRoute } from '@/components/PublicRoute';
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { EducationLevel, FinancialTopic } from "@/types/user.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import axios from "axios";
import { useState } from "react";

// Componentes Shadcn
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserPlus, Sparkles, Check, X } from 'lucide-react';

// Validación de contraseña que coincide con el backend
const passwordValidation = z.string()
  .min(8, { message: "La contraseña debe tener al menos 8 caracteres" })
  .regex(/[A-Z]/, { message: "Debe contener al menos una letra mayúscula" })
  .regex(/[a-z]/, { message: "Debe contener al menos una letra minúscula" })
  .regex(/[0-9]/, { message: "Debe contener al menos un número" })
  .regex(/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\/~`]/, { message: "Debe contener al menos un carácter especial" });

const registerSchema = z.object({
  email: z.string().email({ message: "Introduce un email válido" }),
  password: passwordValidation,
  age: z.number().int({ message: "La edad debe ser un número entero" }).min(18, { message: "Debes tener al menos 18 años" }).max(120),
  education_level: z.string().min(1, { message: "Selecciona tu nivel educativo" }),
  interests: z.array(z.string()).min(1, { message: "Selecciona al menos un interés" }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const educationLevels = Object.values(EducationLevel);
const topics = Object.values(FinancialTopic);

// Componente para mostrar los requisitos de contraseña
interface PasswordRequirementsProps {
  password: string;
}

const PasswordRequirements = ({ password }: PasswordRequirementsProps) => {
  const requirements = [
    { label: "Mínimo 8 caracteres", test: (pwd: string) => pwd.length >= 8 },
    { label: "Al menos una letra mayúscula (A-Z)", test: (pwd: string) => /[A-Z]/.test(pwd) },
    { label: "Al menos una letra minúscula (a-z)", test: (pwd: string) => /[a-z]/.test(pwd) },
    { label: "Al menos un número (0-9)", test: (pwd: string) => /[0-9]/.test(pwd) },
    { label: "Al menos un carácter especial (!@#$%^&*(),.?\":{}|<>_-+=[]/~`)", test: (pwd: string) => /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\/~`]/.test(pwd) },
  ];

  return (
    <div className="mt-3 space-y-2 p-3 rounded-md bg-muted/50 border border-border">
      <p className="text-xs font-semibold text-muted-foreground mb-2">Tu contraseña debe contener:</p>
      {requirements.map((req, index) => {
        const isMet = req.test(password);
        return (
          <div key={index} className="flex items-start gap-2 text-xs">
            <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
              isMet ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-muted text-muted-foreground'
            }`}>
              {isMet ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            </div>
            <span className={isMet ? 'text-foreground' : 'text-muted-foreground'}>
              {req.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      age: 18,
      education_level: EducationLevel.MEDIA_INCOMPLETA as string,
      interests: [],
    },
  });

  // Observar el valor de la contraseña en tiempo real
  const passwordValue = form.watch("password") || "";

  const onSubmit: SubmitHandler<RegisterFormValues> = async (values) => {
    try {
      await register(values as unknown as RegisterRequest);
      toast.success("¡Cuenta creada con éxito!");
      router.push('/inicio');
    } catch (error) {
      let errorMessage = "Error al registrar el usuario. Intenta con otro email.";
      if (axios.isAxiosError(error) && error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          errorMessage = detail.map((err: any) => `${err.loc.join('.')}: ${err.msg}`).join(', ');
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
        <div className="flex-1 flex items-center justify-center p-4 pt-32 pb-10">
          <Card className="w-full max-w-2xl shadow-xl border-border bg-card transition-colors">
            <CardHeader className="space-y-1 flex flex-col items-center border-b border-border pb-8 mb-6">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <UserPlus className="text-primary w-7 h-7" />
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight">Crear Cuenta</CardTitle>
              <CardDescription className="text-muted-foreground text-center max-w-sm">
                Únete a Luca y comienza tu camino hacia la libertad financiera con aprendizaje divertido
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Información Básica */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Datos Personales</h3>
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
                            {/* Componente de validación en tiempo real */}
                            <PasswordRequirements password={passwordValue} />
                          </FormItem>
                        )}
                      />
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
                      <FormField
                        control={form.control}
                        name="education_level"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nivel Educativo</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona tu nivel" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {educationLevels.map((level) => (
                                  <SelectItem key={level} value={level}>
                                    {level}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Intereses */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                         <Sparkles className="w-4 h-4 text-amber-500" />
                         <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Tus Intereses</h3>
                       </div>
                       <FormLabel className="text-xs text-muted-foreground">Selecciona temas que te gustaría aprender</FormLabel>
                       <ScrollArea className="h-[280px] rounded-md border border-border p-4 bg-background/50">
                        <FormField
                          control={form.control}
                          name="interests"
                          render={() => (
                            <FormItem className="space-y-3">
                              {topics.map((topic) => (
                                <FormField
                                  key={topic}
                                  control={form.control}
                                  name="interests"
                                  render={({ field }) => {
                                    return (
                                      <FormItem
                                        key={topic}
                                        className="flex flex-row items-start space-x-3 space-y-0"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(topic)}
                                            onCheckedChange={(checked) => {
                                              return checked
                                                ? field.onChange([...field.value, topic])
                                                : field.onChange(
                                                    field.value?.filter(
                                                      (value) => value !== topic
                                                    )
                                                  )
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="font-normal text-sm cursor-pointer hover:text-primary transition-colors">
                                          {topic}
                                        </FormLabel>
                                      </FormItem>
                                    )
                                  }}
                                />
                              ))}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </ScrollArea>
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Registrando..." : "Comenzar mi Aventura"}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-center border-t border-border pt-6">
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

