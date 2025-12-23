'use client';

import { DashboardNavbar } from "@/components/DashboardNavbar";
import { StatsGrid } from "@/components/StatsGrid";
import { UserInfoItem } from "@/components/UserInfoItem";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { updatePassword } from "@/lib/auth.api";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  User,
  Settings,
  Lock,
  Mail,
  ShieldCheck,
  Calendar,
  GraduationCap
} from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const passwordSchema = z.object({
  current_password: z.string().min(1, "La contraseña actual es requerida"),
  new_password: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
  new_password_confirmation: z.string(),
}).refine((data) => data.new_password === data.new_password_confirmation, {
  message: "Las contraseñas no coinciden",
  path: ["new_password_confirmation"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function Perfil() {
  const { user } = useAuth();
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      new_password_confirmation: "",
    },
  });

  const onSubmit = async (values: PasswordFormValues) => {
    try {
      const response = await updatePassword(values);
      localStorage.setItem('token', response.access_token);
      toast.success("Contraseña actualizada correctamente");
      setIsDialogOpen(false);
      form.reset();
    } catch (error: any) {
      let errorMessage = 'Error al actualizar la contraseña';
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        errorMessage = typeof detail === 'string' ? detail :
                       Array.isArray(detail) ? detail.map((err: any) => err.msg).join(', ') :
                       detail.msg || errorMessage;
      }
      toast.error(errorMessage);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <DashboardNavbar />

        <main className="max-w-4xl mx-auto px-4 py-8 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Sidebar info */}
            <div className="md:col-span-1 space-y-6">
              <Card className="text-center pt-8 overflow-hidden bg-card border-border">
                <div className="flex justify-center mb-4">
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center border-4 border-card shadow-sm">
                    <User className="w-12 h-12 text-primary" />
                  </div>
                </div>
                <CardContent>
                  <h2 className="text-xl font-bold truncate">{user?.email?.split('@')[0]}</h2>
                  <p className="text-sm text-muted-foreground mb-4">{user?.email}</p>
                  <Badge variant="secondary" className="mb-2">Usuario Activo</Badge>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Acciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start gap-2">
                        <Lock className="w-4 h-4" />
                        Cambiar Contraseña
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Actualizar Contraseña</DialogTitle>
                        <DialogDescription>
                          Asegúrate de usar una contraseña segura que no uses en otros sitios.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                          <FormField
                            control={form.control}
                            name="current_password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Contraseña Actual</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="new_password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nueva Contraseña</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="new_password_confirmation"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>
                              Cancelar
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                              {form.formState.isSubmitting ? "Actualizando..." : "Guardar Cambios"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>

                  <Button variant="ghost" className="w-full justify-start gap-2" disabled>
                    <Settings className="w-4 h-4" />
                    Configuración de Cuenta
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Main info */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <CardTitle>Información Detallada</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                    <div className="md:col-span-2">
                      <UserInfoItem
                        icon={<Mail className="w-4 h-4" />}
                        label="Email de contacto"
                        value={user?.email || ""}
                      />
                    </div>
                    <UserInfoItem
                      icon={<GraduationCap className="w-4 h-4" />}
                      label="Nivel educativo"
                      value={user?.profile.education_level || ""}
                    />
                    <UserInfoItem
                      icon={<Calendar className="w-4 h-4" />}
                      label="Edad"
                      value={`${user?.profile.age || 0} años`}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Temas de Interés</h3>
                    <div className="flex flex-wrap gap-2">
                      {user?.profile.interests.map((interest: string) => (
                        <Badge key={interest} variant="outline" className="bg-background border-border">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary/5 border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.05)]">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2 text-base">
                    Estadísticas Globales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <StatsGrid
                    variant="compact"
                    totalXp={user?.gamification.total_xp || 0}
                    currentStreak={user?.gamification.current_streak || 0}
                    maxStreak={user?.gamification.max_streak || 0}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
