## ADDED Requirements

### Requirement: Estado de sesión único en la aplicación

La aplicación SHALL mantener un único estado de sesión compartido por todos los componentes, con una sola validación al arrancar y un solo temporizador de renovación.

#### Scenario: Varias vistas montadas a la vez

- **WHEN** varios componentes que consumen la sesión se montan en la misma pantalla
- **THEN** se realiza una única petición de validación de la sesión
- **AND** existe un único temporizador de renovación activo

#### Scenario: Uso fuera del proveedor

- **WHEN** un componente consume la sesión sin estar dentro del proveedor
- **THEN** se produce un error explícito en tiempo de desarrollo

### Requirement: Ciclo de vida de la sesión

La aplicación SHALL permitir iniciar sesión, registrarse, cerrar sesión y cambiar la contraseña, actualizando el estado compartido y el almacenamiento local de forma consistente.

#### Scenario: Inicio de sesión

- **WHEN** el usuario inicia sesión con credenciales válidas
- **THEN** la credencial y el perfil quedan almacenados
- **AND** el estado pasa a autenticado sin recargar la página

#### Scenario: Cierre de sesión

- **WHEN** el usuario cierra sesión
- **THEN** se limpia todo el almacenamiento local de la aplicación
- **AND** se cancela el temporizador de renovación
- **AND** se redirige al inicio de sesión

#### Scenario: Sesión inválida al arrancar

- **WHEN** existe una credencial almacenada que el backend rechaza
- **THEN** la sesión se limpia y el estado pasa a anónimo

### Requirement: Renovación proactiva del token

La aplicación SHALL renovar la credencial antes de su expiración, calculando el momento a partir de la propia credencial, y SHALL cerrar la sesión si la renovación falla.

#### Scenario: Sesión larga

- **WHEN** el usuario permanece activo más allá de la vigencia inicial de la credencial
- **THEN** la credencial se renueva antes de expirar y el usuario no es expulsado

#### Scenario: Renovación fallida

- **WHEN** la renovación falla
- **THEN** la sesión se cierra y se redirige al inicio de sesión

### Requirement: Control de acceso por rol en las rutas

La aplicación SHALL proteger las rutas mediante una guarda única parametrizada por el acceso requerido —pública, autenticada o de superusuario— y NO SHALL renderizar contenido protegido antes de resolver el estado de sesión.

#### Scenario: Ruta de superusuario sin privilegios

- **WHEN** un usuario autenticado sin rol de superusuario navega a una ruta administrativa
- **THEN** se le redirige fuera del área administrativa sin mostrar su contenido

#### Scenario: Ruta pública con sesión activa

- **WHEN** un usuario con sesión activa navega a inicio de sesión o registro
- **THEN** se le redirige a su panel

#### Scenario: Estado de sesión sin resolver

- **WHEN** la sesión todavía se está validando
- **THEN** la ruta muestra un indicador de carga y no el contenido protegido
