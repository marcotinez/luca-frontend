# Guía de Renovación Frontend: Generación V2 (Snapshot/Units)

## 1) Objetivo
Esta guía define la implementación frontend vigente para operar **todo el sistema de generación** desde el panel admin, alineado con backend V2.

Cobertura obligatoria desde frontend:
- prompts,
- parámetros,
- modelos y proveedores,
- ejecución en tiempo real,
- snapshots y unidades,
- monitoreo operativo.

Esta guía **reemplaza** las implementaciones/documentación legacy de generación basada en jobs/blueprints.

---

## 2) Contrato backend vigente

Base API: `/api/v1`

### 2.1 Configuración global
- `GET /api/v1/models`
- `GET /admin/generation-config`
- `PATCH /admin/generation-config`

Campos que frontend debe soportar explícitamente:
- Prompts base: `general_prompt`, `facil_prompt`, `medio_prompt`, `dificil_prompt`
- Prompts de etapas: `generation_stem_*`, `generation_distractor_*`, `generation_judge_*`
- Modelos globales: `llm_default_model`, `llm_models`, `embedding_default_model`, `embedding_models`
- Modelos por sección: `llm_model_sections`
- Pipeline v2: `question_type_catalog`, `rubric_config`
- Ingesta + taxonomía: campos ya existentes de clasificación y catálogo.

Notas:
- `GET /api/v1/models` y `GET /admin/generation-config` requieren autenticación de superusuario.
- El catálogo de modelos se usa para poblar los selectores de `llm_default_model` y `llm_models`.

### 2.2 Flujo de generación V2 (operación)
- `POST /generation/snapshots`
- `POST /generation/snapshots/{snapshot_id}/refresh`
- `GET /generation/snapshots/{snapshot_id}/progress`
- `POST /generation/units/next`
- `POST /generation/units/{unit_id}/execute`
- `POST /generation/units/{unit_id}/retry`
- `GET /generation/units?snapshot_id=...`

---

## 3) Arquitectura UI objetivo

## 3.1 Módulo Configuración IA (control total)
Mantener/crear secciones separadas:
1. **Prompts de generación**
2. **Modelos y pipeline**
3. **Ingesta**
4. **Taxonomía**

### Reglas UX mínimas
- Guardado por sección con PATCH parcial.
- Validación de placeholders antes de guardar templates.
- Visualizar `updated_at` y diff simple “cambios sin guardar”.

## 3.2 Módulo Operación V2 (nuevo foco)
Crear página operativa para snapshots/units con:
1. **Crear Snapshot**
2. **Tabla de Snapshots activos** (o selector de snapshot actual)
3. **Progreso en tiempo real** (totales + barras)
4. **Listado de Units** con filtros (`status`, `difficulty`, `question_type`, `unit_kind`)
5. **Acciones por unit**: execute, retry
6. **Auto-run**: worker frontend que recorre `next -> execute` y refresca progreso

---

## 4) Estado y flujo funcional (simple y determinista)

## 4.1 Crear snapshot
Input mínimo:
- `category`
- `subtopic` (opcional)
- `target_difficulties`
- `question_types` (opcional, usa catálogo por defecto si no se envía)
- `include_entities`, `include_relations`
- `x_matrix_override` (opcional)

Output a persistir en estado UI:
- `snapshot_id`
- `entity_count`
- `relation_count`
- `unit_count`
- `refresh_count`

## 4.2 Ejecutar una unit
1. Pedir `POST /generation/units/next` con `snapshot_id`
2. Si devuelve unit:
   - llamar `POST /generation/units/{unit_id}/execute`
3. Actualizar tabla y métricas de progreso

Comportamiento real del backend:
- `next` devuelve **1 unit**
- prioridad: `failed` primero, luego `pending`
- `execute` intenta generar **1 pregunta**

