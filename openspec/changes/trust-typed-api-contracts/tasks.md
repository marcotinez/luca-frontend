## 1. Generación de tipos

- [ ] 1.1 Añadir el script `types:api` que genera `types/api.generated.ts` desde `/openapi.json`
- [ ] 1.2 Versionar el archivo generado y documentar cuándo regenerarlo
- [ ] 1.3 Eliminar de `types/*.types.ts` las definiciones duplicadas del contrato del backend

## 2. Eliminar normalizadores

- [ ] 2.1 Migrar catálogo de modelos y progreso global a los tipos generados y borrar sus normalizadores
- [ ] 2.2 Migrar snapshots, unidades y selecciones
- [ ] 2.3 Migrar configuración y taxonomía introduciendo esquemas zod en su lugar
- [ ] 2.4 Eliminar las funciones auxiliares de normalización genérica que queden sin uso

## 3. Reorganizar el módulo

- [ ] 3.1 Dividir `prompt-generation.api.ts` en `generation.api.ts`, `config.api.ts` y `models.api.ts`
- [ ] 3.2 Mover `buildSnapshotViewModel` y `deriveCatalogFromTaxonomy` a un módulo de presentación
- [ ] 3.3 Eliminar `GENERATION_DIFFICULTY_KEYS` y consumir las dificultades habilitadas del backend
- [ ] 3.4 Actualizar los imports de las páginas administrativas

## 4. Verificación

- [ ] 4.1 Comprobar que un campo eliminado en el backend rompe la compilación tras regenerar tipos
- [ ] 4.2 Comprobar que una configuración malformada bloquea la carga del formulario con error visible
- [ ] 4.3 Medir la reducción de líneas del módulo y dejarla registrada en el PR
- [ ] 4.4 `npm run build` y `npm run lint` sin errores
