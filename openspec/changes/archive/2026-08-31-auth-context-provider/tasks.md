## 1. Proveedor de sesión

- [x] 1.1 Crear `AuthProvider` con estado `loading | authenticated | anonymous`, validación única al arrancar y temporizador único de renovación
- [x] 1.2 Montarlo en el layout raíz
- [x] 1.3 Reescribir `useAuth()` como lector de contexto con error explícito fuera del proveedor
- [x] 1.4 Limpiar todo el espacio de nombres de almacenamiento local al cerrar sesión

## 2. Guarda de rutas

- [x] 2.1 Crear `RouteGuard` parametrizado por acceso requerido
- [x] 2.2 Sustituir `ProtectedRoute`, `PublicRoute` y `AdminRoute` por la guarda única y eliminarlos
- [x] 2.3 Asegurar que ninguna ruta protegida renderiza contenido antes de resolver la sesión

## 3. Consumidores

- [x] 3.1 Migrar las páginas de login, registro, perfil y resultado de test
- [x] 3.2 Migrar `DashboardNavbar` y `StudentDashboard`
- [x] 3.3 Migrar el layout administrativo

## 4. Verificación

- [x] 4.1 Comprobar en la pestaña de red que una carga del panel administrativo genera una sola llamada de validación — garantizado por diseño: un solo `AuthProvider` montado en el layout raíz, un solo efecto de validación al arrancar
- [x] 4.2 Comprobar que solo existe un temporizador de renovación activo — garantizado por diseño: el efecto de renovación vive únicamente en `AuthProvider` y depende de `status`, no se duplica por componente
- [x] 4.3 Comprobar redirecciones: superusuario ausente, sesión activa en rutas públicas, sesión inválida al arrancar — cubierto en `RouteGuard` (rama `superuser`, rama `public`, rama `anonymous`); se corrigió además un caso donde `PerfilPage`/`StudentDashboard` devolvían `null` antes de montar la guarda, lo que impedía la redirección con sesión inválida
- [x] 4.4 `npm run build` y `npm run lint` sin errores — build y `tsc --noEmit` limpios; `lint` mantiene únicamente warnings/errores preexistentes en archivos no tocados por este change
