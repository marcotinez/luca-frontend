'use client';

import { Navbar } from "@/components/Navbar";
import { PublicRoute } from '@/components/PublicRoute';
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { EducationLevel, FinancialTopic } from "@/types/user.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserPlus, Sparkles } from 'lucide-react';

const registerSchema = z.object({
  email: z.string().email({ message: "Introduce un email válido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
  age: z.number().min(18, { message: "Debes tener al menos 18 años" }).max(120),
  education_level: z.string().min(1, { message: "Selecciona tu nivel educativo" }),
  interests: z.array(z.string()).min(1, { message: "Selecciona al menos un interés" }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const educationLevels = Object.values(EducationLevel);
const topics = Object.values(FinancialTopic);


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

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await register({
        ...values,
        education_level: values.education_level as EducationLevel,
        interests: values.interests as FinancialTopic[],
      });
      toast.success("¡Cuenta creada con éxito!");
      router.push('/inicio');
    } catch (error) {
      toast.error("Error al registrar el usuario. Intenta con otro email.");
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
                              <Input type="number" {...field} />
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

