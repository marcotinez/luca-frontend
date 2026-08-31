## 1. Hooks de datos

- [ ] 1.1 Crear `useSnapshots` (lista, snapshot activo, progreso, acciones de crear, refrescar y borrar)
- [ ] 1.2 Crear `useSelectionRun` (crear lote, lanzar, cancelar, progreso) contra los endpoints del ejecutor de servidor
- [ ] 1.3 Encapsular el polling con intervalo adaptativo, pausa con la pestaña oculta y cancelación al desmontar

## 2. Eliminar el ejecutor del navegador

- [ ] 2.1 Sustituir el bucle de ejecución por la llamada al ejecutor del servidor
- [ ] 2.2 Eliminar los estados de concurrencia, errores consecutivos, tiempos y conteos locales
- [ ] 2.3 Eliminar `localUnitStatuses` y `localSelectionStats`, mostrando el estado que devuelve el servidor

## 3. Dividir la consola

- [ ] 3.1 Extraer el formulario de snapshot, la lista de snapshots y el panel de progreso
- [ ] 3.2 Extraer la tabla de unidades con sus filtros y el panel de lote
- [ ] 3.3 Extraer el visor de traza y reutilizarlo en la vista de ejecuciones
- [ ] 3.4 Mover los filtros a parámetros de la dirección y resolverlos en el servidor con paginación

## 4. Trazas

- [ ] 4.1 Reescribir `/admin/openai-logs` contra el endpoint de ejecuciones, con filtros y paginación
- [ ] 4.2 Eliminar `lib/openai-logs.storage.ts` y sus llamadas
- [ ] 4.3 Renombrar la entrada de navegación a un nombre acorde a su contenido real

## 5. Verificación

- [ ] 5.1 Comprobar que un lote continúa tras cerrar y reabrir la pestaña
- [ ] 5.2 Comprobar que la cancelación se refleja y libera unidades
- [ ] 5.3 Comprobar que los filtros se restauran desde la dirección de la página
- [ ] 5.4 Comprobar que las trazas se ven desde otro navegador
- [ ] 5.5 `npm run build` y `npm run lint` sin errores; registrar la reducción de líneas de la página
