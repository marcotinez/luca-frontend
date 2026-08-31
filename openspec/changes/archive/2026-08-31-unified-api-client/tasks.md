## 1. Instancia compartida

- [x] 1.1 Crear `lib/api.ts` con la instancia de axios, `baseURL` y tiempos de espera
- [x] 1.2 Mover al interceptor de petición la inyección de la credencial de sesión
- [x] 1.3 Mover al interceptor de respuesta la renovación con deduplicación y el cierre de sesión ante fallo
- [x] 1.4 Definir `ApiError` y traducir en un único lugar las respuestas de error del backend

## 2. Migrar módulos

- [x] 2.1 Migrar `auth.api` y eliminar el registro de interceptores sobre la instancia global
- [x] 2.2 Migrar `users.api`, `questions.api`, `learning.api` y `admin.api`, eliminando sus `authHeaders()`
- [x] 2.3 Migrar `graph.api`, `ingestion.api` y el módulo de generación
- [x] 2.4 Eliminar la caché manual de conteos por categoría de `questions.api`
- [x] 2.5 Unificar `getQuestions` y `listQuestions` en una sola función con filtros

## 3. Consumidores

- [x] 3.1 Actualizar los `catch` de páginas y componentes para usar `ApiError`
- [x] 3.2 Mostrar el detalle estructurado de disponibilidad de preguntas usando el nuevo error

## 4. Verificación

- [x] 4.1 Comprobar que una página que no importa el módulo de autenticación envía igualmente la credencial
- [x] 4.2 Comprobar que dos peticiones que fallan a la vez disparan una sola renovación
- [x] 4.3 Comprobar que un fallo de renovación limpia la sesión y redirige
- [x] 4.4 `npm run build` y `npm run lint` sin errores

## Notas de implementación

- **Hallazgo no previsto**: `eslint.config.mjs` no excluía `public/**` de sus
  `globalIgnores`. `public/pdf.worker.min.mjs` (vendor de pdfjs, una sola
  línea minificada) generaba ~1500 falsos positivos que ahogaban cualquier
  hallazgo real de `npm run lint`. Se corrigió antes de poder usar el lint
  como verificación de este change.
- `lib/questions.api.ts`: `getQuestions` ya no tenía consumidores (verificado
  antes de tocarlo) — se elimina de una vez en vez de dejarlo para
  `remove-dead-frontend-code`, ya que el archivo se estaba migrando de todos
  modos.
- `refreshAccessTokenOnce` se exporta desde `api.ts` y `auth.api.ts` la
  reutiliza para `refreshToken()`: la renovación proactiva de `useAuth` y la
  automática por 401 comparten la misma promesa en vuelo, no solo esta última.
- `lib/prompt-generation.api.ts` (1207 líneas, 17 llamadas HTTP) mantenía su
  propia resolución de base URL con un parámetro `baseUrl?` que ningún
  llamador pasaba nunca (verificado por grep); se retira junto con
  `resolveApiBase`. También era el único módulo con `withCredentials: true`
  en cada llamada — innecesario para autenticación por Bearer token y
  inconsistente con el resto de módulos; se retira por consistencia.
- Verificado de extremo a extremo contra el backend real (no solo build):
  login, `/auth/me`, `/admin/config`, `/auth/refresh` con las rutas y formas
  exactas que arma el cliente nuevo, y `/graph/stats` sin token devolviendo
  401 (confirma que el interceptor de autenticación es justo lo que faltaba
  ahí, ya que ese módulo nunca había tenido headers de auth).
- `.gitignore` no cubría `.env.local` (solo `.env` exacto), pese a que el
  proyecto documenta `.env.local.example`; se corrige.
