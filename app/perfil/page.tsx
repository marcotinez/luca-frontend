"use client";

import { useState } from "react";
import axios from "axios";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";
import { ArrowRight, Calendar, Lock, Mail, ShieldCheck, User } from "lucide-react";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { UserInfoItem } from "@/components/UserInfoItem";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { updatePassword } from "@/lib/auth.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
  const panelClassName = "min-h-[144px] rounded-2xl border border-border/70 bg-background/80 p-6";

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
      <div className="min-h-screen bg-grid-soft pb-8">
        <DashboardNavbar />

        <main className="mx-auto max-w-7xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
          <section className="animate-enter-up rounded-2xl border border-border/70 bg-card/80 px-5 py-4 shadow-sm backdrop-blur sm:px-6 sm:py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Cuenta</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Mi perfil</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Administra tu información, revisa tus estadísticas y protege tu cuenta.
            </p>
          </section>

          <section>
            <Card className="animate-enter-up overflow-hidden border-border/70 bg-card/90 shadow-sm backdrop-blur">
              <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)]">
                <div className="border-b border-border/60 bg-primary/5 px-6 py-8 lg:border-b-0 lg:border-r">
                  <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center">
                    <div className="mb-5 flex h-28 w-28 items-center justify-center rounded-full border-4 border-card bg-primary/10 shadow-sm">
                      <User className="h-12 w-12 text-primary" />
                    </div>
                    <h2 className="max-w-full truncate text-2xl font-black tracking-tight">{username}</h2>
                    <p className="mt-2 max-w-full truncate text-sm text-muted-foreground">{user?.email}</p>
                    <Badge variant="secondary" className="mt-4 px-4 py-1">
                      Cuenta activa
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-4 p-6">
                  <div className={panelClassName}>
                    <div className="flex h-full flex-col justify-center">
                      <div className="grid gap-4 sm:grid-cols-[minmax(0,1.6fr)_minmax(180px,0.8fr)] sm:divide-x sm:divide-border/60">
                        <div className="sm:pr-4">
                          <UserInfoItem
                            icon={<Mail className="h-4 w-4" />}
                            label="Email de contacto"
                            value={user?.email || "-"}
                          />
                        </div>
                        <div className="sm:pl-4">
                          <UserInfoItem
                            icon={<Calendar className="h-4 w-4" />}
                            label="Edad"
                            value={user?.profile.age ? `${user.profile.age} años` : "No definida"}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={panelClassName}>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Temas de interés</h3>
                    </div>
                    {interests.length === 0 ? (
                      <p className="mt-4 text-sm text-muted-foreground">
                        Aún no hay temas seleccionados en tu perfil.
                      </p>
                    ) : (
                      <div className="mt-4 flex flex-wrap gap-3">
                        {interests.map((interest: string) => (
                          <Badge key={interest} variant="outline" className="bg-background px-4 py-2.5 text-sm">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className={panelClassName}>
                    <div className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Seguridad</h3>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Actualiza tu contraseña cuando necesites reforzar el acceso a tu cuenta.
                    </p>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="mt-4 w-full justify-between rounded-xl">
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
                </div>
              </div>
            </Card>
          </section>
        </main>
      </div>
    </ProtectedRoute>
  );
}
