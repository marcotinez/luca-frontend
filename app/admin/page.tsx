'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import withAuth from '@/components/auth/withAuth';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User } from '@/types';
import { Trash2, ArrowLeft, ShieldAlert, Users, Search, Mail, GraduationCap, Tag } from 'lucide-react';

function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users');
        setUsers(response.data);
        setFilteredUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.profile?.education_level?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const handleDelete = async () => {
    if (!userToDelete) return;

    try {
      await api.delete(`/users/${userToDelete}`);
      setUsers(users.filter(u => u.id !== userToDelete));
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error al eliminar usuario');
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent mb-2 flex items-center gap-3">
              <ShieldAlert className="h-10 w-10" />
              Panel de Administración
            </h1>
            <p className="text-muted-foreground text-lg">Gestiona los usuarios y permisos de la plataforma.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-emerald-500/20 shadow-2xl hover:bg-primary/10 hover:border-emerald-500/50 transition-all duration-300 ease-in-out"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Button>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-6 md:grid-cols-3"
        >
          <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-emerald-500/20 shadow-2xl transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
              <Users className="h-5 w-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">{users.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Registrados en la plataforma
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-emerald-500/20 shadow-2xl transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
              <Users className="h-5 w-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                En los últimos 30 días
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-emerald-500/20 shadow-2xl transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Retención</CardTitle>
              <Users className="h-5 w-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">94%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Usuarios recurrentes
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl border border-emerald-500/40 shadow-2xl border-emerald-500/30">
            <CardHeader>
              <CardTitle className="text-xl">Usuarios Registrados</CardTitle>
              <CardDescription>Gestiona y visualiza todos los usuarios del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar por email o nivel educativo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-emerald-500/30 shadow-xl h-11 border-emerald-500/20 focus:border-emerald-500/50 transition-all duration-300 ease-in-out"
                />
              </div>

              {loading ? (
                <div className="flex justify-center p-12">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-12 w-12 rounded-full border-4 border-emerald-500/30 border-t-primary"
                  />
                </div>
              ) : (
                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                  <AnimatePresence>
                    {filteredUsers.map((user) => (
                      <motion.div
                        key={user.id}
                        variants={item}
                        layout
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-emerald-500/20 shadow-2xl border-emerald-500/20 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl group h-full">
                          <CardContent className="p-6 space-y-4">
                            {/* Avatar */}
                            <div className="flex items-start justify-between">
                              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-xl font-bold shadow-lg">
                                {user.email.charAt(0).toUpperCase()}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out"
                                onClick={() => setUserToDelete(user.id)}
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </div>

                            {/* User Info */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium truncate">{user.email}</span>
                              </div>

                              {user.profile?.age && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span className="font-medium">Edad:</span>
                                  <span>{user.profile.age} años</span>
                                </div>
                              )}

                              {user.profile?.education_level && (
                                <div className="flex items-start gap-2 text-sm">
                                  <GraduationCap className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                  <span className="text-muted-foreground">{user.profile.education_level}</span>
                                </div>
                              )}

                              {user.profile?.interests && user.profile.interests.length > 0 && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Tag className="h-4 w-4" />
                                    <span className="font-medium">Intereses:</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {user.profile.interests.slice(0, 3).map(interest => (
                                      <span
                                        key={interest}
                                        className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-2 py-1 text-xs font-medium border border-emerald-500/20"
                                      >
                                        {interest.split(' ').slice(0, 2).join(' ')}
                                      </span>
                                    ))}
                                    {user.profile.interests.length > 3 && (
                                      <span className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-2 py-1 text-xs font-medium border border-emerald-500/20">
                                        +{user.profile.interests.length - 3}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}

              {!loading && filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No se encontraron usuarios</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
          <DialogContent className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl border border-emerald-500/40 shadow-2xl border-emerald-500/30">
            <DialogHeader>
              <DialogTitle className="text-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">¿Estás absolutamente seguro?</DialogTitle>
              <DialogDescription className="text-base">
                Esta acción no se puede deshacer. Esto eliminará permanentemente al usuario y todos sus datos asociados.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setUserToDelete(null)}
                className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-emerald-500/20 shadow-2xl hover:bg-muted/50"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                Eliminar Usuario
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default withAuth(AdminPage, true);
