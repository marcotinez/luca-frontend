## Context

El patrón actual es, para cada respuesta:

```ts
function normalizeSnapshotResponse(data: unknown): SnapshotResponse {
  const raw = (data ?? {}) as Record<string, unknown>;
  return { snapshot_id: normalizeString(raw.snapshot_id), ... };
}
```

Con veinticinco funciones así, cualquier campo nuevo del backend exige tocar el normalizador o desaparece silenciosamente. Y como todo campo ausente se rellena con `''` o `0`, un error del servidor se ve en pantalla como un snapshot vacío en lugar de un mensaje de error.

El backend publica `/openapi.json` (FastAPI), que es el contrato real.

## Goals / Non-Goals

**Goals:**
- Un solo lugar donde vive el contrato.
- Que un cambio incompatible del backend rompa la compilación, no la pantalla.
- Menos código que mantener sin perder robustez donde importa.

**Non-Goals:**
- Introducir un cliente generado completo ni un cambio a otra librería HTTP.
- Validar en tiempo de ejecución todas las respuestas (es coste sin beneficio contra un backend propio y tipado).
- Reescribir la capa de presentación de las páginas administrativas (va en su propio change).

## Decisions

- **Tipos generados desde OpenAPI, ejecutados a demanda**: un script `npm run types:api` regenera `types/api.generated.ts` desde `/openapi.json`. No se ejecuta en cada build para no acoplar la compilación al backend estando en marcha; se versiona el resultado. Alternativa descartada: mantener los tipos a mano, que es la fuente actual de divergencia.
- **zod solo en dos límites**: configuración y taxonomía, porque su contenido alimenta formularios de edición y una respuesta malformada corrompería lo que el administrador guardaría de vuelta. El resto se consume tipado. Alternativa descartada: zod en todas las respuestas, que reintroduce el mismo peso que se quiere eliminar.
- **Errores en lugar de valores por defecto**: una respuesta inesperada produce un error que la interfaz muestra. Los valores por defecto silenciosos son la razón por la que hoy es difícil distinguir "no hay datos" de "el backend falló".
- **División por dominio**: el archivo único mezcla configuración, taxonomía, catálogo de modelos y todo el ciclo de generación; separarlo permite que la consola de generación cargue solo lo suyo.

## Risks / Trade-offs

- [Un backend con un campo faltante ya no se "arregla" solo] → Es el objetivo: el error se ve. Los formularios se apoyan en los valores por defecto del backend, que ahora vienen de la configuración en base de datos.
- [Tipos generados versionados pueden quedar desactualizados] → Se regeneran en el mismo PR que cambia el backend y se documenta en el flujo de trabajo.
- [Dividir el módulo toca muchos imports] → Se hace en un solo commit mecánico.

## Migration Plan

1. Añadir el script de generación y el archivo de tipos generados.
2. Sustituir los normalizadores por tipos generados, dominio a dominio, empezando por los de menor superficie (modelos, progreso).
3. Introducir los dos esquemas zod de configuración y taxonomía.
4. Dividir el módulo y actualizar imports.

Rollback: cada dominio migrado es independiente.

## Open Questions

- Ninguna abierta.
