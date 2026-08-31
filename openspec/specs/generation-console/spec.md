# generation-console Specification

## Purpose
TBD - created by archiving change server-driven-generation-console. Update Purpose after archive.
## Requirements
### Requirement: Preparación de snapshots desde la consola

La consola SHALL permitir a un superusuario crear un snapshot eligiendo categoría, subtópico opcional, dificultades, tipos de pregunta y qué unidades incluir, y SHALL mostrar el resultado con sus conteos de entidades, relaciones y unidades.

#### Scenario: Creación exitosa

- **WHEN** el superusuario envía el formulario con una categoría válida
- **THEN** se muestra el snapshot creado con sus conteos
- **AND** la lista de snapshots se actualiza

#### Scenario: Error del servidor

- **WHEN** la creación falla
- **THEN** se muestra el mensaje de error del servidor
- **AND** no se muestra ningún snapshot vacío como si se hubiera creado

### Requirement: Ejecución de lotes conducida por el servidor

La consola SHALL lanzar los lotes de generación en el servidor y SHALL limitarse a consultar su progreso, sin ejecutar unidades desde el navegador.

#### Scenario: Cierre de la pestaña durante un lote

- **WHEN** el superusuario lanza un lote y cierra la pestaña
- **THEN** al volver a abrir la consola el lote aparece con su progreso actualizado o ya finalizado

#### Scenario: Cancelación

- **WHEN** el superusuario cancela un lote en curso
- **THEN** la consola refleja el estado cancelado y las unidades liberadas

### Requirement: Progreso observable

La consola SHALL mostrar el progreso del snapshot activo y del lote en curso, actualizándolo periódicamente mientras haya actividad y deteniendo las consultas cuando la vista no está visible.

#### Scenario: Lote en curso

- **WHEN** hay un lote activo
- **THEN** el progreso se actualiza periódicamente sin intervención del usuario

#### Scenario: Pestaña oculta

- **WHEN** la pestaña deja de estar visible
- **THEN** las consultas periódicas se detienen y se reanudan al volver

### Requirement: Exploración de unidades filtrada en el servidor

La consola SHALL permitir filtrar las unidades por estado, dificultad, tipo de pregunta y clase, resolviendo el filtrado en el servidor con paginación, y SHALL reflejar los filtros en la dirección de la página.

#### Scenario: Filtro compartible

- **WHEN** el superusuario aplica filtros y copia la dirección de la página
- **THEN** al abrirla se restauran los mismos filtros y resultados

#### Scenario: Muchas unidades

- **WHEN** un snapshot tiene miles de unidades
- **THEN** la consola solicita solo la página visible

### Requirement: Trazas provistas por el servidor

La consola SHALL mostrar las trazas de generación obtenidas del backend y NO SHALL almacenar trazas en el navegador.

#### Scenario: Consulta de trazas

- **WHEN** el superusuario abre la vista de ejecuciones
- **THEN** ve las ejecuciones registradas por el servidor con sus prompts, respuestas y puntuaciones
- **AND** las mismas trazas están disponibles desde cualquier navegador

#### Scenario: Detalle de una unidad

- **WHEN** el superusuario abre el detalle de una unidad ejecutada
- **THEN** ve la traza de su última ejecución obtenida del servidor

