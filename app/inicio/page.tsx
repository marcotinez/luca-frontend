'use client';

// React and hooks
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useRouter } from 'next/navigation';

// Design components and icons
import {
  Wallet,
  CreditCard,
  Landmark,
  Briefcase,
  PiggyBank,
  ShieldCheck,
  BrainCircuit,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

// Components
import { DashboardNavbar } from '@/components/DashboardNavbar';
import { WelcomeHeader } from '@/components/WelcomeHeader';
import { PathwayTopic } from '@/components/PathwayTopic';

// Types
import { FinancialTopic } from '@/types/user.types';

export default function PaginaInicio() {
  const { user } = useAuth();
  const router = useRouter();
  if (!user) return null;

  // Generic modules for the mockup
  const mockModules = [
    {
      title: 'Contenido A',
      description: 'Espacio reservado para la descripción del primer bloque de aprendizaje.',
      icon: Wallet,
      color: 'bg-slate-500'
    },
    {
      title: 'Contenido B',
      description: 'Espacio reservado para la descripción del segundo bloque de aprendizaje.',
      icon: ShieldCheck,
      color: 'bg-slate-500'
    }
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-20">
        <DashboardNavbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

          <WelcomeHeader
            email={user.email}
            totalXp={user.gamification.total_xp}
            currentStreak={user.gamification.current_streak}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Learning Path Topics */}
            {mockModules.map((module, idx) => (
              <div key={idx} className="space-y-4">
                {idx === 0 && (
                  <h2 className="text-xl font-black text-foreground mb-6 uppercase tracking-widest">Ruta 01</h2>
                )}
                {idx === 1 && (
                  <h2 className="text-xl font-black text-foreground mb-6 uppercase tracking-widest">Ruta 02</h2>
                )}
                <PathwayTopic
                  title={module.title}
                  description={module.description}
                  icon={module.icon}
                  progress={0}
                  colorClass={module.color}
                  onClick={() => {}}
                />
              </div>
            ))}

            {/* Recommendation Card */}
            <div className="space-y-4">
              <h2 className="text-xl font-black text-foreground mb-6 uppercase tracking-widest">Recomendación</h2>
              <Card className="h-full border-2 border-dashed border-muted shadow-none bg-transparent overflow-hidden group">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-muted p-2 rounded-lg">
                      <BrainCircuit className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-lg font-black uppercase tracking-tight">Actividad Sugerida</CardTitle>
                  </div>
                  <CardDescription className="font-medium italic">
                    [Información generada automáticamente]
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-secondary/20 p-4 rounded-2xl border border-dashed border-muted">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">CATEGORÍA X</p>
                    <h4 className="text-base font-black text-foreground uppercase tracking-tighter">SESIÓN DE PRÁCTICA</h4>
                    <p className="text-xs text-muted-foreground">Descripción breve del contenido de la sesión...</p>
                  </div>

                  <Button variant="secondary" className="w-full h-12 rounded-xl font-bold shadow-none opacity-50 cursor-not-allowed">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Iniciar
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
