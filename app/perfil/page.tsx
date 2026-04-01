"use client";

import { useState } from "react";
import axios from "axios";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";
import { ArrowRight, Calendar, GraduationCap, Lock, Mail, ShieldCheck, User } from "lucide-react";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { StatsGrid } from "@/components/StatsGrid";
import { UserInfoItem } from "@/components/UserInfoItem";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { updatePassword } from "@/lib/auth.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { PasswordField, passwordValidation } from "@/components/PasswordField";

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "La contraseña actual es requerida"),
    new_password: passwordValidation,
    new_password_confirmation: z.string(),
  })
  .refine((data) => data.new_password === data.new_password_confirmation, {
    message: "Las contraseñas no coinciden",
    path: ["new_password_confirmation"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function PerfilPage() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      new_password_confirmation: "",
    },
  });

  const onSubmit: SubmitHandler<PasswordFormValues> = async (values) => {
    try {
      const response = await updatePassword(values);
      localStorage.setItem("token", response.access_token);
      toast.success("Contraseña actualizada correctamente");
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      let errorMessage = "Error al actualizar la contraseña";
      if (axios.isAxiosError(error) && error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === "string") {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          errorMessage = detail.map((err: { msg?: string }) => err.msg || "Error").join(", ");
        } else if (typeof detail === "object" && detail?.msg) {
          errorMessage = detail.msg;
        }
      }
      toast.error(errorMessage);
    }
  };

  const username = user?.email?.split("@")[0] || "Usuario";
  const interests = Array.from(new Set(user?.profile.interests || []));

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-grid-soft pb-14">
        <DashboardNavbar />

        <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          <section className="animate-enter-up rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Cuenta</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Mi perfil</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Administra tu información, revisa tus estadísticas y protege tu cuenta.
            </p>
          </section>

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <aside className="lg:col-span-1">
              <Card className="animate-enter-up border-border/70 bg-card/85 shadow-sm backdrop-blur">
                <CardContent className="p-5 text-center">
                  <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border-4 border-card bg-primary/10 shadow-sm">
                    <User className="h-11 w-11 text-primary" />
                  </div>
                  <h2 className="truncate text-xl font-black tracking-tight">{username}</h2>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{user?.email}</p>
                  <Badge variant="secondary" className="mt-3">
                    Cuenta activa
                  </Badge>
                  <Separator className="my-4" />
                  <div className="space-y-2 text-left">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Seguridad
                    </p>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-between rounded-xl">
                        <span className="inline-flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Cambiar contraseña
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Actualizar contraseña</DialogTitle>
                        <DialogDescription>
                          Usa una contraseña segura que no repitas en otros servicios.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                          <FormField
                            control={form.control}
                            name="current_password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Contraseña actual</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <PasswordField
                            control={form.control}
                            name="new_password"
                            label="Nueva contraseña"
                          />
                          <FormField
                            control={form.control}
                            name="new_password_confirmation"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirmar contraseña</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>
                              Cancelar
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                              {form.formState.isSubmitting ? "Actualizando..." : "Guardar cambios"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                  </div>
                </CardContent>
              </Card>
            </aside>

            <div className="space-y-5 lg:col-span-2">
              <Card className="animate-enter-up border-border/70 bg-card/85 shadow-sm backdrop-blur">
                <CardHeader className="border-b border-border/60 pb-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <CardTitle>Información personal</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 p-5">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-10 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <UserInfoItem
                        icon={<Mail className="h-4 w-4" />}
                        label="Email de contacto"
                        value={user?.email || "-"}
                      />
                    </div>
                    <UserInfoItem
                      icon={<GraduationCap className="h-4 w-4" />}
                      label="Nivel educativo"
                      value={user?.profile.education_level || "No definido"}
                    />
                    <UserInfoItem
                      icon={<Calendar className="h-4 w-4" />}
                      label="Edad"
                      value={user?.profile.age ? `${user.profile.age} años` : "No definida"}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Temas de interés</h3>
                    {interests.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Aún no hay temas seleccionados en tu perfil.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {interests.map((interest: string) => (
                          <Badge key={interest} variant="outline" className="bg-background">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="animate-enter-up-delay border-primary/25 bg-primary/5 shadow-sm">
                <CardHeader className="border-b border-primary/20 pb-4">
                  <CardTitle className="text-base text-primary">Estadísticas globales</CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <StatsGrid
                    variant="compact"
                    totalXp={user?.gamification.total_xp || 0}
                    currentStreak={user?.gamification.current_streak || 0}
                    maxStreak={user?.gamification.max_streak || 0}
                  />
                </CardContent>
              </Card>
            </div>
          </section>
        </main>
      </div>
    </ProtectedRoute>
  );
}
