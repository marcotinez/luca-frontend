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
  Award
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

  // Map topics to their display data
  const topicData = {
    [FinancialTopic.PLANIFICACION]: {
      icon: Wallet,
      color: 'bg-blue-500',
      description: 'Presupuestos, metas y control de gastos personales.'
    },
    [FinancialTopic.CREDITO]: {
      icon: CreditCard,
      color: 'bg-purple-500',
      description: 'Tasas, tipos de crédito y manejo responsable de deuda.'
    },
    [FinancialTopic.ECONOMIA]: {
      icon: Landmark,
      color: 'bg-emerald-500',
      description: 'Inflación, oferta, demanda y conceptos macro básicos.'
    },
    [FinancialTopic.PRIMER_EMPLEO]: {
      icon: Briefcase,
      color: 'bg-amber-500',
      description: 'Contratos, AFP, salud y tus derechos laborales.'
    },
    [FinancialTopic.AHORRO]: {
      icon: PiggyBank,
      color: 'bg-green-500',
      description: 'El hábito del ahorro e instrumentos básicos de inversión.'
    },
    [FinancialTopic.PRODUCTOS_BANCARIOS]: {
      icon: ShieldCheck,
      color: 'bg-rose-500',
      description: 'Cuentas, tarjetas y seguridad en el mundo digital.'
    },
  };

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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

            {/* Left Column: Learning Path */}
            <div className="lg:col-span-2 space-y-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-foreground">Tu Ruta de Aprendizaje</h2>
                  <p className="text-muted-foreground font-medium">Temas adaptados a tus intereses y nivel educativo.</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
                  <BrainCircuit className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-primary tracking-tight">IA TUNED</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.values(FinancialTopic).map((topic) => {
                  const data = topicData[topic];
                  // If we had real mastery progress per topic, we'd use it here
                  // For now, let's derive some "fake" progress based on XP to make it look alive
                  const mockProgress = Math.min(100, Math.floor(((user.gamification.total_xp % 500) / 5) + (topic.length * 2)));

                  return (
                    <PathwayTopic
                      key={topic}
                      title={topic}
                      description={data.description}
                      icon={data.icon}
                      progress={mockProgress}
                      colorClass={data.color}
                      onClick={() => router.push('/practica')}
                    />
                  );
                })}
              </div>
            </div>

            {/* Right Column: Stats & Recommendations */}
            <div className="space-y-10">

              {/* AI Recommendation Card */}
              <Card className="border-2 border-primary/20 shadow-xl shadow-primary/5 bg-gradient-to-br from-card to-primary/5 overflow-hidden group">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-primary p-2 rounded-lg shadow-lg group-hover:scale-110 transition-transform">
                      <BrainCircuit className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-xl font-black">Sesión Recomendada</CardTitle>
                  </div>
                  <CardDescription className="font-medium">
                    Luca ha seleccionado este desafío basado en tu historial.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
                    <p className="text-sm font-bold text-primary uppercase tracking-widest mb-1">FOCO DE HOY</p>
                    <h4 className="text-lg font-black text-foreground">Manejo de Deuda y CAE</h4>
                    <p className="text-sm text-muted-foreground">Estrategias para optimizar tu historial crediticio.</p>
                  </div>

                  <Button className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 group-hover:scale-[1.02] transition-transform">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Iniciar Sesión
                  </Button>
                </CardContent>
              </Card>

              {/* Achievements Card */}
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    <CardTitle className="text-lg font-black uppercase tracking-tight">Logros Recientes</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { title: 'Primer Ahorro', date: 'Hace 2 días', xp: '+50 XP' },
                    { title: 'Racha de 3 Días', date: 'Hoy', xp: '+100 XP' },
                  ].map((achievement, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-secondary/20">
                      <div>
                        <p className="font-black text-sm">{achievement.title}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">{achievement.date}</p>
                      </div>
                      <span className="text-xs font-black text-primary bg-primary/10 px-2 py-1 rounded-lg">
                        {achievement.xp}
                      </span>
                    </div>
                  ))}
                  <Button variant="ghost" className="w-full text-xs font-bold text-muted-foreground hover:text-primary transition-colors">
                    Ver todos los logros
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
