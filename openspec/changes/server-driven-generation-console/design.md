## Context

El componente actual mantiene, entre otros, `selectionConcurrency`, `selectionRunStartedAt`, `selectionRunProcessedUnits`, `selectionConsecutiveErrors`, `localSelectionStats` y `localUnitStatuses`: un modelo de ejecución completo replicado en el cliente porque el servidor no ofrecía uno. Con el ejecutor en servidor, todo ese estado desaparece y se sustituye por el progreso que devuelve la API.

Las trazas se guardan con `addOpenAILog` en `localStorage` en dos puntos del flujo, y `/admin/openai-logs` las lee de ahí. El backend ya guarda cada ejecución con prompts, respuestas crudas, iteraciones y rúbrica.

## Goals / Non-Goals

**Goals:**
- Que cerrar la pestaña no afecte a un lote.
- Que la consola sea legible: componentes pequeños con una responsabilidad.
- Que las trazas sean las del servidor, compartidas por todo el equipo.

**Non-Goals:**
- Rediseño visual de la consola (se conserva la estructura de la interfaz actual).
- Añadir gestión de permisos más fina que superusuario.
- Ejecución de lotes desde el cliente como alternativa.

## Decisions

- **Polling con intervalo adaptativo** en lugar de un intervalo fijo: rápido mientras hay un lote activo, lento cuando no lo hay, detenido cuando la pestaña está oculta. Alternativa descartada: WebSockets/SSE, que exigen infraestructura adicional para un panel que usa una persona a la vez.
- **Dos hooks de datos, no una máquina de estados global**: `useSnapshots` (lista, snapshot activo, progreso) y `useSelectionRun` (lote actual, progreso, acciones). Cubren el estado real sin introducir una librería de gestión de estado.
- **Filtros en la URL**: los filtros de unidades pasan a parámetros de búsqueda; se pierde una vista "de una sola pantalla" y se gana poder compartir el enlace y no recargar todo al volver.
- **Visor de traza contra la API**: el mismo componente sirve para la traza de una unidad y para la página de ejecuciones, apuntando al endpoint de runs.

## Risks / Trade-offs

- [El polling añade peticiones periódicas] → Intervalo adaptativo y detención con la pestaña oculta; el coste es menor que el actual, que además ejecutaba las unidades desde el navegador.
- [Perder las trazas ya guardadas en `localStorage`] → Son locales a un navegador y no reproducibles; se documenta la retirada y se comprueba que el backend cubre el caso de uso antes de eliminar el módulo.
- [Dividir un componente de 2000 líneas puede introducir regresiones] → Se divide por secciones ya delimitadas en la interfaz actual, moviendo bloques completos sin reescribir su lógica de presentación.

## Migration Plan

1. Introducir los hooks de datos y el polling encapsulado, manteniendo la interfaz.
2. Sustituir el bucle de ejecución por las llamadas al ejecutor del servidor.
3. Dividir el componente en piezas.
4. Migrar la página de trazas a la API y eliminar el almacenamiento local.

Rollback: los pasos 1 y 3 no cambian comportamiento; el 2 depende del backend ya desplegado.

## Open Questions

- Ninguna abierta.
