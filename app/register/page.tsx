'use client';

import { useState } from 'react';
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

// Tipos
import { EducationLevel, FinancialTopic, RegisterRequest } from "@/types";

// Componentes míos
import { Navbar } from "@/components/Navbar";
import { PublicRoute } from '@/components/PublicRoute';
import { PasswordField, passwordValidation } from "@/components/PasswordField";

// Componentes Shadcn
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Sparkles, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

//////////////////////////////////////////////////////////////

// Validación
const registerSchema = z.object({
  email: z.email({ message: "Introduce un email válido" }),
  password: passwordValidation,
  age: z.number().int({ message: "La edad debe ser un número entero" }).min(18, { message: "Debes tener al menos 18 años" }).max(120),
  education_level: z.string().min(1, { message: "Selecciona tu nivel educativo" }),
  interests: z.array(z.string()).min(1, { message: "Selecciona al menos un interés" }),
});
type RegisterFormValues = z.infer<typeof registerSchema>;

// Valores
const educationLevels = Object.values(EducationLevel);
const topics = Object.values(FinancialTopic);

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      email: "",
      password: "",
      age: 18,
      education_level: EducationLevel.UNIVERSITARIA_INCOMPLETA as string,
      interests: [],
    },
  });

  // Validamos solo los campos del primer paso
  const nextStep = async () => {
    const fieldsToValidate = ['email', 'password', 'age', 'education_level'] as const;
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
      await register(values as RegisterRequest);
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
        <div className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-10 sm:pt-32 sm:px-4">
          <div className="w-full max-w-lg mb-4">
            <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground p-0 h-auto">
              <Link href="/" className="flex items-center gap-2 text-sm font-medium">
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio
              </Link>
            </Button>
          </div>
          <Card className="w-full max-w-lg shadow-xl border-border bg-card transition-all duration-300">
            <CardHeader className="space-y-1 flex flex-col items-center border-b border-border pb-8 mb-6">
              {/* Stepper Indicator */}
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors font-bold ${step === 1 ? 'bg-primary text-primary-foreground' : 'bg-green-500 text-white'}`}>
                  {step > 1 ? <CheckCircle2 className="w-6 h-6" /> : 1}
                </div>
                <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full bg-primary transition-all duration-500 ${step === 2 ? 'w-full' : 'w-0'}`} />
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors font-bold ${step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  2
                </div>
              </div>

              <CardTitle className="text-3xl font-bold tracking-tight">
                {step === 1 ? "Crea tu Cuenta" : "Tus Intereses"}
              </CardTitle>
              <CardDescription className="text-muted-foreground text-center max-w-md">
                {step === 1
                  ? "Cuéntanos quién eres para personalizar tu experiencia en Luca"
                  : "Selecciona los temas que más te apasionan para comenzar"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {step === 1 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-500">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-l-4 border-primary pl-3">Datos Personales</h3>
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecciona" />
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
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className="flex items-center gap-2">
                         <Sparkles className="w-4 h-4 text-amber-500" />
                         <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-l-4 border-amber-500 pl-3">Temas de Interés</h3>
                       </div>
                       <FormLabel className="text-xs text-muted-foreground">Selecciona al menos un tema que te gustaría aprender</FormLabel>
                       <ScrollArea className="h-[280px] rounded-md border border-border p-4 bg-background/50 shadow-inner">
                        <FormField
                          control={form.control}
                          name="interests"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              {topics.map((topic) => (
                                <div
                                  key={topic}
                                  className="flex flex-row items-center space-x-3 space-y-0 p-1 rounded-lg hover:bg-muted/50 transition-colors group"
                                >
                                  <FormControl>
                                    <Checkbox
                                      id={`topic-${topic}`}
                                      checked={field.value?.includes(topic)}
                                      onCheckedChange={(checked) => {
                                        const currentValues = field.value || [];
                                        const newValue = checked
                                          ? [...currentValues, topic]
                                          : currentValues.filter((v: string) => v !== topic);
                                        field.onChange(newValue);
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel
                                    htmlFor={`topic-${topic}`}
                                    className="font-normal text-sm cursor-pointer flex-1 py-1 group-hover:text-primary transition-colors"
                                  >
                                    {topic}
                                  </FormLabel>
                                </div>
                              ))}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </ScrollArea>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    {step === 2 && (
                      <Button type="button" variant="outline" onClick={prevStep} className="flex-1 h-12">
                        <ArrowLeft className="mr-2 w-4 h-4" /> Atrás
                      </Button>
                    )}

                    {step === 1 ? (
                      <Button type="button" onClick={nextStep} className="w-full h-12 text-lg font-bold group">
                        Siguiente <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    ) : (
                      <Button type="submit" className="flex-[2] h-12 text-lg font-bold" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? "Registrando..." : "Comenzar mi Aventura"}
                      </Button>
                    )}
                  </div>
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
