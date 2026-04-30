# Guía Frontend - Configuración de Modelos por Sección

Fecha: 2026-04-15

## 1) Objetivo

Adaptar frontend para la nueva interfaz unificada de modelos:

- Conexión de backend a modelos vía `env` (no desde frontend).
- Configuración de modelos por sección desde `generation-config`.
- Dropdown por sección usando catálogo real de `GET /api/v1/models`.
- Las rutas `GET /api/v1/models` y `GET/PATCH /api/v1/admin/generation-config` requieren sesión autenticada de superusuario.
- Eliminación de campos legacy (`llm_providers`, overrides de modelo por payload).

---

## 2) Cambios de API que frontend debe consumir

### 2.1 Catálogo de modelos

Endpoint:
- `GET /api/v1/models`

Respuesta (nuevo contrato):
```json
{
  "models": [
    {
      "type": "llm",
      "key": "qwen/qwen3.5-9b",
      "display_name": "Qwen3.5 9B",
      "publisher": "qwen",
      "capabilities": { "vision": true }
    },
    {
      "type": "embedding",
      "key": "text-embedding-nomic-embed-text-v1.5",
      "display_name": "Nomic Embed Text v1.5"
    }
  ]
}
```

Notas:
- `key` es el valor que se debe guardar en configuración.
- `type` define filtro para dropdown:
  - `llm` para secciones LLM
  - `embedding` para secciones embedding
- El backend valida este catálogo bajo autenticación de admin/superuser; el frontend debe enviar bearer token al consultar esta ruta.

### 2.2 Configuración admin

Endpoint lectura:
- `GET /api/v1/admin/generation-config`

Campos relevantes:
- `llm_default_model: string`
- `llm_models: Record<string, string>`
- `llm_model_sections: string[]`
Endpoint edición:
- `PATCH /api/v1/admin/generation-config`

Notas:
- La lectura y escritura de esta configuración está protegida por autenticación de superusuario.
- El frontend administrativo ya debe tratar estos requests como admin-only.

Enviar solo campos modificados, por ejemplo:
```json
{
  "llm_default_model": "qwen/qwen3.5-9b",
  "llm_models": {
    "question_generation": "qwen/qwen3.5-9b",
    "question_judge": "google/gemma-4-e2b",
    "ingestion_generation": "qwen/qwen3.5-9b",
    "ingestion_refinement": "qwen/qwen3.5-9b",
    "ingestion_taxonomy": "google/gemma-4-e2b"
  }
}
```

Validaciones backend:
- modelo debe existir en catálogo remoto
- tipo debe coincidir (LLM vs embedding)
- sección debe ser permitida

---

## 3) Cambios UX/UI requeridos

### 3.1 Pantalla de configuración de modelos

Agregar bloque "Modelos" en admin config con:

1. Dropdown `llm_default_model`
- opciones: `models.filter(m => m.type === 'llm')`

2. Dropdown por cada `llm_model_sections[]`
- label = nombre de sección (ej. `question_generation`)
- valor inicial = `llm_models[section]` o `llm_default_model`
- opciones: solo `llm`

### 3.2 Recomendaciones de UX

- Mostrar `display_name` en UI, persistir `key`.
- Incluir badge de capacidad (ej. `vision`) cuando exista.
- Si `models` viene vacío, bloquear guardado y mostrar error.
- Si `PATCH` devuelve 400, mostrar `detail` textual del backend.

---

## 4) Cambios de tipos frontend (TypeScript)

```ts
export interface ModelCatalogItem {
  type: 'llm' | 'embedding' | string;
  key: string;
  display_name: string;
  publisher?: string | null;
  architecture?: string | null;
  capabilities?: Record<string, unknown> | null;
  max_context_length?: number | null;
}

export interface ModelCatalogResponse {
  models: ModelCatalogItem[];
}

export interface GenerationConfigResponse {
  llm_default_model: string;
  llm_models: Record<string, string>;
  llm_model_sections: string[];  // ...resto de campos existentes
}
```

---

## 5) Breaking changes a aplicar

1. Eliminar uso de `llm_providers` en frontend.
2. Eliminar cualquier UI/API para `provider_key`, `generation_model`, `judge_model` en ejecución de unidades.
3. `POST /api/v1/generation/units/{unit_id}/execute` debe enviarse sin override de modelos.

---

## 6) Flujo recomendado de carga en frontend

1. Cargar en paralelo:
- `GET /api/v1/models`
- `GET /api/v1/admin/generation-config`

2. Construir estado de formulario:
- defaults desde `*_default_model`
- por sección desde `*_models`

3. Guardar:
- construir payload mínimo de cambios
- `PATCH /api/v1/admin/generation-config`

4. Revalidar:
- refetch de config después de guardar

---

## 7) Checklist de implementación

- [x] Actualizar cliente API y tipos para `GET /api/v1/models`.
- [x] Actualizar tipos de `generation-config` (agregar `*_model_sections`, quitar legacy).
- [x] Implementar dropdowns por sección (solo LLM).
- [x] Remover UI/payload de overrides en execute unit.
- [x] Manejar errores 400 de validación de modelos.
- [ ] Probar guardado con modelos válidos y rechazo con inválidos.
