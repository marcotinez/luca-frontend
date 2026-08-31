## 1. Componentes sin consumidores

- [ ] 1.1 Eliminar `StatsGrid`, `PathwayTopic`, `WelcomeHeader` y `LevelProgressBar`
- [ ] 1.2 Eliminar `learning/RecentAccuracyChart`, `learning/PracticeHistoryTable`, `learning/SubtopicProgressList`, `learning/LearningStatsHeader` y `learning/DomainProgressList`
- [ ] 1.3 Eliminar `ui/separator` si sigue sin consumidores tras el resto de cambios

## 2. Rutas

- [ ] 2.1 Eliminar `app/inicio/` y añadir redirección a `/dashboard`
- [ ] 2.2 Unificar todos los enlaces de navegación al destino vigente

## 3. API y dependencias

- [ ] 3.1 Unificar `getQuestions` y `listQuestions` en una sola función con filtros
- [ ] 3.2 Decidir sobre `pdfjs-dist`: retirarlo o dejarlo con carga diferida y su motivo documentado
- [ ] 3.3 Revisar y retirar las dependencias que queden sin uso
- [ ] 3.4 Eliminar tipos y utilidades sin consumidores detectados en la revisión

## 4. Prevención

- [ ] 4.1 Añadir a la configuración de lint la detección de exportaciones sin uso
- [ ] 4.2 Documentar el comando de verificación en el README

## 5. Verificación

- [ ] 5.1 `npm run build` y `npm run lint` sin errores
- [ ] 5.2 Recorrido manual de las vistas de estudiante y administración sin regresiones
- [ ] 5.3 Registrar en el PR las líneas y dependencias eliminadas
