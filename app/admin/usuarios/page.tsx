'use client';

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { getUsers, deleteUser, toggleUserStatus, createUser, updateUser } from "@/lib/users.api";
import { UserResponse, EducationLevel, FinancialTopic, RegisterRequest } from "@/types";

// Design Components
import { Trash2, UserX, UserCheck, Mail, Calendar, Shield,
         MoreVertical, Search, RefreshCcw, UserPlus, Pencil } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

//////////////////////////////////////////

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Estados para Creación/Edición
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);

  const userSchema = z.object({
    email: z.email({ message: "Email inválido" }),
    password: z.string().min(6, "Mínimo 6 caracteres").optional().or(z.literal("")),
    age: z.number().min(18).max(120),
    education_level: z.enum(EducationLevel),
    interests: z.array(z.enum(FinancialTopic)).min(1, "Selecciona al menos uno"),
  });

  type UserFormValues = z.infer<typeof userSchema>;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: "",
      password: "",
      age: 18,
      education_level: EducationLevel.MEDIA_INCOMPLETA,
      interests: [],
    }
  });

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsuarios(data);
    } catch (error) {
      toast.error("Error al cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleToggleStatus = async (usuario: UserResponse) => {
    try {
      await toggleUserStatus(usuario.id);
      toast.success(`Estado de ${usuario.email} actualizado`);
      fetchUsuarios();
    } catch (error) {
      toast.error("Error al actualizar el estado");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteUser(deleteId);
      toast.success("Usuario eliminado");
      fetchUsuarios();
    } catch (error) {
      toast.error("Error al eliminar el usuario");
    } finally {
      setDeleteId(null);
    }
  };
  const handleSaveUser = async (values: UserFormValues) => {
    try {
      if (editingUser) {
        // Actualizar
        const updateData = { ...values };
        if (!updateData.password) delete updateData.password;
        await updateUser(editingUser.id, updateData);
        toast.success("Usuario actualizado");
      } else {
        // Crear
        if (!values.password) {
          toast.error("La contraseña es requerida para nuevos usuarios");
          return;
        }
        await createUser(values as RegisterRequest);
        toast.success("Usuario creado");
      }
      setIsUserDialogOpen(false);
      fetchUsuarios();
    } catch (error) {
      toast.error("Error al guardar usuario");
    }
  };

  const filteredUsuarios = usuarios.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Administra las cuentas y permisos de los usuarios de Luca.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button variant="outline" onClick={fetchUsuarios} disabled={loading} className="w-full sm:w-auto">
            <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button variant="default" className="w-full sm:w-auto" onClick={() => {
            setEditingUser(null);
            form.reset({
              email: "",
              password: "",
              age: 18,
              education_level: EducationLevel.MEDIA_INCOMPLETA,
              interests: [],
            });
            setIsUserDialogOpen(true);
          }}>
            <UserPlus className="w-4 h-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Listado de Usuarios</CardTitle>
              <CardDescription>Total: {usuarios.length} usuarios registrados.</CardDescription>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left font-medium py-4 px-2">Usuario</th>
                  <th className="text-left font-medium py-4 px-2">Estado</th>
                  <th className="text-left font-medium py-4 px-2">Rol</th>
                  <th className="text-left font-medium py-4 px-2">Registro</th>
                  <th className="text-right font-medium py-4 px-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-muted-foreground">
                      Cargando listado...
                    </td>
                  </tr>
                ) : filteredUsuarios.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-muted-foreground">
                      No se encontraron usuarios.
                    </td>
                  </tr>
                ) : (
                  filteredUsuarios.map((u) => (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-2">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{u.email.split('@')[0]}</span>
                          <span className="text-xs text-muted-foreground flex items-center mt-0.5">
                            <Mail className="w-3 h-3 mr-1" />
                            {u.email}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <Badge variant={u.is_active ? "secondary" : "destructive"} className="text-[10px] uppercase font-bold tracking-wider">
                          {u.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="py-4 px-2">
                        {u.is_superuser ? (
                          <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-[10px] uppercase font-bold tracking-wider">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                            Usuario
                          </Badge>
                        )}
                      </td>
                      <td className="py-4 px-2">
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(u.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleToggleStatus(u)}>
                              {u.is_active ? (
                                <><UserX className="w-4 h-4 mr-2" /> Desactivar</>
                              ) : (
                                <><UserCheck className="w-4 h-4 mr-2" /> Activar</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setEditingUser(u);
                              form.reset({
                                email: u.email,
                                password: "",
                                age: u.profile.age,
                                education_level: u.profile.education_level,
                                interests: u.profile.interests,
                              });
                              setIsUserDialogOpen(true);
                            }}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive focus:bg-destructive/5"
                              onClick={() => setDeleteId(u.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar usuario?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminarán permanentemente los datos
              del usuario y su progreso en el sistema.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Confirmar Eliminación</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar Usuario" : "Crear Usuario"}</DialogTitle>
            <DialogDescription>
              {editingUser ? "Modifica los datos del usuario aquí." : "Completa los datos para el nuevo usuario."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveUser)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="email@ejemplo.com" {...field} />
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
                    <FormLabel>{editingUser ? "Nueva Contraseña (opcional)" : "Contraseña"}</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Edad</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={e => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                          />
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
                      <FormLabel>Educación</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(EducationLevel).map(level => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="interests"
                render={() => (
                  <FormItem>
                    <div className="mb-2">
                      <FormLabel>Temas de Interés</FormLabel>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 border border-border rounded-lg bg-muted/30">
                    {Object.values(FinancialTopic).map((topic) => (
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
                              <FormLabel className="text-xs font-normal cursor-pointer leading-tight">
                                {topic}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4 gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
