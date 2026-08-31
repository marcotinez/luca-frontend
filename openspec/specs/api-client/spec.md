# api-client Specification

## Purpose
TBD - created by archiving change unified-api-client. Update Purpose after archive.
## Requirements
### Requirement: Cliente HTTP único

La aplicación SHALL realizar todas sus peticiones al backend a través de una única instancia de cliente HTTP con URL base resuelta desde la configuración de entorno, y NO SHALL configurar clientes ni cabeceras por módulo.

#### Scenario: Llamada desde cualquier módulo

- **WHEN** cualquier módulo de acceso a datos realiza una petición
- **THEN** usa la instancia compartida
- **AND** la URL base se resuelve una sola vez para toda la aplicación

#### Scenario: Sin dependencia del orden de importación

- **WHEN** una página importa solo un módulo de dominio, sin importar el módulo de autenticación
- **THEN** las peticiones siguen llevando la credencial de sesión

### Requirement: Autenticación automática de las peticiones

El cliente SHALL adjuntar la credencial de sesión almacenada a cada petición dirigida al backend, exactamente una vez.

#### Scenario: Sesión activa

- **WHEN** existe una credencial almacenada y se realiza una petición
- **THEN** la petición incluye la cabecera de autorización una sola vez

#### Scenario: Sin sesión

- **WHEN** no hay credencial almacenada
- **THEN** la petición se envía sin cabecera de autorización

### Requirement: Renovación de sesión con deduplicación

Ante una respuesta de no autorizado, el cliente SHALL intentar renovar la sesión una única vez por petición y SHALL compartir una sola renovación en curso entre todas las peticiones concurrentes; si la renovación falla, SHALL limpiar la sesión y redirigir al inicio de sesión.

#### Scenario: Varias peticiones fallan a la vez

- **WHEN** varias peticiones reciben no autorizado simultáneamente
- **THEN** se ejecuta una sola renovación
- **AND** todas las peticiones se reintentan con la credencial renovada

#### Scenario: Renovación fallida

- **WHEN** la renovación de sesión falla
- **THEN** se limpia la sesión almacenada y se redirige al inicio de sesión

#### Scenario: Fallo en la propia autenticación

- **WHEN** falla la petición de inicio de sesión o la de renovación
- **THEN** no se intenta renovar de nuevo y el error se propaga al llamador

### Requirement: Errores normalizados

El cliente SHALL traducir toda respuesta de error a un tipo de error de aplicación con código de estado, código de negocio cuando exista y mensaje legible, incluidos los detalles estructurados que devuelve el backend.

#### Scenario: Error de validación del backend

- **WHEN** el backend responde con un detalle estructurado que incluye código y sugerencias
- **THEN** el error de aplicación conserva el código y los datos adicionales para que la interfaz los muestre

#### Scenario: Error de red

- **WHEN** la petición no obtiene respuesta
- **THEN** se produce un error de aplicación identificable como fallo de conexión

### Requirement: Consumo consistente del contrato de error

El código consumidor de `api` SHALL identificar y leer los errores exclusivamente a través de `ApiError` (estado, código y mensaje), y NO SHALL comprobar el tipo de error del transporte subyacente (por ejemplo `axios.isAxiosError`) fuera del propio cliente.

#### Scenario: Manejo de un código de estado específico

- **WHEN** una vista necesita comportarse distinto ante un código de estado concreto (por ejemplo redirigir en 403/404)
- **THEN** comprueba `error instanceof ApiError` y su propiedad `status`

#### Scenario: Mensaje de error mostrado al usuario

- **WHEN** una vista muestra el mensaje de un error de una llamada a `api`
- **THEN** usa `apiErrorMessage(error, fallback)` en vez de leer la respuesta cruda del transporte

