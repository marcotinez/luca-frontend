# Guía Frontend - Implementación de Cambios Generación Snapshot V2

Fecha: 2026-04-13

## 1) Objetivo

Implementar en frontend el nuevo flujo de generación controlada por snapshot:

1. Mantener creación/refresh de snapshot.
2. Generar por lotes seleccionados (no por `next` ciego).
3. Ejecutar unidades una a una usando backend actual.
4. Permitir cancelar lote y retomar luego.
5. Mostrar progreso local por snapshot y progreso global histórico.

---

## 2) Cambios de API que frontend debe consumir

Base: `/api/v1/generation`

### Endpoints existentes (se mantienen)

- `POST /snapshots`
- `POST /snapshots/{snapshot_id}/refresh`
- `GET /snapshots/{snapshot_id}/progress`
- `POST /units/{unit_id}/execute`
- `POST /units/{unit_id}/retry`
- `GET /units?snapshot_id=...&status=...`

### Endpoints nuevos

- `GET /progress/global`
- `POST /selections`
- `GET /selections/{selection_id}`
- `POST /selections/{selection_id}/cancel`

---

## 3) Cambios UX/Producto requeridos

### 3.1 Crear snapshot

- Mantener selector de categoría/subtópico.
- En dificultad, default visual y payload sugerido: `Fácil` + `Medio`.
- `Difícil` puede seguir disponible como opción avanzada (backend lo acepta si se envía).
- Doble confirmación en frontend al activar `Difícil` (requisito de negocio actual).

### 3.2 Nueva pantalla/sección: “Generación por lote (selección)”

Inputs mínimos:
- `snapshot_id` (tomado del snapshot activo)
- `count` (ej: 500)
- `difficulties[]` (multi-select)
- `question_types[]` (multi-select, ej: `concepto_aplicado`, `ambito_cotidiano`)
- `unit_kind` (`entity|relation|all`)
- `include_failed` (checkbox, default true)

Acción:
- Botón `Crear selección` -> `POST /selections`.

Resultado esperado en UI:
- `selection_id`
- `claimed_count`
- listado (o contador) de `unit_ids`
- estado de selección (`active|completed|cancelled`)

### 3.3 Ejecución lote (unitario)

Regla:
- No existe `execute-batch` backend.
- Frontend debe iterar `unit_ids` y llamar `POST /units/{unit_id}/execute` uno por uno.

Comportamiento recomendado:
- Cola local con concurrencia controlada (recomendado: 1 a 3 máximo).
- Mostrar progreso de ejecución del lote:
  - total
  - ejecutadas ok
  - fallidas
  - pendientes
- Si falla una unidad, no detener todo el lote; continuar y marcar error en item.

### 3.4 Cancelación de lote

- Botón `Cancelar selección` -> `POST /selections/{selection_id}/cancel`.
- Efecto esperado:
  - Unidades de esa selección en `in_progress` regresan a `pending`.
- UI debe limpiar workers locales y dejar estado consistente.

### 3.5 Reanudación de lote

- Al volver a un snapshot, listar selecciones activas/recientes (si implementan listado local o cache).
- Para cada selección:
  - consultar `GET /selections/{selection_id}`
  - continuar ejecutando solo unidades no terminadas.

### 3.6 Progreso global

- Agregar dashboard/tabla con `GET /progress/global`:
  - métricas globales
  - por categoría
  - por dificultad
  - por categoría+dificultad

Nota:
- Es histórico simple (puede contar combinaciones repetidas entre snapshots).

---

## 4) Contratos sugeridos en frontend (TypeScript)

```ts
export type SelectionStatus = 'active' | 'cancelled' | 'completed';

export interface CreateSelectionRequest {
  snapshot_id: string;
  count: number;
  difficulties?: string[];
  question_types?: string[];
  unit_kind?: 'entity' | 'relation';
  include_failed?: boolean;
}

export interface SelectionResponse {
  selection_id: string;
  snapshot_id: string;
  status: SelectionStatus;
  requested_count: number;
  claimed_count: number;
  filters: Record<string, unknown>;
  unit_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface SelectionProgressResponse extends SelectionResponse {
  total_units: number;
  ok_units: number;
  failed_units: number;
  in_progress_units: number;
  pending_units: number;
}

export interface GlobalProgressBucket {
  key: string;
  total_units: number;
  pending_units: number;
  in_progress_units: number;
  ok_units: number;
  failed_units: number;
  completion_ratio: number;
}

export interface GlobalProgressCategoryDifficultyBucket {
  category: string;
  difficulty: string;
  total_units: number;
  pending_units: number;
  in_progress_units: number;
  ok_units: number;
  failed_units: number;
  completion_ratio: number;
}

export interface GlobalProgressResponse {
  snapshot_count: number;
  total_units: number;
  pending_units: number;
  in_progress_units: number;
  ok_units: number;
  failed_units: number;
  completion_ratio: number;
  by_category: GlobalProgressBucket[];
  by_difficulty: GlobalProgressBucket[];
  by_category_difficulty: GlobalProgressCategoryDifficultyBucket[];
}
```

---

## 5) Plan de implementación frontend (paso a paso)

1. Actualizar cliente API:
- agregar métodos para `progress/global`, `selections create/get/cancel`.

2. Actualizar formulario de snapshot:
- defaults `Fácil` y `Medio`.
- mantener `Difícil` opcional con confirmación adicional.

3. Crear módulo `selection-runner`:
- recibe `selection_id + unit_ids`.
- ejecuta `execute(unit_id)` en loop controlado.
- emite eventos de progreso.

4. Persistencia local de sesión de ejecución:
- guardar `selection_id` activa por `snapshot_id` (ej. localStorage/zustand/redux persist).
- al recargar página, restaurar estado y consultar backend.

5. Pantalla de progreso de selección:
- polling liviano a `GET /selections/{id}` cada 2-5s durante ejecución.
- reconciliar estado backend con cola local.

6. Acción cancelar:
- llamar endpoint cancel.
- abortar cola local.
- refrescar `snapshot progress` y `selection progress`.

7. Dashboard global:
- consumir `GET /progress/global`.
- mostrar cards + tablas por categoría/dificultad.

---

## 6) Casos borde que frontend debe manejar

1. `POST /selections` devuelve `claimed_count < count`:
- mostrar aviso “No había suficientes unidades elegibles”.

2. `POST /units/{id}/execute` falla:
- marcar unidad como error local.
- seguir con siguiente unidad.
- permitir `retry` manual de esas unidades.

3. Selección pasa a `completed` mientras corre runner:
- detener cola cuando no queden unidades por ejecutar.

4. Usuario cambia de snapshot y vuelve:
- recuperar selección activa previa y continuar.

5. Cancelación con unidades ya completadas:
- solo pendientes/in_progress se afectan; ok/failed quedan.

---

## 7) Checklist QA frontend

1. Crear snapshot sin tocar dificultad -> solo Fácil/Medio en backend.
2. Crear selección `count=100` + filtros por tipo.
3. Ejecutar lote completo y verificar progreso local + backend.
4. Cancelar lote a mitad y verificar rollback `in_progress -> pending`.
5. Reanudar sobre mismo snapshot y continuar.
6. Revisar dashboard global y coherencia de métricas.
7. Validar UX de doble confirmación para `Difícil`.

---

## 8) Recomendaciones técnicas

- Mantener ejecución de unidades idempotente del lado UI (no duplicar llamadas del mismo `unit_id`).
- Registrar logs por `selection_id` para soporte/debug.
- Limitar concurrencia para evitar saturar proveedor LLM.
- Usar backoff en polling cuando lote esté inactivo.
