## Why

`app/admin/generador/page.tsx` son 2009 líneas en un único componente cliente con 36 `useState` y una decena de `useEffect`. Ahí dentro conviven: el formulario de creación de snapshots, el listado y borrado de snapshots, los filtros de unidades, el polling de progreso, el formulario de selección, **el bucle de ejecución del lote** (con su propia concurrencia, sus errores consecutivos, sus contadores de tiempo y su reintento), el registro de trazas en `localStorage` y el diálogo de confirmación de dificultad.

Que el lote lo conduzca el navegador significa que cerrar la pestaña lo detiene y deja unidades bloqueadas en el servidor. Y las trazas guardadas en `localStorage` (máximo 200 entradas, visibles solo en ese navegador) duplican peor lo que el backend ya persiste íntegro en cada ejecución.

## What Changes

- La consola pasa a ser cliente del ejecutor de lotes del servidor: lanza el lote, consulta progreso y muestra resultados. **Se elimina por completo el bucle de ejecución en el navegador**, su concurrencia, sus reintentos y sus contadores locales.
- **BREAKING**: se elimina el registro de trazas en `localStorage` (`lib/openai-logs.storage.ts`) y la página `/admin/openai-logs` pasa a leer las ejecuciones desde la API del backend, con filtros por snapshot, unidad y estado.
- La página se divide en componentes con responsabilidad única: formulario de snapshot, lista de snapshots, panel de progreso, tabla de unidades con filtros, panel de lote y visor de traza.
- El estado se agrupa en dos hooks de datos (`useSnapshots`, `useSelectionRun`) con polling encapsulado, cancelación al desmontar y refresco tras cada acción, en lugar de 36 estados sueltos.
- Los filtros de unidades (estado, dificultad, tipo, clase) se resuelven en el servidor y se reflejan en la URL, para que una vista filtrada sea compartible y no dependa de cargar todo en memoria.
- El progreso global (`/admin/generador/progreso-global`) consume el endpoint agregado, sin cálculos en el cliente.

## Capabilities

### New Capabilities
- `generation-console`: interfaz de administración para preparar, lanzar y supervisar la generación de preguntas — snapshots, lotes, progreso y trazas.

### Modified Capabilities

## Impact

- `app/admin/generador/page.tsx`, `app/admin/generador/progreso-global/page.tsx`, `app/admin/openai-logs/page.tsx`.
- `lib/openai-logs.storage.ts` (eliminado), módulo de generación de `lib/`.
- Nuevos componentes en `components/generation/` y hooks en `hooks/`.
- Depende de `server-side-generation-runner` en el backend, y de `unified-api-client` y `trust-typed-api-contracts`.
