# Guía Frontend Completa: Student Profile + Sistema de Tests

## 1. Objetivo

Este documento es una guía práctica para implementar en frontend todo lo que acaba de quedar en backend:

1. Perfil de estudiante extendido (progreso, dominio por tema, historial de práctica).
2. Sistema de tests de práctica tipo Duolingo (crear test, responder preguntas, finalizar test).

La idea es que puedas usar esto como blueprint directo de pantallas, estado, tipos y llamadas API.

---

## 2. Resumen de funcionalidades disponibles en backend

## 2.1 Student Profile (usuario)

Ahora el backend entrega, además de perfil básico y gamificación:

- `learning_profile`
  - `domain_knowledge` (score por tema),
  - `practice_history` (historial granular),
  - `total_practice_minutes`,
  - `last_practice_at`.
- `practice_history_summary`
  - resumen por tema con accuracy reciente.

Además hay endpoints para:

- consultar `learning_profile`,
- registrar un intento de práctica manual.

## 2.2 Learning Tests

Nuevo sistema para sesiones de práctica:

- crear test con filtros opcionales,
- obtener test y pregunta actual,
- responder pregunta actual,
- finalizar automáticamente al responder la última.

Cada respuesta actualiza automáticamente el perfil del estudiante.

---

## 3. Endpoints que debes consumir

Todos bajo `API_V1_PREFIX` (actualmente `/api/v1`) y autenticados con Bearer JWT.

## 3.1 Auth/usuario existente (ya lo tenías)

- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/register`

## 3.2 Student Profile

### `GET /users/{user_id}/learning-profile`

Devuelve solo progreso de aprendizaje.

### `POST /users/{user_id}/practice-attempt`

Registra intento manual (útil para flujos alternativos fuera de learning tests).

## 3.3 Learning tests

### `POST /learning/tests`

Crea una sesión de test para el usuario autenticado.

### `GET /learning/tests`

Lista tests del usuario autenticado.

### `GET /learning/tests/{test_id}`

Obtiene estado detallado del test y pregunta actual.

### `POST /learning/tests/{test_id}/answer`

Responde la pregunta actual del test.

---

## 4. Contratos de datos para frontend (TypeScript sugerido)

```ts
export type FinancialTopic =
  | "Planificación y presupuesto"
  | "El mundo del crédito"
  | "Economía práctica"
  | "Primer empleo y conceptos laborales"
  | "Ahorro e inversión básica"
  | "Productos bancarios y seguridad";

export interface DomainKnowledge {
  topic: FinancialTopic;
  score: number; // 0..100
  attempts: number;
  correct_attempts: number;
  last_practiced_at: string | null;
}

export interface PracticeHistoryEntry {
  question_id: string | null;
  topic: FinancialTopic;
  subtopic: string | null;
  difficulty: string | null;
  is_correct: boolean;
  response_time_seconds: number | null;
  practiced_at: string;
}

export interface PracticeHistorySummary {
  topic: FinancialTopic;
  last_practiced_at: string | null;
  total_seen: number;
  recent_accuracy: number; // 0..1
}

export interface UserLearningProfile {
  domain_knowledge: DomainKnowledge[];
  practice_history: PracticeHistoryEntry[];
  total_practice_minutes: number;
  last_practice_at: string | null;
}

export interface UserResponse {
  id: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  profile: {
    age: number;
    education_level: string;
    interests: FinancialTopic[];
  };
  gamification: {
    current_streak: number;
    max_streak: number;
    total_xp: number;
    last_activity_date: string | null;
  };
  learning_profile: UserLearningProfile;
  practice_history_summary: PracticeHistorySummary[];
  created_at: string;
}

export type PracticeTestStatus = "in_progress" | "completed";

export interface PracticeTestCreateRequest {
  question_count?: number; // default 5
  category?: FinancialTopic;
  subtopic?: string;
  difficulty?: "Fácil" | "Medio" | "Difícil";
  title?: string;
}

export interface PracticeTestQuestionPublic {
  question_index: number;
  question_id: string;
  category: FinancialTopic;
  subtopic: string;
  difficulty: "Fácil" | "Medio" | "Difícil";
  prompt: string;
  alternatives: { option_id: number; text: string }[];
}

export interface PracticeTestDetailResponse {
  id: string;
  user_id: string;
  title: string | null;
  status: PracticeTestStatus;
  total_questions: number;
  answered_questions: number;
  correct_answers: number;
  created_at: string;
  completed_at: string | null;
  current_question: PracticeTestQuestionPublic | null;
}

export interface PracticeTestSummaryResponse {
  id: string;
  user_id: string;
  title: string | null;
  status: PracticeTestStatus;
  total_questions: number;
  answered_questions: number;
  correct_answers: number;
  created_at: string;
  completed_at: string | null;
}

export interface SubmitAnswerRequest {
  selected_option_id: number;
  response_time_seconds?: number;
}

