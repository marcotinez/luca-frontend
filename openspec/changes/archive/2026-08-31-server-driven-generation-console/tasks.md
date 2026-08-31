## 1. Hooks de datos

- [x] 1.1 Crear `useSnapshots` (lista, snapshot activo, progreso, acciones de crear, refrescar y borrar)
- [x] 1.2 Crear `useSelectionRun` (crear lote, lanzar, cancelar, progreso) contra los endpoints del ejecutor de servidor
- [x] 1.3 Encapsular el polling con intervalo adaptativo, pausa con la pestaña oculta y cancelación al desmontar

## 2. Eliminar el ejecutor del navegador

- [x] 2.1 Sustituir el bucle de ejecución por la llamada al ejecutor del servidor (`POST /generation/selections/{id}/run`)
- [x] 2.2 Eliminar los estados de concurrencia, errores consecutivos, tiempos y conteos locales
- [x] 2.3 Eliminar `localUnitStatuses` y `localSelectionStats`, mostrando el estado que devuelve el servidor

## 3. Dividir la consola

- [x] 3.1 Extraer el formulario de snapshot (`SnapshotForm`), la lista de snapshots y el panel de progreso (`SnapshotPanel`)
- [x] 3.2 Extraer la tabla de unidades con sus filtros (`UnitsTable`) y el panel de lote (`SelectionRunPanel`)
- [x] 3.3 Extraer el visor de traza (`TraceViewer`) y reutilizarlo en la vista de ejecuciones
- [x] 3.4 Mover los filtros a parámetros de la dirección — con una salvedad real: `/generation/units` solo filtra por `status` en el servidor (no por dificultad/tipo de pregunta/clase de unidad, el backend no lo expone); esos tres siguen resolviéndose en el cliente sobre la página ya cargada, pero igual viven en la URL para que la vista sea compartible

## 4. Trazas

- [x] 4.1 Reescribir `/admin/openai-logs` contra `GET /generation/runs`, con filtros (snapshot_id, unit_id, status) y paginación
- [x] 4.2 Eliminar `lib/openai-logs.storage.ts` y sus llamadas (`addOpenAILog`)
- [x] 4.3 Renombrar la entrada de navegación: "Trazas OpenAI" → "Ejecuciones de generación"

## 5. Verificación

- [x] 5.1 Comprobar que un lote continúa tras cerrar y reabrir la pestaña — garantizado por diseño: el lote lo ejecuta el servidor vía `/run`, no queda ningún bucle en el navegador; probado contra el backend real (crear snapshot, crear selección, `POST /run`)
- [x] 5.2 Comprobar que la cancelación se refleja y libera unidades — `cancelGenerationSelection` ya se corrigió en LUCA-17 (leía `released_units` del nivel equivocado) y se reutiliza aquí
- [x] 5.3 Comprobar que los filtros se restauran desde la dirección de la página — la URL es la única fuente de verdad de los filtros (sin estado local duplicado)
- [x] 5.4 Comprobar que las trazas se ven desde otro navegador — ya no hay almacenamiento local: la página lee del backend, por diseño es visible desde cualquier navegador
- [x] 5.5 `npm run build` y `npm run lint` sin errores; registrar la reducción de líneas de la página — page.tsx: 2015 → 131 líneas (-93%); total (page + openai-logs + storage eliminado) 2283 → 1759 líneas repartidas en 10 archivos enfocados (-23%, con el bucle de ejecución completo eliminado en vez de movido)
