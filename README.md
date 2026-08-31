Luca es una plataforma de educacion financiera adaptativa con evaluaciones inteligentes, rutas de aprendizaje personalizadas y herramientas administrativas para gestion de contenido.

## Desarrollo

Instala dependencias y levanta el entorno local:

```bash
npm install
npm run dev
```

La aplicacion queda disponible en `http://localhost:3000`.

## Scripts utiles

- `npm run dev`: inicia el entorno de desarrollo.
- `npm run build`: genera el build de produccion.
- `npm run start`: sirve el build generado.
- `npm run lint`: ejecuta validaciones de lint.
- `npm run dead-code`: detecta archivos, exportaciones y dependencias sin consumidores (`knip`, configurado en `knip.json`). Antes de eliminar algo que reporte, confirma que de verdad no tiene consumidor interno — algunos tipos/funciones se usan solo dentro de su propio archivo y por eso quedan marcados igual; no es un `--fix` automático, cada hallazgo se revisa a mano.
- `npm run types:api`: regenera `types/api.generated.ts` desde el `/openapi.json` del backend en marcha (usa `API_URL`, por defecto `http://localhost:8080`). No corre en cada build a propósito, para no acoplar la compilación a que el backend esté levantado; el archivo generado se versiona. Ejecútalo cuando el backend cambie contratos de la API y en el mismo PR que ese cambio.

## Estructura base

- `app/`: rutas y layout principal.
- `components/`: componentes de interfaz y modulos de dominio.
- `lib/`: clientes API, utilidades y almacenamiento local.
- `hooks/`: hooks de autenticacion y estado.
- `types/`: contratos TypeScript compartidos.

## Objetivo

El foco del frontend es entregar una experiencia clara para estudiantes y administradores en torno a aprendizaje financiero, generacion de evaluaciones y seguimiento de progreso.
