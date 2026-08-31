## ADDED Requirements

### Requirement: Sin componentes ni módulos huérfanos

El proyecto SHALL NOT contener componentes, utilidades o tipos sin consumidores, y SHALL verificarlo de forma automatizada en el flujo de desarrollo.

#### Scenario: Verificación en el desarrollo

- **WHEN** se ejecuta la verificación de calidad del proyecto
- **THEN** se señalan las exportaciones sin consumidores
- **AND** la revisión no se da por buena mientras existan

### Requirement: Una ruta por destino

La aplicación SHALL exponer un único destino para el panel del estudiante, y cualquier ruta anterior SHALL redirigir a él.

#### Scenario: Acceso a la ruta retirada

- **WHEN** un usuario navega a la ruta retirada del panel
- **THEN** es redirigido al destino vigente

#### Scenario: Navegación coherente

- **WHEN** el usuario navega desde cualquier punto de la aplicación al panel
- **THEN** siempre llega al mismo destino

### Requirement: Acceso a preguntas sin funciones redundantes

El cliente SHALL exponer una única función de consulta de preguntas con filtros y paginación.

#### Scenario: Listado filtrado

- **WHEN** una vista necesita preguntas por categoría, subtópico, dificultad o estado
- **THEN** usa la función única de consulta con los filtros correspondientes

### Requirement: Dependencias justificadas

El proyecto SHALL declarar únicamente dependencias con uso efectivo, y las dependencias pesadas SHALL cargarse de forma diferida en el punto donde se usan.

#### Scenario: Revisión de dependencias

- **WHEN** se revisa la lista de dependencias
- **THEN** cada una tiene al menos un consumidor en el código
- **AND** las pesadas se importan de forma diferida
