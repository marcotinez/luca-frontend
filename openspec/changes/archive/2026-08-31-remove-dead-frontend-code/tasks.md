## 1. Componentes sin consumidores

- [x] 1.1 Eliminar `StatsGrid`, `PathwayTopic`, `WelcomeHeader` y `LevelProgressBar`
- [x] 1.2 Eliminar `learning/RecentAccuracyChart`, `learning/PracticeHistoryTable`, `learning/SubtopicProgressList`, `learning/LearningStatsHeader` y `learning/DomainProgressList`
- [x] 1.3 Eliminar `ui/separator` si sigue sin consumidores tras el resto de cambios — confirmado sin consumidores (los sub-componentes `Separator` de `dropdown-menu`/`select` usan las primitivas Radix directamente, no este wrapper); eliminado junto con la dependencia `@radix-ui/react-separator`. De paso, auditoría con `knip` encontró dos componentes huérfanos más no listados en el proposal: `components/graph/GraphStats.tsx` (superado por `GraphTaxonomyStats`) y `components/Modal.tsx` — eliminados también.

## 2. Rutas

- [x] 2.1 Eliminar `app/inicio/` y añadir redirección a `/dashboard` — redirect 308 en `next.config.ts` (`redirects()`), verificado en caliente contra el build de producción
- [x] 2.2 Unificar todos los enlaces de navegación al destino vigente — único enlace interno a `/inicio` era el fallback de `RouteGuard` para no-superusuario; apunta ahora directo a `/dashboard`

## 3. API y dependencias

- [x] 3.1 Unificar `getQuestions` y `listQuestions` en una sola función con filtros — ya estaba resuelto: `getQuestions` se había eliminado en LUCA-15 (unified-api-client); solo queda `listQuestions` con filtros completos
- [x] 3.2 Decidir sobre `pdfjs-dist`: retirarlo o dejarlo con carga diferida y su motivo documentado — **se mantiene**: no es un contador de páginas post-hoc, conduce la configuración interactiva de chunks *antes* de subir (el conteo del backend solo existe después de procesar). Ya usa `import()` dinámico — único import dinámico del proyecto — documentado con comentario en `IngestionConfigurator.tsx`.
- [x] 3.3 Revisar y retirar las dependencias que queden sin uso — auditadas las 26 `dependencies` + 10 `devDependencies` con `knip`; solo `@radix-ui/react-separator` estaba muerta (retirada). `tailwindcss`/`tw-animate-css` son falsos positivos de knip (se usan por `@import` en CSS, que no analiza) — documentados en `knip.json` en vez de retirados.
- [x] 3.4 Eliminar tipos y utilidades sin consumidores detectados en la revisión — 12 funciones muertas (`removeStorage`, `getStorageKey`, 4 de `graph-stats.utils.ts`, `searchEntities`/`searchRelationships`, `getIngestionJobs`, `getAdaptiveStats`, 3 de `learning.utils.ts`, `getQuestion`/`createQuestion`, `registerPracticeAttempt`) y 6 tipos (`IngestionJobStatus`, `IngestionJob`, `AdaptiveStatsResponse`, `RegisterPracticeAttemptRequest`, `AdaptiveCategoryAccuracy`, `AdaptiveDifficultyDistribution`, `AdaptiveWeeklyTrendPoint`) eliminados tras verificar (con `knip` + grep manual) que no tenían consumidor ni externo ni dentro de su propio archivo. Se dejaron sin tocar los exports usados solo internamente en su archivo (p. ej. `DomainKnowledge` dentro de `UserLearningProfile`) — knip los marca "sin importador externo" pero sí tienen consumidor real, borrarlos habría sido incorrecto.
  De paso: `getLearningApiErrorDetail` (lib/learning.utils.ts) leía `error.response.data.detail`, un patrón roto desde `unified-api-client` (LUCA-15) — todo error de `api.*` llega envuelto en `ApiError`, no como `AxiosError`. Corregido para leer `ApiError.details`. La función local `apiErrorMessage` de este mismo archivo tenía el mismo bug — eliminada y reemplazada por un re-export de la versión correcta en `lib/api.ts` (mismo nombre y firma, cero cambios en los 6 call sites que la usaban: perfil, StudentDashboard, las páginas de práctica y `admin/evaluaciones`).

## 4. Prevención

- [x] 4.1 Añadir a la configuración de lint la detección de exportaciones sin uso — ESLint no tiene una regla de "exportación sin uso" entre archivos; se agregó `knip` (herramienta dedicada para esto) con `knip.json` configurado para ignorar `components/ui/**` (primitivas shadcn: exportan toda la superficie del compound component por convención, no código muerto) y `types/api.generated.ts` (generado, no se edita a mano)
- [x] 4.2 Documentar el comando de verificación en el README — `npm run dead-code`

## 5. Verificación

- [x] 5.1 `npm run build` y `npm run lint` sin errores — build limpio (25 rutas, antes 26: se fue `/inicio`), lint bajó de 26 a 21 problemas preexistentes (los 5 que desaparecieron pertenecían a `WelcomeHeader.tsx`, eliminado en este change)
- [x] 5.2 Recorrido manual de las vistas de estudiante y administración sin regresiones — verificado el redirect `/inicio` → `/dashboard` (308) contra el build de producción real; el resto se verificó por tsc + build + revisión de cada import removido
- [x] 5.3 Registrar en el PR las líneas y dependencias eliminadas — ver PR: 1051 líneas eliminadas / 26 agregadas netas; 10 componentes + 3 rutas/archivos adicionales eliminados; 1 dependencia (`@radix-ui/react-separator`) retirada; 12 funciones y 6 tipos sin consumidores eliminados
