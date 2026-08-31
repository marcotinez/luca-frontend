## Why

El contrato de los prompts está escrito dos veces. El backend valida en `_validate_non_empty_prompt_fields` qué placeholders debe contener cada plantilla; el frontend lo repite en `app/admin/generador/configuracion/_lib/common.ts` (`REQUIRED_PLACEHOLDERS`). Si el backend añade un placeholder, el editor deja guardar una plantilla que el servidor rechazará después. Lo mismo pasa con las dificultades (`GENERATION_DIFFICULTY_KEYS` incluye `Difícil`, que el backend no admite en evaluaciones), con los tipos de pregunta y con las claves de modelos por rol.

Las cuatro páginas de configuración (`generacion`, `ingesta`, `modelos-pipeline`, `taxonomia`, 2329 líneas entre ellas) repiten además el mismo ciclo: cargar configuración, mantener un borrador local, marcar cambios sin guardar, validar, enviar un PATCH con todos los campos y recargar. El editor de taxonomía por sí solo son 1080 líneas de manipulación manual de listas anidadas.

## What Changes

- Los catálogos y el contrato de validación (placeholders requeridos por plantilla, dificultades habilitadas, tipos de pregunta, roles de modelo, rangos numéricos) se obtienen del endpoint de configuración del backend.
- **BREAKING** (interno): se elimina `REQUIRED_PLACEHOLDERS` y las constantes de catálogo del frontend.
- Un hook único `useConfigSection(section)` encapsula cargar, mantener borrador, detectar cambios sin guardar, validar contra el contrato del servidor y guardar con PATCH parcial (solo los campos modificados, aprovechando el PATCH por secciones del backend).
- El editor de taxonomía se reescribe sobre una estructura de datos única (la jerárquica), sin mantener en paralelo la vista plana; las operaciones de añadir, renombrar, mover y borrar se expresan como transformaciones sobre esa estructura.
- Aviso de cambios sin guardar al navegar, homogéneo en las cuatro páginas.
- Los formularios muestran, por cada plantilla, los placeholders requeridos que llegan del servidor y señalan los que faltan antes de permitir guardar.
- La página índice de configuración enlaza las secciones a partir de las que el servidor declara, en vez de una lista fija.

## Capabilities

### New Capabilities
- `admin-configuration`: interfaz de administración de la configuración operativa de Luca — prompts, modelos, parámetros de ingesta y generación, y taxonomía — validada contra el contrato que publica el servidor.

### Modified Capabilities

## Impact

- `app/admin/generador/configuracion/` completo: `page.tsx`, `generacion/`, `ingesta/`, `modelos-pipeline/`, `taxonomia/`, `_lib/common.ts`, `_components/prompt-editor-field.tsx`.
- Módulo de configuración de `lib/`.
- Depende de `runtime-configuration-in-db` y `single-taxonomy-source` en el backend, y de `trust-typed-api-contracts`.
