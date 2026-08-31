## Why

La capa de acceso a la API está duplicada en once módulos. `lib/auth.api.ts` registra los interceptores de petición y respuesta sobre la **instancia global** de axios como efecto secundario de importarlo: si una página importa `questions.api` pero no `auth.api`, no hay interceptor y las peticiones salen sin token. Para compensar, cinco módulos definen su propia función `authHeaders()` idéntica y la pasan a mano en cada llamada, con lo que el token se adjunta dos veces cuando el interceptor sí está cargado.

Cada módulo repite además `const BASE_URL = getApiBaseUrl()` y su propia concatenación de rutas, `questions.api.ts` implementa una caché manual con TTL para los conteos por categoría, y el manejo de errores es distinto en cada archivo (unos propagan el error de axios crudo, otros lo tragan y devuelven valores vacíos).

## What Changes

- Una única instancia de axios (`lib/api.ts`) con `baseURL`, interceptor de autenticación, refresco de token con deduplicación de peticiones concurrentes y normalización de errores.
- **BREAKING** (interno): se eliminan las funciones `authHeaders()` de `admin.api`, `questions.api`, `users.api`, `learning.api` y `prompt-generation.api`; todas las llamadas pasan por la instancia compartida.
- Se elimina el registro de interceptores sobre la instancia global de axios y su dependencia del orden de importación.
- Un tipo de error de aplicación único (`ApiError` con estado, código y mensaje legible) al que se traducen las respuestas de FastAPI, incluidos los `detail` estructurados que ya devuelve el backend para disponibilidad de preguntas.
- Se elimina la caché manual de conteos por categoría; el mismo dato se pide con el resto de datos de la vista.
- Cada módulo de dominio (`auth`, `users`, `questions`, `learning`, `graph`, `ingestion`, `admin`, `generation`) queda como una lista plana de funciones sobre la instancia compartida, sin configuración propia.

## Capabilities

### New Capabilities
- `api-client`: acceso HTTP del cliente web al backend de Luca, con autenticación automática, renovación de sesión, y errores normalizados.

### Modified Capabilities

## Impact

- `lib/api-base.ts` (se conserva la resolución de URL base), nuevo `lib/api.ts`, y los once módulos `lib/*.api.ts`.
- `hooks/useAuth.ts` y todas las páginas que capturan errores de axios.
