## ADDED Requirements

### Requirement: Consumo consistente del contrato de error

El código consumidor de `api` SHALL identificar y leer los errores exclusivamente a través de `ApiError` (estado, código y mensaje), y NO SHALL comprobar el tipo de error del transporte subyacente (por ejemplo `axios.isAxiosError`) fuera del propio cliente.

#### Scenario: Manejo de un código de estado específico

- **WHEN** una vista necesita comportarse distinto ante un código de estado concreto (por ejemplo redirigir en 403/404)
- **THEN** comprueba `error instanceof ApiError` y su propiedad `status`

#### Scenario: Mensaje de error mostrado al usuario

- **WHEN** una vista muestra el mensaje de un error de una llamada a `api`
- **THEN** usa `apiErrorMessage(error, fallback)` en vez de leer la respuesta cruda del transporte
