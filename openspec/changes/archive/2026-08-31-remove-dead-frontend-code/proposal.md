## Why

Hay 613 líneas de componentes que no importa nadie: `StatsGrid`, `PathwayTopic`, `WelcomeHeader`, `LevelProgressBar`, `learning/RecentAccuracyChart`, `learning/PracticeHistoryTable`, `learning/SubtopicProgressList`, `learning/LearningStatsHeader`, `learning/DomainProgressList` y `ui/separator`. Varios son restos de una versión anterior del panel del estudiante.

Además `/inicio` y `/dashboard` son dos rutas distintas que renderizan exactamente el mismo componente (`<StudentDashboard />`), y la navegación enlaza unas veces a una y otras veces a la otra. `questions.api` expone `getQuestions` y `listQuestions`, que hacen lo mismo con firmas distintas. Y `pdfjs-dist` (unos cuantos megabytes) se carga solo para contar las páginas de un PDF antes de subirlo, un dato que el backend ya devuelve al procesarlo.

## What Changes

- Se eliminan los diez componentes sin consumidores.
- **BREAKING** (rutas): `/inicio` desaparece y redirige a `/dashboard`; toda la navegación apunta a una sola ruta.
- Se unifican `getQuestions` y `listQuestions` en una sola función con filtros.
- Se revisa `pdfjs-dist`: si su único uso es previsualizar el número de páginas, se sustituye por la sugerencia de fragmentos que devuelve el backend y se retira la dependencia; si aporta valor real al operador, se mantiene con carga diferida documentada.
- Se revisan y retiran las dependencias sin uso que queden tras los cambios anteriores.
- Se eliminan los tipos y utilidades sin consumidores que aparezcan en la revisión (`types/`, `lib/*.utils.ts`).
- Se activa una verificación de código muerto en el flujo de desarrollo (regla de lint de exportaciones sin uso) para que no vuelva a acumularse.

## Capabilities

### New Capabilities
- `client-hygiene`: mantenimiento del cliente web — ausencia de código y rutas sin consumidores, dependencias justificadas y verificación automatizada.

### Modified Capabilities

## Impact

- `components/` (diez archivos eliminados), `app/inicio/` (eliminado), `app/dashboard/`.
- `lib/questions.api.ts`, `components/ingestion/IngestionConfigurator.tsx`, `package.json`.
- `components/DashboardNavbar.tsx` y demás enlaces de navegación.
