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

## Estructura base

- `app/`: rutas y layout principal.
- `components/`: componentes de interfaz y modulos de dominio.
- `lib/`: clientes API, utilidades y almacenamiento local.
- `hooks/`: hooks de autenticacion y estado.
- `types/`: contratos TypeScript compartidos.

## Objetivo

El foco del frontend es entregar una experiencia clara para estudiantes y administradores en torno a aprendizaje financiero, generacion de evaluaciones y seguimiento de progreso.
