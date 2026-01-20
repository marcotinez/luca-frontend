# Guía de Implementación Frontend: Módulo de Ingesta GraphRAG

> **Versión API:** v1
> **Base URL:** `/api/v1/ingestion`
> **Estado:** Estable
> **Última Actualización:** 20 de Enero, 2026

---

## Índice

1. [Introducción y Arquitectura](#1-introducción-y-arquitectura)
2. [Definiciones de Tipos (TypeScript)](#2-definiciones-de-tipos-typescript)
3. [Autenticación y Headers](#3-autenticación-y-headers)
4. [Endpoints Detallados](#4-endpoints-detallados)
   - [4.1 Iniciar Proceso (Upload)](#41-iniciar-proceso-upload)
   - [4.2 Polling de Estado](#42-polling-de-estado)
   - [4.3 Historial de Trabajos](#43-historial-de-trabajos)
   - [4.4 Restaurar Base de Datos](#44-restaurar-base-de-datos)
5. [Guía de Integración (React Pattern)](#5-guía-de-integración-react-pattern)
   - [Custom Hook: useIngestionJob](#custom-hook-useingestionjob)
   - [Calculando el Progreso Visual](#calculando-el-progreso-visual)
6. [Manejo de Errores y UX](#6-manejo-de-errores-y-ux)
7. [Mock Data para Pruebas](#7-mock-data-para-pruebas)

---

## 1. Introducción y Arquitectura

El módulo de **Ingesta (Ingestion)** es responsable de transformar documentos PDF en grafos de conocimiento estructurados. Debido a la naturaleza intensiva de este proceso (llamadas a OpenAI, algoritmos de grafos), la API utiliza un patrón **Asíncrono basado en Trabajos (Job-based Async Pattern)**.

### Flujo de Usuario Esperado

1.  **Subida:** El usuario selecciona un archivo PDF en el componente `FileUploader`.
2.  **Ack Inmediato:** El servidor responde inmediatamente con un `Job` en estado `PENDING`.
3.  **Progreso en Tiempo Real:** El frontend inicia un **polling** (consultas periódicas) al endpoint de estado.
4.  **Feedback Visual:**
    *   Se muestra una barra de progreso basada en `processed_chunks / total_chunks`.
    *   Se muestran contadores en tiempo real (Entidades extraídas, Relaciones encontradas).
5.  **Finalización:**
    *   Si el estado cambia a `COMPLETED`, se muestra un mensaje de éxito y resumen.
    *   Si cambia a `ERROR`, se muestra el mensaje de fallo y opción de reintentar.

---

## 2. Definiciones de Tipos (TypeScript)

Copia y pega estas interfaces en tu archivo de tipos `types/ingestion.ts`.

```typescript
/**
 * Estados posibles del proceso de ingesta
 */
export type IngestionStatus =
  | 'PENDING'     // En cola, esperando worker
  | 'PROCESSING'  // Trabajando activamente
  | 'COMPLETED'   // Finalizado con éxito
  | 'ERROR'       // Fallo crítico
  | 'SKIPPED';    // Archivo vacío o duplicado sin force

/**
 * Modelo principal del trabajo de ingesta
 */
export interface IngestionJob {
  _id: string;            // ID único del trabajo (Mongo ID)
  file_name: string;      // Nombre original del archivo
  file_path: string;      // Ruta interna (no exponer al usuario final)
  status: IngestionStatus;

  // Métricas de progreso
  total_pages: number;        // Páginas totales del PDF
  chunk_size: number;         // Páginas por chunk
  total_chunks: number;       // Total de unidades de trabajo
  processed_chunks: number;   // Unidades completadas

  // Estadísticas de GraphRAG
  total_tokens: number;       // Consumo de tokens LLM
  entities_extracted: number; // Nodos encontrados
  relationships_extracted: number; // Relaciones base
  refined_relationships: number;   // Relaciones inferidas por refinamiento

  refined_relationships: number;   // Relaciones inferidas por refinamiento

  // Logs en tiempo real
  logs: Array<{
    timestamp: string;
    level: string;
    message: string;
  }>;

  // Tiempos y Diagnóstico
  created_at: string;         // ISO Date
  updated_at?: string;        // ISO Date
  completed_at?: string;      // ISO Date
  execution_time_seconds: number;

  error_message?: string;     // Detalle del error si status === 'ERROR'
}

/**
 * Respuesta del endpoint de Restore
 */
export interface RestoreResponse {
  status: 'success' | 'error';
  message: string;
  statements_executed: number;
}
```

---

## 3. Autenticación y Headers

Aunque los endpoints actualmente son públicos para facilitar el desarrollo, se recomienda enviar siempre los headers estándar si la aplicación maneja sesiones.

### Headers Requeridos
```http
Authorization: Bearer <token_jwt>
Content-Type: multipart/form-data (para Uploads)
Content-Type: application/json (para consultas GET)
Accept: application/json
```

---

## 4. Endpoints Detallados

### 4.1 Iniciar Proceso (Upload)

Sube el archivo e inicializa el tracker.

- **URL:** `/process`
- **Método:** `POST`
- **Content-Type:** `multipart/form-data`

#### Parámetros (`FormData`)

| Key | Tipo | Requerido | Descripción |
|---|---|---|---|
| `file` | FileBlob | **Sí** | Archivo `.pdf`. Máx recomendado 50MB. |
| `force` | Boolean | No | Si `true`, ignora si el archivo ya fue procesado previamente y lo hace de nuevo. Default `false`. |

#### Ejemplo de llamada (Fetch)

```typescript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('force', 'false'); // Opcional

const response = await fetch('/api/v1/ingestion/process', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
    // Nota: NO poner Content-Type manualmente al usar FormData, el navegador lo pone con el boundary correcto
  },
  body: formData
});

const data: IngestionJob = await response.json();
// Guardar data._id para iniciar polling
```

#### Respuestas

- **201 Created:** Proceso iniciado correctamente. Retorna `IngestionJob`.
- **200 OK:** El archivo ya existe y `force=false`. Retorna el trabajo *anterior* completado.
- **400 Bad Request:** El archivo no es PDF.
- **500 Internal Server Error:** Error de escritura en disco o BD.

---

### 4.2 Polling de Estado

Consulta el progreso del trabajo activo.

- **URL:** `/jobs/{job_id}`
- **Método:** `GET`

#### Parámetros de URL

| Key | Tipo | Descripción |
|---|---|---|
| `job_id` | String | El `_id` obtenido en el endpoint anterior. |

#### Ejemplo de Respuesta (En Progreso)

```json
{
  "_id": "65ab2...",
  "file_name": "Manual_Finanzas.pdf",
  "status": "PROCESSING",
  "total_chunks": 10,
  "processed_chunks": 4,
  "entities_extracted": 120,
  "relationships_extracted": 85,
  "refined_relationships": 12,
  "total_tokens": 4500,
  "created_at": "2026-01-20T10:00:00Z"
}
```

#### Lógica de UI recomendada

1.  Hacer GET cada 2 segundos.
2.  Calcular porcentaje: `(processed_chunks / total_chunks) * 100`.
3.  Si `status === 'COMPLETED'`, detener polling y mostrar check verde.
4.  Si `status === 'ERROR'`, detener polling y mostrar alerta roja con `error_message`.

---

### 4.3 Historial de Trabajos

Para llenar la tabla de "Documentos Procesados" en el dashboard del administrador.

- **URL:** `/jobs`
- **Método:** `GET`

#### Query Parameters

| Key | Tipo | Default | Descripción |
|---|---|---|---|
| `limit` | Number | 10 | Paginación: Cantidad de filas. |
| `status` | String | null | Filtrar por estado (ej: `ERROR` para ver fallidos). |

#### Ejemplo de Respuesta

```json
[
  {
    "_id": "65ab2...",
    "file_name": "Reporte_2025.pdf",
    "status": "COMPLETED",
    "completed_at": "2026-01-20T10:05:00Z",
    "execution_time_seconds": 120.5
  },
  {
    "_id": "65ab1...",
    "file_name": "Borrador.pdf",
    "status": "ERROR",
    "error_message": "OpenAI Rate Limit Exceeded"
  }
]
```

---

### 4.4 Restaurar Base de Datos

Endpoint administrativo para resetear el grafo a un estado conocido usando un script Cypher.

- **URL:** `/restore`
- **Método:** `POST`
- **Content-Type:** `multipart/form-data`

#### Parámetros (`FormData`)

| Key | Tipo | Requerido | Descripción |
|---|---|---|---|
| `file` | FileBlob | **Sí** | Archivo `.cypher` o `.txt` con sentencias separadas por `;`. |
| `clear_db` | Boolean | No | Si `true`, ejecuta `MATCH (n) DETACH DELETE n` antes de importar. **PELIGROSO**. |

#### UX Recomendada
Mostrar siempre un Modal de Confirmación antes de llamar a este endpoint, especialmente si `clear_db=true`, advirtiendo de la pérdida de datos.

---

## 5. Guía de Integración (React Pattern)

Aquí tienes un ejemplo completo de cómo manejar la lógica de subida y polling usando **React Hooks customizados**.

### Custom Hook: `useIngestionJob`

Este hook encapsula la lógica de polling automático.

```typescript
import { useState, useEffect, useCallback } from 'react';
import { IngestionJob } from './types/ingestion';

export const useIngestionJob = (initialJobId: string | null) => {
  const [job, setJob] = useState<IngestionJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const fetchJobStatus = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/v1/ingestion/jobs/${id}`);
      if (!res.ok) throw new Error('Error fetching job');
      const data: IngestionJob = await res.json();
      setJob(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, []);

  useEffect(() => {
    if (!initialJobId) return;

    // Primer fetch inmediato
    fetchJobStatus(initialJobId);
    setIsPolling(true);

    const intervalId = setInterval(async () => {
      const currentJob = await fetchJobStatus(initialJobId);

      // Condiciones de parada
      if (currentJob && ['COMPLETED', 'ERROR', 'SKIPPED'].includes(currentJob.status)) {
        setIsPolling(false);
        clearInterval(intervalId);
      }
    }, 2000); // Poll cada 2 segundos

    return () => clearInterval(intervalId);
  }, [initialJobId, fetchJobStatus]);

  return { job, error, isPolling };
};
```

### Componente Visual (Ejemplo Simplificado)

```tsx
import { useIngestionJob } from './hooks/useIngestionJob';

export const IngestionTracker = ({ jobId }: { jobId: string }) => {
  const { job, isPolling } = useIngestionJob(jobId);

  if (!job) return <div>Cargando...</div>;

  // Cálculo de porcentaje seguro
  const percent = job.total_chunks > 0
    ? Math.round((job.processed_chunks / job.total_chunks) * 100)
    : 0;

  return (
    <div className="card p-4 border rounded shadow-sm">
      <h3 className="font-bold text-lg mb-2">{job.file_name}</h3>

      <div className="flex justify-between text-sm mb-1">
        <span>Estado: <span className={`badge ${job.status}`}>{job.status}</span></span>
        <span>{percent}%</span>
      </div>

      {/* Barra de Progreso */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        ></div>
      </div>

      {/* Estadísticas en Vivo */}
      <div className="grid grid-cols-3 gap-4 text-center text-sm">
        <StatBox label="Entidades" value={job.entities_extracted} />
        <StatBox label="Relaciones" value={job.relationships_extracted} />
        <StatBox label="Refinadas" value={job.refined_relationships} />
      </div>

      {job.status === 'ERROR' && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded text-sm">
          Error: {job.error_message}
        </div>
      )}
    </div>
  );
};
```

---

## 6. Manejo de Errores y UX

### Casos Comunes y Mensajes Sugeridos

| Estado HTTP / Error | Causa Probable | Mensaje al Usuario |
|---|---|---|
| **400 Bad Request** | Archivo incorrecto (png, docx) | "El archivo debe ser un PDF válido." |
| **500 Internal Error** | Falla de conexión a Neo4j/OpenAI | "Ocurrió un error en el servidor. Intenta nuevamente más tarde." |
| Job Status: **SKIPPED** | PDF vacío o solo imágenes sin OCR | "No pudimos extraer texto legible de este documento." |
| Job Status: **ERROR** | Exception durante procesamiento | "Hubo una interrupción en el procesamiento: [mensaje_técnico]" |

### Recomendaciones de Diseño

1.  **Bloqueo de UI:** Mientras se sube el archivo (antes de recibir el ID), deshabilita el botón de "Subir" y muestra un spinner local. La subida de 50MB puede tardar unos segundos dependiendo de la red.
2.  **Notificaciones:** Usa "Toasts" (notificaciones flotantes) cuando un trabajo pase de `PROCESSING` a `COMPLETED` para que el usuario se entere si cambió de pestaña.
3.  **Botón de Cancelar:** Actualmente el backend no soporta cancelación explícita de hilos, pero puedes permitir al usuario "Ocultar" la barra. El proceso seguirá en background.

---

## 7. Mock Data para Pruebas

Usa estos objetos JSON para mockear la UI mientras el backend no está disponible o para storybook.

**Job Pendiente:**
```json
{
  "_id": "mock_1",
  "file_name": "Prueba.pdf",
  "status": "PENDING",
  "processed_chunks": 0,
  "total_chunks": 0,
  "execution_time_seconds": 0,
  "created_at": "2026-01-20T12:00:00Z"
}
```

**Job en Progreso (50%):**
```json
{
  "_id": "mock_2",
  "file_name": "Prueba.pdf",
  "status": "PROCESSING",
  "processed_chunks": 5,
  "total_chunks": 10,
  "entities_extracted": 50,
  "relationships_extracted": 30,
  "total_tokens": 1200,
  "created_at": "2026-01-20T12:00:00Z"
}
```

**Job Finalizado:**
```json
{
  "_id": "mock_3",
  "file_name": "Prueba.pdf",
  "status": "COMPLETED",
  "processed_chunks": 10,
  "total_chunks": 10,
  "entities_extracted": 110,
  "relationships_extracted": 95,
  "refined_relationships": 15,
  "total_tokens": 5800,
  "execution_time_seconds": 85.5,
  "created_at": "2026-01-20T12:00:00Z",
  "completed_at": "2026-01-20T12:01:25Z"
}
```

**Job con Error:**
```json
{
  "_id": "mock_4",
  "file_name": "Corrupto.pdf",
  "status": "ERROR",
  "error_message": "UnicodeDecodeError: 'utf-8' codec can't decode byte 0x80 in position 0",
  "processed_chunks": 0,
  "total_chunks": 0,
  "created_at": "2026-01-20T12:00:00Z"
}
```
