## Why

`useAuth()` es un hook con estado local, no un contexto. Nueve componentes lo llaman (`ProtectedRoute`, `PublicRoute`, `AdminRoute`, `DashboardNavbar`, `StudentDashboard`, y las páginas de login, registro, perfil y resultado de test). Cada instancia mantiene su propio `user` y `loading`, dispara su propia petición `/auth/me` al montar y **programa su propio temporizador de renovación de token**. En una vista administrativa típica hay tres o cuatro montados a la vez: tres o cuatro llamadas a `/me` idénticas en cada navegación y tres o cuatro temporizadores compitiendo por renovar la misma sesión.

Además, cada componente de guarda repite la misma lógica de "si no hay usuario y terminó de cargar, redirige", con parpadeo de contenido mientras `loading` es cierto, y la sesión se guarda en `localStorage` sin ninguna validación de expiración más allá del `exp` decodificado a mano en el hook.

## What Changes

- Un `AuthProvider` en el layout raíz mantiene la sesión: un único estado, una única llamada de validación al arrancar y un único temporizador de renovación para toda la aplicación.
- `useAuth()` pasa a leer el contexto; deja de tener estado ni efectos propios.
- **BREAKING** (interno): usar `useAuth()` fuera del proveedor lanza un error explícito en desarrollo.
- Un único componente de guarda parametrizado por rol requerido (`public`, `authenticated`, `superuser`) sustituye a `ProtectedRoute`, `PublicRoute` y `AdminRoute`.
- Estado de sesión explícito (`loading` | `authenticated` | `anonymous`) para eliminar el parpadeo: las guardas no renderizan contenido hasta que el estado se resuelve.
- La renovación proactiva se calcula una vez a partir de la expiración del token y se cancela al cerrar sesión.
- Al cerrar sesión se limpia todo el espacio de nombres de almacenamiento local de la aplicación, no solo las dos claves de sesión.

## Capabilities

### New Capabilities
- `session-management`: gestión de la sesión del usuario en el cliente — inicio y cierre de sesión, registro, validación al arrancar, renovación proactiva del token y control de acceso a rutas por rol.

### Modified Capabilities

## Impact

- `hooks/useAuth.ts`, nuevo `components/auth/AuthProvider.tsx` y `components/auth/RouteGuard.tsx`.
- Se eliminan `components/ProtectedRoute.tsx`, `components/PublicRoute.tsx` y `components/AdminRoute.tsx` en favor de la guarda única.
- `app/layout.tsx`, `app/admin/layout.tsx`, `components/admin/AdminLayoutShell.tsx` y las páginas que usan guardas.
- Depende de `unified-api-client` para el refresco centralizado.
