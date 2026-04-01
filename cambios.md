# Impacto de Refactor Backend para Frontend

Fecha: 2026-03-27
Alcance: refactor de dominios/endpoints + simplificación de flujos de ingesta y grafo.

## 1) Respuesta corta a la pregunta principal
Sí, hay cambios que **pueden afectar el funcionamiento del frontend** si el FE usa contratos antiguos.
No todo cambió, pero hay puntos de ruptura concretos (endpoints eliminados/unificados y parámetros removidos).

## 2) Qué NO cambió (o no debería afectar FE)
- El `api_router` sigue montando rutas bajo `/api/v1`.
- La autenticación base (`/auth/*`) se mantiene.
- Endpoints de usuarios (`/users/*`) se mantienen.
- Endpoints de aprendizaje (`/learning/*`) se mantienen.
- Endpoints de generación (`/generation/*`) se mantienen funcionalmente en la API pública.
- Gran parte del refactor en `app/domains/*` es interno (arquitectura), sin cambio de URL.

## 3) Cambios con impacto potencial en FE

### 3.1 Ingesta (`/api/v1/ingestion`)

#### Cambio 1: `execution_mode` eliminado
Antes se aceptaba lógica `async|sync` desde endpoint (y FE podía enviarlo).
Ahora **ya no existe** en `POST /ingestion/upload-pdf`.

Endpoint actual:
- `POST /api/v1/ingestion/upload-pdf`
- `multipart/form-data`
- Campos:
  - `file` (PDF) obligatorio
  - `chunks` (int opcional, `1..max_chunks`)

Acción FE:
- Quitar cualquier envío de `execution_mode`.
- Quitar toggles UI asociados a modo de ejecución si dependían de backend.

#### Cambio 2: `chunks` ahora es entero validado por FastAPI
`chunks` pasó de parseo manual `str -> int` a validación tipada (`Form(int, ge/le)`).

Efecto:
- Si FE envía `chunks` no numérico, backend responde `422` (antes podía responder `400`).

Acción FE:
- Enviar `chunks` como valor numérico válido.
- Ajustar manejo de error para `422` en vez de esperar solo `400`.

#### Cambio 3: flujo lineal/síncrono desde endpoint
La ingesta se ejecuta de forma lineal (sin selector de modo desde FE).

Efecto:
- El request puede tardar más en completar según tamaño de PDF.
- La respuesta ya viene con estado final y eventos acumulados.

Respuesta relevante actual (resumen):
- `message`
- `run_id`
- `filename`
- `status`
- `total_chunks`
- `processed_chunks`
- `total_nodes`
- `total_relations`
- `errors[]`
- `events[]`

Acción FE:
- Verificar timeouts de cliente para upload.
- Seguir mostrando progreso con `events` de respuesta final o con `GET /ingestion/runs/{run_id}`.

---

### 3.2 Grafo (`/api/v1/graph`)

#### Cambio 4: búsqueda separada de entidades/relaciones eliminada
Se unificó la búsqueda textual y se simplificó superficie de API.

Endpoints activos:
- `GET /api/v1/graph/search`
- `GET /api/v1/graph/stats`
- `POST /api/v1/graph/semantic-search`

Efecto:
- Si FE llamaba endpoints separados para entidades y relaciones, ahora debe usar `/graph/search`.

Acción FE:
- Actualizar servicios FE para usar `GET /graph/search` como búsqueda textual principal.
- Ajustar mapeo UI al payload combinado (`entities` + `relationships`).

---

### 3.3 Endpoint demo de LangGraph eliminado

#### Cambio 5: remoción de demo
Se eliminó endpoint/demo de LangGraph que no se usaba en producto.

Efecto:
- Cualquier pantalla o feature flag FE que apunte a demo dejará de funcionar.

Acción FE:
- Eliminar llamadas, botones o rutas internas asociadas al demo.

---

## 4) Inventario actual de endpoints activos (para FE)

