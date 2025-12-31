// ============================================================================
// ENUMS
// ============================================================================

// Subtópicos de educación financiera
export enum SubTopic {
  // Planificación y presupuesto
  GASTOS_FIJOS_VARIABLES = "Diferenciar Gastos Fijos vs. Variables",
  PRESUPUESTO_MENSUAL = "Crear un Presupuesto Mensual",
  METAS_FINANCIERAS = "Establecer Metas Financieras",
  CONTROL_GASTOS = "Control y Seguimiento de Gastos",

  // El mundo del crédito
  QUE_ES_CREDITO = "¿Qué es el Crédito?",
  TIPOS_CREDITO = "Tipos de Crédito (Consumo, Hipotecario, Automotriz)",
  TASA_INTERES = "Tasa de Interés y CAE",
  HISTORIAL_CREDITICIO = "Historial Crediticio y Score",
  DEUDAS_RESPONSABLES = "Manejo Responsable de Deudas",

  // Economía práctica
  INFLACION = "Inflación y Poder Adquisitivo",
  OFERTA_DEMANDA = "Oferta y Demanda",
  IMPUESTOS_BASICOS = "Impuestos Básicos (IVA, Renta)",
  ECONOMIA_PERSONAL = "Economía Personal y Familiar",

  // Primer empleo y conceptos laborales
  CONTRATO_TRABAJO = "Tipos de Contrato de Trabajo",
  LIQUIDACION_SUELDO = "Lectura de Liquidación de Sueldo",
  AFP_SALUD = "AFP y Sistema de Salud",
  DERECHOS_LABORALES = "Derechos y Deberes Laborales",
  FINIQUITO = "Finiquito y Término de Contrato",

  // Ahorro e inversión básica
  HABITO_AHORRO = "Crear Hábito de Ahorro",
  FONDO_EMERGENCIA = "Fondo de Emergencia",
  INSTRUMENTOS_AHORRO = "Instrumentos de Ahorro (Cuenta de Ahorro, Depósito a Plazo)",
  INVERSION_BASICA = "Conceptos Básicos de Inversión",
  RIESGO_RENTABILIDAD = "Riesgo vs. Rentabilidad",

  // Productos bancarios y seguridad
  CUENTA_CORRIENTE_VISTA = "Cuenta Corriente vs. Cuenta Vista",
  TARJETAS_DEBITO_CREDITO = "Tarjetas de Débito y Crédito",
  SEGURIDAD_BANCARIA = "Seguridad en Transacciones Bancarias",
  FRAUDES_ESTAFAS = "Prevención de Fraudes y Estafas",
  BANCA_DIGITAL = "Uso Seguro de Banca Digital"
}

// Niveles de dificultad de las preguntas
export enum Difficulty {
  FACIL = "Fácil",
  MEDIO = "Medio",
  DIFICIL = "Difícil"
}

// Estados de revisión de las preguntas
export enum Status {
  ACEPTADA = "aceptada",
  RECHAZADA = "rechazada",
  EN_REVISION = "en_revision"
}

// ============================================================================
// QUESTION TYPES
// ============================================================================

// Alternativa de respuesta para una pregunta
export interface Alternative {
  text: string;
  is_correct: boolean;
  feedback: string;
}

// Metadatos pedagógicos de la pregunta
export interface PedagogicMetadata {
  rag_reference: string;
  complete_explanation: string;
}

// Respuesta de la API al obtener una pregunta
export interface QuestionResponse {
  id: string;
  status: Status;
  category: string; // FinancialTopic as string
  subtopic: string; // SubTopic as string
  difficulty: Difficulty;
  question: string;
  alternatives: Alternative[];
  pedagogic_metadata: PedagogicMetadata;
  created_at: string;
}

// Datos para crear una nueva pregunta
export interface QuestionCreate {
  category: string; // FinancialTopic as string
  subtopic: string; // SubTopic as string
  difficulty: Difficulty;
  question: string;
  alternatives: Alternative[];
  pedagogic_metadata: PedagogicMetadata;
  status?: Status;
}

// Datos para actualizar una pregunta existente
export interface QuestionUpdate {
  category?: string; // FinancialTopic as string
  subtopic?: string; // SubTopic as string
  difficulty?: Difficulty;
  question?: string;
  alternatives?: Alternative[];
  pedagogic_metadata?: PedagogicMetadata;
  status?: Status;
}