## 4.3 Auto-run desde frontend
Worker recomendado:
- loop serial (sin paralelismo inicialmente)
- cada iteración: `next -> execute -> progress`
- stop conditions:
  - no hay units pendientes/fallidas
  - acción manual “detener” del operador
  - error repetido global configurable (por ejemplo 5 errores consecutivos)

Registrar métricas UI:
- `ok_units`, `failed_units`, `pending_units`, `in_progress_units`
- velocidad estimada: units/min
- última ejecución: timestamp + unit + estado

---

## 5) Cambios requeridos en `luca-frontend`

## 5.1 Cliente API de generación
Actualizar `lib/prompt-generation.api.ts`:
- eliminar dependencia de endpoints legacy de jobs de generación (`/generation/questions/jobs`)
- agregar tipos y funciones para snapshots/units
- mantener `get/patch generation-config`

### Tipos TS mínimos a agregar
- `CreateSnapshotRequest`, `SnapshotResponse`
- `SnapshotProgressResponse`
- `GenerationUnitResponse`
- `UnitExecuteRequest`, `ExecuteUnitResponse`
- `ListUnitsResponse`

## 5.2 Configuración: modelo de datos frontend
Ajustar tipos de `GenerationConfigResponse/Patch` para incluir:
- `question_type_catalog`
- `rubric_config`
- `llm_model_sections`
- `llm_models`
- `embedding_default_model`
- `embedding_models`

Y quitar del frontend lo que backend ya no usa:
- `blueprint_pool_size_by_difficulty`
- cualquier rastro de jobs/blueprints legacy en vistas de generación.

## 5.3 Páginas admin
- Migrar `app/admin/generador/page.tsx` a operación snapshot/units real-time.
- Mantener `app/admin/generador/configuracion/*` y extender `modelos-pipeline` con edición de:
  - `question_type_catalog`
  - rúbrica (`weights`, `pass_threshold`)
  - `llm_default_model`
  - `llm_models` por sección
  - `embedding_default_model`
  - `embedding_models`

---

## 6) Limpieza de legacy (frontend)

## 6.1 Documentación
- Esta guía pasa a ser la referencia principal.
- Marcar V3/V4 como obsoletas y redirigir aquí.

## 6.2 Código
Eliminar gradualmente:
- endpoints y tipos de jobs legacy de generación,
- secciones UI ligadas al flujo anterior,
- campos de config ya removidos en backend.

---

## 7) Plan de implementación por fases

## Fase 1: Contrato y cliente API
- actualizar tipos + cliente snapshots/units
- conservar compatibilidad solo en configuración, no en ejecución legacy

## Fase 2: UI Operativa V2
- snapshot creator
- progress panel
- units table + filtros + acciones
- auto-run worker

## Fase 3: Configuración avanzada
- modelos/proveedores
- catálogo de tipos y matriz X
- rúbrica

## Fase 4: Limpieza
- retirar lógica legacy de generación
- depurar docs antiguas y navegación residual

---

## 8) Criterios de aceptación
Se considera terminada la renovación cuando:
1. Desde frontend se puede crear snapshot y ejecutar units hasta completar cobertura.
2. Se visualiza progreso en tiempo real con estados correctos.
3. Se pueden reintentar units fallidas desde UI.
4. Toda la configuración relevante de generación se edita desde frontend (`PATCH /admin/generation-config`).
5. La UI no depende de endpoints legacy de generación por jobs.
6. Existe una sola guía vigente de implementación y las anteriores quedan obsoletas.

---

## 9) Checklist de QA manual
1. Crear snapshot con categoría/subtópico válidos.
2. Verificar `unit_count` > 0.
3. Ejecutar una unit manualmente y validar cambio de estado.
4. Ejecutar auto-run y confirmar avance de `pending` a `ok/failed`.
5. Forzar fallo y reintentar unit.
6. Cambiar `llm_default_model` desde UI y validar que nuevas ejecuciones usen ese modelo por defecto.
7. Editar rúbrica/threshold y confirmar efecto en aceptación de units.