### Auth
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/update-password`

### Users
- `GET /api/v1/users/`
- `GET /api/v1/users/{user_id}`
- `PUT /api/v1/users/{user_id}`
- `DELETE /api/v1/users/{user_id}`
- `GET /api/v1/users/{user_id}/learning-profile`
- `POST /api/v1/users/{user_id}/practice-attempt`

### Questions
- `GET /api/v1/questions/`
- `GET /api/v1/questions/{question_id}`
- `POST /api/v1/questions/`
- `PUT /api/v1/questions/{question_id}`
- `DELETE /api/v1/questions/{question_id}`

### Ingestion
- `GET /api/v1/ingestion/jobs`
- `GET /api/v1/ingestion/runs`
- `GET /api/v1/ingestion/runs/{run_id}`
- `DELETE /api/v1/ingestion/jobs?file_name=...`
- `POST /api/v1/ingestion/upload-pdf`

### Admin
- `GET /api/v1/admin/backups`
- `POST /api/v1/admin/backup`
- `POST /api/v1/admin/restore`

### Graph
- `GET /api/v1/graph/search`
- `GET /api/v1/graph/stats`
- `POST /api/v1/graph/semantic-search`

### Generation
- `POST /api/v1/generation/questions`
- `POST /api/v1/generation/questions/jobs`
- `GET /api/v1/generation/questions/jobs/{job_id}`

### Learning
- `POST /api/v1/learning/tests`
- `GET /api/v1/learning/tests`
- `GET /api/v1/learning/tests/{test_id}`
- `POST /api/v1/learning/tests/{test_id}/answer`

## 5) Checklist de migración para frontend

### Prioridad alta (rompe flujo)
- [ ] Remover `execution_mode` de `POST /ingestion/upload-pdf`.
- [ ] Validar que `chunks` se envía como número válido.
- [ ] Manejar `422` para validaciones de formulario en upload.
- [ ] Cambiar búsquedas antiguas separadas a `GET /graph/search`.
- [ ] Eliminar consumo de endpoint demo LangGraph.

### Prioridad media (estabilidad UX)
- [ ] Revisar timeout de upload de PDF.
- [ ] Revisar mensajes de error FE para códigos `400/404/422/500/502`.
- [ ] Verificar render de `events[]` y `errors[]` de ingesta.

### Prioridad baja (alineación técnica)
- [ ] Actualizar SDK/cliente FE con inventario actual de rutas.
- [ ] Eliminar código muerto y feature flags de demo.
- [ ] Revisar textos UI que mencionen modos `async/sync`.

## 6) Casos de prueba recomendados FE (E2E)

1. Upload PDF feliz:
- Enviar `file=pdf` y `chunks=2`.
- Esperar `200` con `run_id`, `status`, `events`.

2. Upload con `chunks` inválido:
- Enviar `chunks="abc"`.
- Esperar `422` y mostrar error de validación en UI.

3. Upload sin `execution_mode`:
- Confirmar que FE no lo envía y el flujo funciona igual.

4. Búsqueda textual:
- Usar `GET /graph/search?query=...`.
- Confirmar render de entidades + relaciones.

5. Búsqueda semántica:
- `POST /graph/semantic-search`.
- Confirmar manejo de errores `500/502`.

6. Demo eliminado:
- Confirmar que no hay navegación/calls al endpoint demo.

## 7) Nota para coordinación FE/BE
- El refactor interno fue grande (estructura por dominio, separación de lógica y utilidades), pero el objetivo fue mantener estabilidad de contrato donde se pudo.
- Los puntos de ruptura relevantes para FE están concentrados en:
  - Ingesta (parámetros/validaciones)
  - Grafo (unificación de búsqueda)
  - Eliminación demo LangGraph

---

Si el equipo FE quiere, backend puede entregar en una siguiente iteración un `OpenAPI diff` formal (antes vs después) para automatizar validación de contratos en CI.