export interface SubmitAnswerResponse {
  test: PracticeTestDetailResponse;
  is_correct: boolean;
  correct_option_id: number;
  feedback: string;
}
```

---

## 5. Flujos UX recomendados

## 5.1 Home / Dashboard estudiante

Mostrar:

- Progreso por tema (`domain_knowledge`) con barras.
- Accuracy reciente por tema (`practice_history_summary`).
- Métricas rápidas:
  - `total_practice_minutes`,
  - último intento,
  - XP total.
- CTA principal:
  - “Comenzar práctica” => crea test.

## 5.2 Crear test (pantalla o modal)

Inputs:

- `question_count` (1..20)
- categoría opcional
- subtema opcional
- dificultad opcional
- título opcional

Acción:

- `POST /learning/tests`
- navegar al runner del test usando `test.id`.

## 5.3 Runner de test (core)

Pantalla debe mostrar:

- progreso (`answered_questions / total_questions`)
- pregunta actual
- alternativas como botones
- feedback post-respuesta
- botón “Siguiente” implícito via submit (el backend ya avanza)

Algoritmo UI:

1. Cargar test por `GET /learning/tests/{id}` (si entras directo por URL).
2. Si `status=completed`, redirigir a resultados.
3. Si `current_question` es `null` y no completed, manejar error de estado.
4. Al responder:
   - deshabilitar opciones,
   - enviar `POST /answer`,
   - mostrar feedback (`is_correct`, `feedback`, opcional “respuesta correcta era opción X”),
   - renderizar siguiente pregunta o pantalla final si `completed`.

## 5.4 Resultados de test

Mostrar:

- puntaje bruto (`correct_answers / total_questions`)
- porcentaje de acierto
- CTA:
  - “Ver progreso”
  - “Nuevo test”

Después de cerrar resultados:

- refrescar perfil de estudiante (`GET /auth/me` o `/users/{id}/learning-profile`).

---

## 6. Arquitectura de estado recomendada (React)

Si usas React Query:

## Queries

- `useMeQuery` -> `/auth/me`
- `useLearningProfileQuery(userId)` -> `/users/{id}/learning-profile`
- `usePracticeTestsQuery()` -> `/learning/tests`
- `usePracticeTestQuery(testId)` -> `/learning/tests/{id}`

## Mutations

- `useCreatePracticeTestMutation` -> `/learning/tests`
- `useSubmitAnswerMutation(testId)` -> `/learning/tests/{id}/answer`
- `useRegisterPracticeAttemptMutation(userId)` -> `/users/{id}/practice-attempt` (opcional)

## Invalidaciones recomendadas

Tras `submitAnswer`:

- invalidar `practiceTest(testId)` si necesitas re-fetch.
- invalidar `learningProfile(userId)`.
- invalidar `me`.

Tras `createPracticeTest`:

- invalidar `practiceTests`.

---

## 7. Ejemplos de requests/responses reales

## 7.1 Crear test

Request:

```http
POST /api/v1/learning/tests
Authorization: Bearer <token>
Content-Type: application/json

{
  "question_count": 5,
  "category": "Ahorro e inversión básica",
  "difficulty": "Fácil",
  "title": "Práctica del día"
}
```

Response (resumen):

```json
{
  "id": "67f...",
  "status": "in_progress",
  "total_questions": 5,
  "answered_questions": 0,
  "correct_answers": 0,
  "current_question": {
    "question_index": 0,
    "question_id": "67a...",
    "prompt": "¿Cuál es...?",
    "alternatives": [
      { "option_id": 0, "text": "..." },
      { "option_id": 1, "text": "..." },
      { "option_id": 2, "text": "..." },
      { "option_id": 3, "text": "..." }
    ]
  }
}
```

## 7.2 Responder pregunta

Request:

```http
POST /api/v1/learning/tests/{test_id}/answer
Authorization: Bearer <token>
Content-Type: application/json

