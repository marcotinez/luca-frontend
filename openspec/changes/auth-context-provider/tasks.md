## 1. Proveedor de sesión

- [ ] 1.1 Crear `AuthProvider` con estado `loading | authenticated | anonymous`, validación única al arrancar y temporizador único de renovación
- [ ] 1.2 Montarlo en el layout raíz
- [ ] 1.3 Reescribir `useAuth()` como lector de contexto con error explícito fuera del proveedor
- [ ] 1.4 Limpiar todo el espacio de nombres de almacenamiento local al cerrar sesión

## 2. Guarda de rutas

- [ ] 2.1 Crear `RouteGuard` parametrizado por acceso requerido
- [ ] 2.2 Sustituir `ProtectedRoute`, `PublicRoute` y `AdminRoute` por la guarda única y eliminarlos
- [ ] 2.3 Asegurar que ninguna ruta protegida renderiza contenido antes de resolver la sesión

## 3. Consumidores

- [ ] 3.1 Migrar las páginas de login, registro, perfil y resultado de test
- [ ] 3.2 Migrar `DashboardNavbar` y `StudentDashboard`
- [ ] 3.3 Migrar el layout administrativo

## 4. Verificación

- [ ] 4.1 Comprobar en la pestaña de red que una carga del panel administrativo genera una sola llamada de validación
- [ ] 4.2 Comprobar que solo existe un temporizador de renovación activo
- [ ] 4.3 Comprobar redirecciones: superusuario ausente, sesión activa en rutas públicas, sesión inválida al arrancar
- [ ] 4.4 `npm run build` y `npm run lint` sin errores
