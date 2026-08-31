## 1. Reemplazar chequeos muertos por el contrato ApiError

- [x] 1.1 `app/register/page.tsx`: reemplazar el parseo manual de `error.response.data.detail` (nunca alcanzado) por `apiErrorMessage(error, ...)`
- [x] 1.2 `app/perfil/page.tsx`: mismo reemplazo en el `catch` del formulario de cambio de contraseña (el resto del archivo ya usa `apiErrorMessage` correctamente)
- [x] 1.3 `app/practice/test/[testId]/page.tsx`: reemplazar `axios.isAxiosError(error) && error.response?.status === N` por `error instanceof ApiError && error.status === N` en `loadTest` (403/404) y `handleConfirmAnswer` (400/422)
- [x] 1.4 `app/practice/test/[testId]/result/page.tsx`: mismo reemplazo en `loadResult` (403/404)
- [x] 1.5 `app/admin/generador/progreso-global/page.tsx`: eliminar la función local `getErrorMessage` y usar `apiErrorMessage` de `@/lib/api` directamente

## 2. Verificación

- [x] 2.1 Confirmar que no queda ningún `axios.isAxiosError` fuera de `lib/api.ts`
- [x] 2.2 `npm run lint` y `npm run build` sin errores nuevos
- [x] 2.3 `npm run dead-code` sin nuevas advertencias (import de `axios` retirado donde ya no se usa)
