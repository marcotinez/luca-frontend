# api-contracts Specification

## Purpose
TBD - created by archiving change trust-typed-api-contracts. Update Purpose after archive.
## Requirements
### Requirement: Contrato derivado de la especificación del servidor

Los tipos de las respuestas de la API SHALL derivarse de la especificación publicada por el backend mediante un proceso de generación reproducible, y NO SHALL mantenerse en paralelo a mano.

#### Scenario: Cambio incompatible en el backend

- **WHEN** el backend elimina o renombra un campo y se regeneran los tipos
- **THEN** la compilación del cliente falla en los puntos afectados

#### Scenario: Regeneración

- **WHEN** se ejecuta el comando de generación de tipos con el backend disponible
- **THEN** se actualiza el archivo de tipos generados de forma determinista

### Requirement: Sin reconstrucción manual de respuestas

El cliente SHALL consumir las respuestas del backend tal como llegan, y NO SHALL reconstruirlas campo a campo ni sustituir campos ausentes por valores por defecto.

#### Scenario: Respuesta inesperada del servidor

- **WHEN** una respuesta no corresponde al contrato esperado
- **THEN** la operación produce un error visible para la interfaz
- **AND** no se muestran datos vacíos como si fueran válidos

### Requirement: Validación en los límites de edición

El cliente SHALL validar con un esquema declarativo las respuestas cuyo contenido alimenta directamente formularios de edición —configuración operativa y taxonomía— antes de cargarlas en el formulario.

#### Scenario: Configuración malformada

- **WHEN** la respuesta de configuración no cumple el esquema declarado
- **THEN** el formulario no se carga y se muestra un error explícito
- **AND** no se ofrece guardar contenido incompleto

### Requirement: Catálogos provistos por el servidor

El cliente SHALL obtener del backend los catálogos de dificultades, tipos de pregunta y modelos disponibles, y NO SHALL declararlos como constantes propias.

#### Scenario: Dificultad deshabilitada en el servidor

- **WHEN** el backend deja de habilitar una dificultad para evaluaciones
- **THEN** la interfaz deja de ofrecerla sin necesidad de cambios en el cliente

