# Guía Backend -> Frontend (Evaluaciones)

## Propósito

Este documento resume lo que **ya está implementado en backend** para evaluaciones, para que frontend lo consuma y lo refleje correctamente en UI.

Fecha de referencia: 2026-04-20.

---

## 1) Endpoints disponibles

Base: `/api/v1/learning`

- `POST /tests`
- `POST /tests/category`
- `POST /tests/recommended`
- `GET /tests/availability`
- `GET /tests`
- `GET /tests/{test_id}`
- `POST /tests/{test_id}/answer`
- `GET /adaptive-stats`

Todos requieren usuario autenticado.

---

## 2) Reglas de negocio activas

## 2.1 Dificultad permitida en evaluaciones

Para evaluaciones (categoría o recomendadas), backend acepta solo:

- `Fácil`
- `Medio`

Si frontend envía `Difícil`, backend retorna `400`.

## 2.2 Selección de preguntas (adaptativa naive)

El selector usa historial del alumno en este orden de prioridad:

1. Preguntas falladas recientes.
2. Preguntas no vistas por el alumno.
3. Preguntas ya vistas (solo si no alcanza pool).

Dentro de cada bloque hay mezcla aleatoria.

## 2.3 Orden pedagógico final

Independiente del orden de selección interna, la evaluación se ordena para entrega como:

1. `Fácil`
2. `Medio`

No se envían preguntas `Difícil` en tests.

---

## 3) Modos de evaluación existentes

## 3.1 Modo categoría (`selection_mode = "category"`)

- Entra por categoría (y opcional subtópico).
- Prioriza subtópicos más débiles del alumno.
- Mantiene cobertura de otros subtópicos cuando corresponda.

## 3.2 Modo recomendado (`selection_mode = "recommended"`)

- Detecta categoría más débil por historial reciente.
- Define foco de refuerzo y parte de desafío (naive).
- Devuelve `adaptive_context` y `recommendation_reason` para UI.

---

## 4) Estructura de respuesta de test (lo que frontend recibe)

## 4.1 Summary/Detail

Campos relevantes:

- `id`
- `selection_mode` (`category` | `recommended`)
- `target_category`
- `target_subtopic`
- `recommendation_reason` (si recomendado)
- `adaptive_context` (si recomendado)
- `status` (`in_progress` | `completed`)
- `total_questions`
- `answered_questions`
- `correct_answers`
- `current_question` (solo cuando hay pregunta pendiente)

## 4.2 `current_question`

- `question_index`
- `question_id`
- `category`
- `subtopic`
- `difficulty`
- `adaptive_tag` (`reinforce` | `challenge` | null)
- `prompt`
- `alternatives`: solo `option_id` + `text` (no viene `is_correct` aquí)

---

## 5) Flujo de respuesta de una pregunta

Endpoint: `POST /tests/{test_id}/answer`

Request:

```json
{
  "selected_option_id": 1,
  "response_time_seconds": 12.4
}
```

Response:

```json
{
  "test": { "...": "estado actualizado" },
  "is_correct": true,
  "correct_option_id": 1,
  "feedback": "..."
}
```

Backend:

- actualiza progreso del test (`answered_count`, `current_question_index`, `status`),
- guarda intento dentro del test,
- registra evento en historial del alumno.

---

## 6) Historial del alumno que alimenta adaptatividad

Se guarda en `users.learning_profile.practice_history` con forma:

```json
{
  "question_id": "69e...",
  "topic": "Planificación y Presupuesto",
  "subtopic": "Gastos hormiga",
  "difficulty": "Fácil",
  "is_correct": false,
  "response_time_seconds": 18.5,
  "practiced_at": "2026-04-20T12:01:05Z"
}
```

Además backend actualiza:

- `domain_knowledge` (por categoría),
- `subtopic_knowledge` (por subtópico),
- `total_practice_minutes`,
- `last_practice_at`,
- `gamification` (racha y XP).

---

## 7) Errores esperables para manejar en frontend

## 7.1 `400` por dificultad no permitida

Caso: enviar `Difícil` en creación de test.

## 7.2 `400` por falta de preguntas

Casos:

- `NO_QUESTIONS_FOR_FILTERS`
- `INSUFFICIENT_QUESTIONS_FOR_REQUESTED_COUNT`

Puede venir `detail` con `suggestions` para fallback de UI.

## 7.3 `422` al responder opción inválida

Caso: `selected_option_id` fuera de alternativas disponibles para esa pregunta.

## 7.4 `400` test ya completado

Caso: intentar responder cuando `status = completed`.

---

## 8) Señales backend para UX adaptativa

Frontend puede mostrar al usuario que el sistema se ajusta con:

- `recommendation_reason`
- `adaptive_context.target_category`
- `adaptive_context.basis_accuracy`
- `current_question.adaptive_tag`

Estas señales ya salen desde backend, no hay que calcularlas en cliente.

---

## 9) Contrato funcional mínimo que frontend debe respetar

1. No ofrecer `Difícil` en formularios de evaluación.
2. Tratar `current_question` como única pregunta activa del intento.
3. Enviar siempre `selected_option_id` válido (0..3).
4. Asumir que `is_correct` se conoce solo después de responder.
5. Usar `adaptive-stats` para paneles de progreso (no recalcular todo en cliente).

