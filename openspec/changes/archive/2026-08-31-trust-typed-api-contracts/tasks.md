## 1. Generación de tipos

- [x] 1.1 Añadir el script `types:api` que genera `types/api.generated.ts` desde `/openapi.json`
- [x] 1.2 Versionar el archivo generado y documentar cuándo regenerarlo (README)
- [x] 1.3 Eliminar de `types/*.types.ts` las definiciones duplicadas del contrato del backend — no aplicaba: los tipos de este dominio nunca vivieron en `types/*.types.ts`, solo en `prompt-generation.api.ts`

## 2. Eliminar normalizadores

- [x] 2.1 Migrar catálogo de modelos y progreso global a los tipos generados y borrar sus normalizadores
- [x] 2.2 Migrar snapshots, unidades y selecciones — de paso se corrigieron tres bugs reales que los normalizadores ocultaban con valores por defecto: `cancelGenerationSelection` leía los campos de progreso al nivel equivocado (la respuesta real anida todo en `.selection`), `retryUnit`/`executeUnit` asumían campos (`status`, `error`, `message`) que no existen en la respuesta real, y la UI mostraba siempre `max_attempts: 0` porque ese campo nunca existió en el backend
- [x] 2.3 Migrar configuración y taxonomía introduciendo esquemas zod en su lugar — validado contra el backend real corriendo
- [x] 2.4 Eliminar las funciones auxiliares de normalización genérica que queden sin uso

## 3. Reorganizar el módulo

- [x] 3.1 Dividir `prompt-generation.api.ts` en `generation.api.ts`, `config.api.ts` y `models.api.ts`
- [x] 3.2 Mover `buildSnapshotViewModel` y `deriveCatalogFromTaxonomy` a `generation.utils.ts`
- [x] 3.3 Eliminar `GENERATION_DIFFICULTY_KEYS` — no tenía consumidores reales (solo se usaba a sí misma); `Difficulty` en `types/` ya es el catálogo tipado que consume la UI
- [x] 3.4 Actualizar los imports de las páginas administrativas (9 archivos)

## 4. Verificación

- [x] 4.1 Comprobar que un campo eliminado en el backend rompe la compilación tras regenerar tipos — verificado indirectamente: los campos que el backend ya no expone (`embedding_*`, `unit.unit_id`→`id`, `unit.max_attempts`) rompieron la compilación al regenerar tipos, tal como se espera de este mecanismo
- [x] 4.2 Comprobar que una configuración malformada bloquea la carga del formulario con error visible — `parseConfig` lanza `ApiError` si el zod schema no valida; probado contra `/api/v1/admin/generation-config` real
- [x] 4.3 Medir la reducción de líneas del módulo y dejarla registrada en el PR — 1128 líneas → 303 líneas repartidas en 4 módulos enfocados (config/generation/models/utils), −73%
- [x] 4.4 `npm run build` y `npm run lint` sin errores — build y `tsc --noEmit` limpios; lint sin errores nuevos (26 problemas preexistentes en archivos no tocados, antes 29 — 3 se resolvieron solos al borrar el módulo viejo)
