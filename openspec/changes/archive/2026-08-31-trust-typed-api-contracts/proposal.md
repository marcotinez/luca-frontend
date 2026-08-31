## Why

`lib/prompt-generation.api.ts` tiene 1207 líneas, de las que unas 650 son funciones `normalize*` escritas a mano: `normalizeString`, `normalizeStringArray`, `normalizeSubtopicsRecord`, `normalizeStringMap`, `normalizeNumberMap`, `normalizeNestedNumberMap`, `normalizeTaxonomySubcategory`, `normalizeTaxonomyCategory`, `normalizeGenerationConfig`, `normalizeSnapshotResponse`, `normalizeSelectionResponse`, `normalizeGlobalProgressResponse`... unas veinticinco en total. Reconstruyen campo a campo respuestas que FastAPI ya valida contra modelos Pydantic y que ya están tipadas en TypeScript. Es defensa contra un backend que no es hostil: duplica el contrato, lo hace divergir en silencio (por ejemplo, el frontend declara la dificultad `Difícil`, que el backend rechaza en evaluaciones) y esconde errores reales del servidor detrás de valores por defecto.

Los tipos, además, están escritos dos veces: en `types/*.types.ts` y otra vez dentro de los módulos de API.

## What Changes

- Se eliminan las funciones `normalize*` que solo reconstruyen la respuesta; las llamadas devuelven la respuesta tipada del backend.
- Donde sí hace falta validar en el límite (respuestas cuyo contenido alimenta directamente formularios de edición, como la configuración y la taxonomía) se usa un esquema **zod**, que ya es dependencia del proyecto, en lugar de código manual.
- **BREAKING** (interno): las funciones de API dejan de devolver estructuras "rellenadas" ante respuestas incompletas; propagan el error normalizado del cliente HTTP.
- Los tipos de respuesta se derivan del contrato OpenAPI que el backend ya publica, mediante un script de generación ejecutable a demanda, y se elimina la duplicación entre `types/` y los módulos de API.
- `lib/prompt-generation.api.ts` se divide por dominio: `generation.api.ts` (snapshots, unidades, selecciones, ejecuciones), `config.api.ts` (configuración y taxonomía) y `models.api.ts` (catálogo de modelos).
- Se elimina la constante `GENERATION_DIFFICULTY_KEYS` con dificultades fijas: las dificultades habilitadas vienen del backend.
- `buildSnapshotViewModel` y `deriveCatalogFromTaxonomy` se conservan como transformaciones de presentación, separadas del acceso a datos.

## Capabilities

### New Capabilities
- `api-contracts`: contratos tipados entre el cliente web y el backend, derivados de la especificación publicada por el servidor, con validación solo en los límites que la requieren.

### Modified Capabilities

## Impact

- `lib/prompt-generation.api.ts` (dividido y reducido en más de la mitad), `types/*.types.ts`, y todas las páginas administrativas que lo consumen.
- Nuevo script de generación de tipos y su entrada en `package.json`.
- Depende de `unified-api-client` (errores normalizados) y de `runtime-configuration-in-db` en el backend (forma de la configuración por secciones).
