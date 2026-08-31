## Why

Desde `unified-api-client` toda petición a través de la instancia compartida `api` normaliza sus errores a `ApiError` (`lib/api.ts`) antes de llegar al código consumidor: nunca llega un `AxiosError` crudo fuera de `lib/api.ts`. Cinco archivos siguen chequeando `axios.isAxiosError(error)`, que ahora es siempre `false` — código muerto que el audit de `remove-dead-frontend-code` no cubrió porque `knip` detecta exportaciones e importaciones sin consumidores, no ramas de código internas que nunca se ejecutan.

En `app/practice/test/[testId]/page.tsx` y `app/practice/test/[testId]/result/page.tsx` esto no es solo cosmético: las ramas muertas manejaban 403/404 (redirigir a `/dashboard`) y, al confirmar una respuesta, 400 (el test ya se completó, ir al resultado) y 422 (recargar el estado del test). Hoy esos cuatro casos caen todos al toast genérico de error, sin la navegación con la que se diseñaron. En `app/register/page.tsx`, `app/perfil/page.tsx` y `app/admin/generador/progreso-global/page.tsx` el efecto es que el mensaje de error específico del backend (validación, email duplicado, etc.) nunca se muestra: siempre se ve el mensaje genérico de fallback.

## What Changes

- Los 5 archivos afectados pasan a usar `ApiError`/`apiErrorMessage` (`lib/api.ts`) para leer el estado y el mensaje del error, igual que ya hacen el resto de los módulos desde `unified-api-client`.
- Las ramas de navegación por código de estado en las páginas de práctica (403/404 al cargar, 400/422 al confirmar respuesta) vuelven a ejecutarse.
- Se elimina la función local `getErrorMessage` de `progreso-global/page.tsx`, duplicada del mismo propósito que `apiErrorMessage`.

## Capabilities

### New Capabilities

### Modified Capabilities
- `api-client`: los consumidores de errores de `api` usan el contrato `ApiError` de forma consistente; ninguno chequea el tipo de error del transporte subyacente.

## Impact

- `app/register/page.tsx`, `app/perfil/page.tsx`, `app/practice/test/[testId]/page.tsx`, `app/practice/test/[testId]/result/page.tsx`, `app/admin/generador/progreso-global/page.tsx`.
- Sin cambios de API pública ni de `lib/api.ts`: el contrato `ApiError` ya existe y ya es correcto, el problema es exclusivamente del lado consumidor.
