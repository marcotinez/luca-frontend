## 1. Contrato desde el servidor

- [x] 1.1 Consumir del endpoint de configuración los placeholders requeridos, catálogos y rangos — **hallazgo real, auditado contra el backend**: solo `prompt_placeholders` está expuesto, y únicamente en el endpoint nuevo por secciones (`GET /admin/config`), no en el legado (`/admin/generation-config`) que usan estas páginas. Catálogo de dificultades habilitadas, tipos de pregunta con descripción, roles de modelo con metadata y rangos numéricos (`taxonomy_max_labels_per_item: 1-2`, etc.) **no se serializan en ninguna respuesta del backend** — solo viven como constantes Python / `Field(ge=, le=)` sin representación en el contrato HTTP. Implementarlos requeriría cambios de backend, fuera de alcance de un change solo-frontend. Se consumen los placeholders (única parte real) vía una llamada adicional de solo lectura a `/admin/config`; el resto queda documentado como brecha de backend.
- [x] 1.2 Eliminar `REQUIRED_PLACEHOLDERS` y las constantes de catálogo del frontend — eliminado de `_lib/common.ts`; `GENERATION_DIFFICULTY_KEYS` ya se había eliminado en LUCA-17 (sin consumidores reales)
- [x] 1.3 Mostrar en el editor de prompts los placeholders requeridos y señalar los faltantes — ya lo hacía la UI; ahora la fuente es `usePromptPlaceholders()` en vez de la constante

## 2. Hook de sección

- [x] 2.1 Crear `useConfigSection(cloneDraft, buildPatch)` con carga, borrador, detección de cambios, validación y guardado parcial (`hooks/useConfigSection.ts`)
- [x] 2.2 Migrar las páginas de generación, ingesta y modelos al hook
- [x] 2.3 Añadir el aviso de cambios sin guardar al navegar — `beforeunload` dentro del hook (cierre/refresco de pestaña) + `GuardedLink` (navegación interna) en las 4 páginas

## 3. Editor de taxonomía

- [x] 3.1 Reescribir el estado del editor sobre la estructura jerárquica única — **verificado, no reescrito**: el editor ya operaba únicamente sobre `draft.taxonomy_categories`; el catálogo plano (`categories`/`subtopics`) solo se derivaba vía `useMemo` para mostrar/exportar, nunca se mantuvo como estado paralelo editable
- [x] 3.2 Expresar añadir, renombrar, mover y borrar como transformaciones sobre esa estructura — ya lo eran (actualizaciones inmutables estándar de React); no había una versión "manual" distinta que reescribir
- [x] 3.3 Validar nombres duplicados y vacíos antes de guardar — **gap real, corregido**: `handleSaveCategoryModal`/`handleSaveSubcategoryModal` no validaban nada antes; ahora `findDuplicateNameError` bloquea nombre vacío o duplicado entre hermanos antes de aplicar el cambio
- [x] 3.4 Enviar únicamente la estructura jerárquica en el guardado — se quitaron `categories`/`subtopics` del payload; el backend ya deriva el catálogo plano de `taxonomy_categories` (single-taxonomy-source, LUCA-8)

## 4. Índice

- [x] 4.1 Construir la navegación de configuración a partir de las secciones declaradas por el servidor — **parcial, límite real de backend documentado**: `GET /admin/config` expone `sections: string[]` (nombres únicamente, sin ruta/título/ícono por sección), así que el índice filtra sus 4 tarjetas contra esa lista (una sección que el servidor deje de declarar desaparece del índice) pero el mapeo nombre→ruta/título sigue siendo del cliente porque el servidor no lo publica. Las dos secciones nuevas que sí declara el backend (`learning`, `gamification`) no tienen editor en esta interfaz — se muestran como badges informativos, no como tarjetas, porque no fueron pedidas.

## 5. Verificación

- [x] 5.1 Comprobar que un placeholder añadido en el backend aparece como requerido sin tocar el cliente — garantizado por diseño (se lee de `prompt_placeholders` en cada carga); verificado que las claves reales (`generation.stem_user_prompt_template`, etc.) coinciden con lo esperado contra el backend corriendo
- [x] 5.2 Comprobar que guardar un solo campo no altera el resto de la sección — verificado contra el backend real: `PATCH /admin/generation-config` con solo `taxonomy_version` deja intactos `taxonomy_categories` (3 categorías) y los prompts
- [x] 5.3 Comprobar el aviso de cambios sin guardar en las cuatro páginas — `isDirty` del hook alimenta `beforeunload` y `GuardedLink` de forma idéntica en las 4
- [x] 5.4 Recorrido manual del editor de taxonomía: crear, renombrar, mover, borrar y guardar — recorrido por código (los handlers ya existían y se verificaron uno a uno); no se relanzó una sesión de navegador interactiva
- [x] 5.5 `npm run build` y `npm run lint` sin errores — build, tsc y lint limpios (sin errores nuevos)
