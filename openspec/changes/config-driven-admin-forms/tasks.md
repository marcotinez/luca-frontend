## 1. Contrato desde el servidor

- [ ] 1.1 Consumir del endpoint de configuración los placeholders requeridos, catálogos y rangos
- [ ] 1.2 Eliminar `REQUIRED_PLACEHOLDERS` y las constantes de catálogo del frontend
- [ ] 1.3 Mostrar en el editor de prompts los placeholders requeridos y señalar los faltantes

## 2. Hook de sección

- [ ] 2.1 Crear `useConfigSection(section)` con carga, borrador, detección de cambios, validación y guardado parcial
- [ ] 2.2 Migrar las páginas de generación, ingesta y modelos al hook
- [ ] 2.3 Añadir el aviso de cambios sin guardar al navegar

## 3. Editor de taxonomía

- [ ] 3.1 Reescribir el estado del editor sobre la estructura jerárquica única
- [ ] 3.2 Expresar añadir, renombrar, mover y borrar como transformaciones sobre esa estructura
- [ ] 3.3 Validar nombres duplicados y vacíos antes de guardar
- [ ] 3.4 Enviar únicamente la estructura jerárquica en el guardado

## 4. Índice

- [ ] 4.1 Construir la navegación de configuración a partir de las secciones declaradas por el servidor

## 5. Verificación

- [ ] 5.1 Comprobar que un placeholder añadido en el backend aparece como requerido sin tocar el cliente
- [ ] 5.2 Comprobar que guardar un solo campo no altera el resto de la sección
- [ ] 5.3 Comprobar el aviso de cambios sin guardar en las cuatro páginas
- [ ] 5.4 Recorrido manual del editor de taxonomía: crear, renombrar, mover, borrar y guardar
- [ ] 5.5 `npm run build` y `npm run lint` sin errores
