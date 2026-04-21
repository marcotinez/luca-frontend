"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";
import {
  ArrowRight,
  Calendar,
  Lock,
  Mail,
  ShieldCheck,
  User,
  Medal,
  Target,
} from "lucide-react";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { UserInfoItem } from "@/components/UserInfoItem";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { updatePassword } from "@/lib/auth.api";
import { getLearningProfile } from "@/lib/users.api";
import { getPracticeTests } from "@/lib/learning.api";
import { apiErrorMessage, formatRelativeDate, formatPracticeMinutes } from "@/lib/learning.utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import type { PracticeTestSummaryResponse, UserLearningProfile } from "@/types";

function scoreClass(score: number): string {
  if (score < 40) return "text-red-500";
  if (score < 70) return "text-amber-500";
  return "text-emerald-500";
}

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
  const router = useRouter();
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

  // Progress State
  const [profile, setProfile] = useState<UserLearningProfile | null>(user?.learning_profile || null);
  const [tests, setTests] = useState<PracticeTestSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const run = async () => {
      setLoading(true);
      try {
        const [profileResponse, testsResponse] = await Promise.all([
          getLearningProfile(user.id),
          getPracticeTests(),
        ]);
        setProfile(profileResponse);
        setTests(testsResponse);
      } catch (error) {
        toast.error(apiErrorMessage(error, "No se pudo cargar el progreso"));
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [user]);

  const completedTests = useMemo(() => tests.filter((item) => item.status === "completed"), [tests]);
  const pendingTests = useMemo(() => tests.filter((item) => item.status !== "completed"), [tests]);

  const strengths = useMemo(() => {
    return [...(profile?.domain_knowledge || [])]
      .filter((item) => item.attempts > 0 && item.score >= 70)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [profile?.domain_knowledge]);

  const improvements = useMemo(() => {
    return [...(profile?.domain_knowledge || [])]
      .filter((item) => item.attempts > 0 && item.score < 70)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);
  }, [profile?.domain_knowledge]);


  if (!user) return null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-grid-soft pb-16">
        <DashboardNavbar />

        <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <section className="animate-enter-up rounded-2xl border border-border/70 bg-card/80 px-5 py-4 shadow-sm backdrop-blur sm:px-6 sm:py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Progreso y Perfil</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Mi progreso</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Revisa tus estadísticas de aprendizaje, administra tu información y protege tu cuenta.
            </p>
          </section>

          <Tabs defaultValue="progreso" className="w-full animate-enter-up">
            <TabsList className="mb-4 grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="progreso">Progreso</TabsTrigger>
              <TabsTrigger value="cuenta">Cuenta</TabsTrigger>
            </TabsList>

            <TabsContent value="cuenta" className="space-y-4">
              <Card className="overflow-hidden border-border/70 bg-card/90 shadow-sm backdrop-blur">
                <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)]">
                  <div className="border-b border-border/60 bg-primary/5 p-6 lg:border-b-0 lg:border-r">
                    <div className="flex flex-row items-center gap-5 lg:h-full lg:min-h-[420px] lg:flex-col lg:justify-center lg:text-center">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-card bg-primary/10 shadow-sm lg:mb-5 lg:h-28 lg:w-28">
                        <User className="h-8 w-8 text-primary lg:h-12 lg:w-12" />
                      </div>
                      <div className="flex-1 overflow-hidden text-left lg:flex-none lg:text-center">
                        <h2 className="truncate text-xl font-black tracking-tight lg:text-2xl">{username}</h2>
                        <p className="mt-0.5 truncate text-sm text-muted-foreground lg:mt-2">{user?.email}</p>
                        <Badge variant="secondary" className="mt-2 px-3 py-0.5 lg:mt-4 lg:px-4 lg:py-1">
                          Cuenta activa
                        </Badge>
                      </div>
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
            </TabsContent>

            <TabsContent value="progreso" className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-2xl border border-border/60 bg-card/80 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Tiempo de estudio</p>
                  <p className="mt-2 text-2xl font-black">{formatPracticeMinutes(profile?.total_practice_minutes || 0)}</p>
                </article>
                <article className="rounded-2xl border border-border/60 bg-card/80 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Última sesión</p>
                  <p className="mt-2 text-base font-semibold">{formatRelativeDate(profile?.last_practice_at || null)}</p>
                </article>
                <article className="rounded-2xl border border-border/60 bg-card/80 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Evaluaciones Listas</p>
                  <p className="mt-2 text-2xl font-black">{completedTests.length}</p>
                </article>
                <article className="rounded-2xl border border-border/60 bg-card/80 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">XP Total</p>
                  <p className="mt-2 text-2xl font-black">{user.gamification.total_xp}</p>
                </article>
              </div>

              {loading ? (
                <p className="text-sm text-muted-foreground">Cargando progreso...</p>
              ) : (
                <>
                  <div className="grid gap-5 lg:grid-cols-2">
                    <div className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur sm:p-6">
                      <div className="mb-4 flex items-center gap-2">
                        <Medal className="h-5 w-5 text-emerald-500" />
                        <h2 className="text-lg font-black">Fortalezas</h2>
                      </div>
                      <div className="space-y-2">
                        {strengths.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Sigue practicando para descubrir tus fortalezas.</p>
                        ) : (
                          strengths.map((item) => (
                            <div key={item.topic} className="rounded-xl border border-border/65 bg-background/75 px-3 py-2">
                              <div className="flex items-center justify-between gap-2 text-sm">
                                <span>{item.topic}</span>
                                <span className={`font-semibold ${scoreClass(item.score)}`}>{Math.round(item.score)}%</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur sm:p-6">
                      <div className="mb-4 flex items-center gap-2">
                        <Target className="h-5 w-5 text-amber-500" />
                        <h2 className="text-lg font-black">Por reforzar</h2>
                      </div>
                      <div className="space-y-2">
                        {improvements.length === 0 ? (
                          <p className="text-sm text-muted-foreground">¡Todo en orden! No hay temas críticos por ahora.</p>
                        ) : (
                          improvements.map((item) => (
                            <div key={item.topic} className="rounded-xl border border-border/65 bg-background/75 px-3 py-2">
                              <div className="flex items-center justify-between gap-2 text-sm">
                                <span>{item.topic}</span>
                                <span className={`font-semibold ${scoreClass(item.score)}`}>{Math.round(item.score)}%</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur sm:p-6">
                      <h2 className="text-lg font-black">Evaluaciones en Curso</h2>
                      <div className="mt-4 space-y-2">
                        {pendingTests.length === 0 ? (
                          <p className="rounded-xl border border-dashed border-border/60 bg-background/70 p-3 text-sm text-muted-foreground">
                            No tienes evaluaciones a medias.
                          </p>
                        ) : (
                          pendingTests.slice(0, 4).map((test) => {
                            const pct = test.total_questions > 0 ? Math.round((test.answered_questions / test.total_questions) * 100) : 0;
                            return (
                              <button
                                key={test.id}
                                type="button"
                                onClick={() => router.push(`/practice/test/${test.id}`)}
                                className="w-full rounded-xl border border-border/65 bg-background/75 p-3 text-left transition hover:border-primary/35"
                              >
                                <p className="text-sm font-semibold">{test.title || "Evaluación"}</p>
                                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{test.answered_questions}/{test.total_questions} preguntas</span>
                                  <span>{pct}%</span>
                                </div>
                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                                  <div className="h-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>

                      <div className="mt-4 grid gap-2">
                        <Button className="justify-between rounded-xl" onClick={() => router.push("/practice/new")}>Crear evaluación<ArrowRight className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ProtectedRoute>
  );
}
