## ADDED Requirements

### Requirement: Contrato de validación provisto por el servidor

La interfaz de configuración SHALL obtener del backend los placeholders requeridos por cada plantilla, los catálogos disponibles y los rangos válidos, y NO SHALL mantener copias propias de ese contrato.

#### Scenario: Nuevo placeholder requerido

- **WHEN** el backend añade un placeholder obligatorio a una plantilla
- **THEN** el editor lo muestra como requerido y bloquea el guardado si falta, sin cambios en el cliente

#### Scenario: Plantilla incompleta

- **WHEN** el administrador intenta guardar una plantilla a la que le falta un placeholder obligatorio
- **THEN** el guardado se bloquea y se señala el placeholder faltante

### Requirement: Edición por secciones con guardado parcial

La interfaz SHALL permitir editar cada sección de configuración de forma independiente y SHALL enviar únicamente los campos modificados.

#### Scenario: Guardado de un cambio aislado

- **WHEN** el administrador modifica un solo campo y guarda
- **THEN** se envía solo ese campo
- **AND** el resto de la configuración permanece intacta

#### Scenario: Rechazo del servidor

- **WHEN** el servidor rechaza el guardado por configuración inválida
- **THEN** se muestra el mensaje del servidor identificando el campo
- **AND** el borrador del formulario se conserva para corregirlo

### Requirement: Aviso de cambios sin guardar

La interfaz SHALL advertir al administrador antes de abandonar una sección con cambios sin guardar.

#### Scenario: Navegación con cambios pendientes

- **WHEN** el administrador navega fuera de una sección con cambios sin guardar
- **THEN** se le pide confirmación antes de descartarlos

### Requirement: Edición de taxonomía sobre una estructura única

El editor de taxonomía SHALL operar sobre la estructura jerárquica de categorías y subcategorías, y NO SHALL mantener en paralelo una representación plana.

#### Scenario: Renombrar una categoría

- **WHEN** el administrador renombra una categoría
- **THEN** el cambio se refleja en sus subcategorías y en la vista previa sin desincronización

#### Scenario: Nombres duplicados

- **WHEN** el administrador intenta crear una categoría o subcategoría con un nombre ya existente
- **THEN** la interfaz lo impide y lo indica antes de guardar

#### Scenario: Guardado de la taxonomía

- **WHEN** el administrador guarda la taxonomía
- **THEN** se envía únicamente la estructura jerárquica

### Requirement: Secciones descubiertas dinámicamente

La página índice de configuración SHALL construir su navegación a partir de las secciones que declara el servidor.

#### Scenario: Nueva sección en el servidor

- **WHEN** el backend publica una sección de configuración adicional
- **THEN** aparece en el índice sin cambios en el cliente
