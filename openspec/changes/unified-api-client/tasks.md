## 1. Instancia compartida

- [ ] 1.1 Crear `lib/api.ts` con la instancia de axios, `baseURL` y tiempos de espera
- [ ] 1.2 Mover al interceptor de petición la inyección de la credencial de sesión
- [ ] 1.3 Mover al interceptor de respuesta la renovación con deduplicación y el cierre de sesión ante fallo
- [ ] 1.4 Definir `ApiError` y traducir en un único lugar las respuestas de error del backend

## 2. Migrar módulos

- [ ] 2.1 Migrar `auth.api` y eliminar el registro de interceptores sobre la instancia global
- [ ] 2.2 Migrar `users.api`, `questions.api`, `learning.api` y `admin.api`, eliminando sus `authHeaders()`
- [ ] 2.3 Migrar `graph.api`, `ingestion.api` y el módulo de generación
- [ ] 2.4 Eliminar la caché manual de conteos por categoría de `questions.api`
- [ ] 2.5 Unificar `getQuestions` y `listQuestions` en una sola función con filtros

## 3. Consumidores

- [ ] 3.1 Actualizar los `catch` de páginas y componentes para usar `ApiError`
- [ ] 3.2 Mostrar el detalle estructurado de disponibilidad de preguntas usando el nuevo error

## 4. Verificación

- [ ] 4.1 Comprobar que una página que no importa el módulo de autenticación envía igualmente la credencial
- [ ] 4.2 Comprobar que dos peticiones que fallan a la vez disparan una sola renovación
- [ ] 4.3 Comprobar que un fallo de renovación limpia la sesión y redirige
- [ ] 4.4 `npm run build` y `npm run lint` sin errores