{
  "selected_option_id": 2,
  "response_time_seconds": 9.8
}
```

Response:

```json
{
  "test": {
    "id": "67f...",
    "status": "in_progress",
    "answered_questions": 1,
    "correct_answers": 1,
    "current_question": {
      "question_index": 1,
      "alternatives": [
        { "option_id": 0, "text": "..." }
      ]
    }
  },
  "is_correct": true,
  "correct_option_id": 2,
  "feedback": "¡Correcto! ..."
}
```

## 7.3 Obtener learning profile

Request:

```http
GET /api/v1/users/{user_id}/learning-profile
Authorization: Bearer <token>
```

Response:

```json
{
  "domain_knowledge": [
    {
      "topic": "Ahorro e inversión básica",
      "score": 75.0,
      "attempts": 8,
      "correct_attempts": 6,
      "last_practiced_at": "2026-03-24T20:00:00Z"
    }
  ],
  "practice_history": [
    {
      "question_id": "67a...",
      "topic": "Ahorro e inversión básica",
      "subtopic": "Fondo de Emergencia",
      "difficulty": "Fácil",
      "is_correct": true,
      "response_time_seconds": 9.8,
      "practiced_at": "2026-03-24T20:00:00Z"
    }
  ],
  "total_practice_minutes": 12,
  "last_practice_at": "2026-03-24T20:00:00Z"
}
```

---

## 8. Manejo de errores (importante para UX)

## 8.1 Errores comunes en Learning

- `400` al crear test:
  - “No hay preguntas disponibles para los filtros solicitados”.
  - UI: mostrar aviso y sugerir quitar filtros.

- `400` al responder:
  - “Este test ya fue completado”.
  - UI: redirigir a resultados/listado.

- `422` al responder:
  - opción inválida para la pregunta actual.
  - UI: refrescar estado del test y re-render.

- `403`:
  - test no pertenece al usuario.
  - UI: mostrar “sin permisos” + salida al dashboard.

- `401`:
  - token expirado o ausente.
  - UI: logout + redirect login.

## 8.2 Errores en Student Profile

- `404` usuario no encontrado.
- `403` al consultar perfil de otro usuario sin permisos.

---

## 9. Estrategia de routing recomendada

Rutas sugeridas:

- `/dashboard`
- `/practice/new`
- `/practice/test/:testId`
- `/practice/test/:testId/result`
- `/profile/progress`

Reglas:

- si no autenticado -> `/login`.
- si test completado y entras al runner -> ir a resultados.

---

## 10. Recomendación de componentes UI

## 10.1 Student Profile

- `DomainProgressCard`
- `DomainProgressList`
- `PracticeHistoryTable`
- `LearningStatsHeader`
- `RecentAccuracyChart`

## 10.2 Learning

- `CreateTestForm`
- `TestProgressBar`
- `QuestionCard`
- `AlternativesList`
- `AnswerFeedbackPanel`
- `TestResultSummary`

---

## 11. Formato visual de métricas

## Score por dominio (0..100)

- 0-39: rojo
- 40-69: ámbar
- 70-100: verde

## Accuracy reciente (0..1)

- mostrar como porcentaje (`recent_accuracy * 100`).

## Tiempo total práctica

- convertir a horas/minutos legibles en UI.

---

## 12. Checklist de implementación frontend

1. Definir tipos TS de este documento.
2. Crear cliente HTTP con interceptor JWT.
3. Implementar hooks de queries/mutations.
4. Implementar pantalla dashboard con `learning_profile`.
5. Implementar creación de test.
6. Implementar runner secuencial.
7. Implementar pantalla resultados.
8. Refrescar perfil tras finalizar test.
9. Manejar errores 400/401/403/404/422.
10. QA de edge cases:
   - test sin preguntas disponibles,
   - test ya completado,
   - refresco de página en runner.

---

## 13. Edge cases que debes contemplar

1. `current_question = null` pero `status=in_progress`:
   - inconsistencia eventual, hacer re-fetch y fallback.

2. Usuario abre el mismo test en dos tabs:
   - puede desincronizar índice local; siempre confiar en respuesta del backend.

3. Doble click en alternativa:
   - deshabilitar botones mientras mutation está en curso.

4. Sesión expirada al responder:
   - guardar estado mínimo local y pedir relogin.

5. Filtros demasiado restrictivos al crear:
   - fallback con prompt para relajar filtros.

---

## 14. Integración mínima paso a paso

## Paso A: Dashboard

- usa `/auth/me`
- renderiza `learning_profile` + `practice_history_summary`.

## Paso B: Crear y tomar test

- `POST /learning/tests`
- navegar a `/practice/test/{id}`
- usar respuesta directa o re-fetch por `GET`.

## Paso C: Responder

- `POST /learning/tests/{id}/answer` por cada respuesta.
- renderizar feedback.

## Paso D: Cierre

- al detectar `test.status=completed`, mostrar resultados.
- refrescar profile para ver avance.

---

## 15. Qué no hacer en frontend

1. No calcular correctitud local comparando índices guardados (backend manda el resultado real).
2. No asumir que siempre hay 4 preguntas o número fijo.
3. No hardcodear solo una categoría.
4. No exponer lógica de “respuesta correcta” antes del submit.
5. No depender de orden estable de preguntas entre tests distintos.

---

## 16. Roadmap frontend sugerido tras esta implementación

1. Pantalla “reanudar último test en progreso”.
2. Historial de tests (timeline).
3. Gráficos por tema y evolución semanal.
4. Badges y metas diarias usando `gamification.total_xp`.
5. Insights: “tema más débil” y CTA a test filtrado.

---

## 17. Resumen final

Con lo disponible hoy en backend ya puedes implementar una experiencia completa:

- perfil de aprendizaje visible,
- práctica guiada por tests,
- progreso persistente y acumulativo,
- feedback por respuesta,
- cierre de sesión con resultados.

No requiere IA adaptativa para funcionar.
Es una base sólida para iterar luego hacia personalización inteligente.
