'use client';

import {
  Users,
  Sparkles,
  Activity,
  CheckCircle2,
  Clock
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboardPage() {
  type RecentAction = {
    action: string;
    user: string;
    time: string;
  };

  const stats = [
    {
      title: "Usuarios Totales",
      value: "X",
      description: "Sincronizado con BD",
      icon: <Users className="w-5 h-5 text-blue-500" />
    },
    {
      title: "Preguntas Generadas",
      value: "X",
      description: "Módulo en desarrollo",
      icon: <Sparkles className="w-5 h-5 text-amber-500" />
    },
    {
      title: "Sesiones Activas",
      value: "X",
      description: "Tiempo real",
      icon: <Activity className="w-5 h-5 text-emerald-500" />
    },
    {
      title: "Alertas Sistema",
      value: "X",
      description: "Estado de servicios",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />
    }
  ];

  const recentActions: RecentAction[] = [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Panel de Control</h1>
        <p className="text-muted-foreground">Bienvenido al centro de administración de Luca.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimas acciones realizadas en la plataforma.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActions.length > 0 ? (
              <div className="space-y-6">
                {recentActions.map((action, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {action.action}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Por: {action.user}
                      </p>
                      <div className="flex items-center pt-2">
                        <Clock className="mr-1 h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {action.time}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-muted-foreground flex flex-col items-center gap-2">
                <Clock className="w-8 h-8 opacity-20" />
                <p className="text-sm italic">Sin actividad reciente registrada</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado del Servidor</CardTitle>
            <CardDescription>Monitoreo de servicios y APIs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                <span className="text-sm font-medium">API Principal</span>
              </div>
              <Badge variant="outline" className="bg-background text-muted-foreground text-[10px]">---</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                <span className="text-sm font-medium">Servicio IA (OpenAI)</span>
              </div>
              <Badge variant="outline" className="bg-background text-muted-foreground text-[10px]">---</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                <span className="text-sm font-medium">Base de Datos</span>
              </div>
              <Badge variant="outline" className="bg-background text-muted-foreground text-[10px]">---</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
