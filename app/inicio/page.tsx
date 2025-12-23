'use client';

// React and hooks
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useRouter } from 'next/navigation';

// Design components and icons
import { User, Target, Trophy, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// Components
import { DashboardNavbar } from '@/components/DashboardNavbar';
import { WelcomeHeader } from '@/components/WelcomeHeader';
import { StatsGrid } from '@/components/StatsGrid';
import { LevelProgressBar } from '@/components/LevelProgressBar';
import { UserInfoItem } from '@/components/UserInfoItem';

///////////////////////////////////////////

export default function PaginaInicio() {
  const { user } = useAuth();
  const router = useRouter();
  if (!user) return null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <DashboardNavbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          <WelcomeHeader
            email={user.email}
            totalXp={user.gamification.total_xp}
            currentStreak={user.gamification.current_streak}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Perfil Card */}
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Tu Perfil</CardTitle>
                </div>
                <CardDescription>Información general de tu cuenta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <UserInfoItem
                  icon={<Target className="w-4 h-4" />}
                  label="Edad"
                  value={`${user.profile.age} años`}
                  orientation="horizontal"
                />
                <Separator />
                <UserInfoItem
                  icon={<GraduationCap className="w-4 h-4" />}
                  label="Educación"
                  value={user.profile.education_level}
                  orientation="horizontal"
                />
                <Button className="w-full mt-4" variant="outline" onClick={() => router.push('/perfil')}>
                  Ver Detalles
                </Button>
              </CardContent>
            </Card>

            {/* Gamificación Card */}
            <Card className="shadow-sm hover:shadow-md transition-shadow lg:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <CardTitle className="text-lg">Gamificación</CardTitle>
                </div>
                <CardDescription>Tu progreso y logros actuales</CardDescription>
              </CardHeader>
              <CardContent>
                <StatsGrid
                  totalXp={user.gamification.total_xp}
                  currentStreak={user.gamification.current_streak}
                  maxStreak={user.gamification.max_streak}
                />

                <div className="mt-8">
                  <LevelProgressBar totalXp={user.gamification.total_xp} />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

