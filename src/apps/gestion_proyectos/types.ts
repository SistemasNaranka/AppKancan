// Project statuses
export type ProjectStatus = "en_proceso" | "entregado" | "en_seguimiento";

// Project types
export type ProjectType = "actualizacion" | "proyecto_nuevo";

// Frequency types
export type FrequencyType = "diaria" | "semanal" | "mensual";

// Assignee (structure from Directus)
export interface Assignee {
  name: string;
  id?: number;
}

// Project process (step)
export interface Process {
  id: string;
  project_id: string;
  name: string;
  time_before: number;
  time_after: number;
  frequency_type: FrequencyType;
  frequency_quantity: number;
  weekdays: number;
  order: number;
}

// Project benefit
export interface Benefit {
  id: string;
  project_id: string;
  description: string;
}

// Main Project
export interface Project {
  id: string;
  name: string;
  benefited_area: string;
  description: string;
  start_date: string;
  estimated_date: string;
  delivery_date: string | null;
  status: ProjectStatus;
  project_type: ProjectType;
  assignees: Assignee[];
  created_by?: string;
  date_created?: string;
  // Related fields (optional, loaded separately)
  processes?: Process[];
  benefits?: Benefit[];
  feedbacks?: Feedback[];
  // Alias for compatibility with PostLanzamiento
  mejoras?: Array<{
    id: string;
    project_id: string;
    titulo: string;
    description: string;
    tipo: string;
    prioridad: string;
    estado: string;
  }>;
}

// Data to create a project
export interface CreateProjectInput {
  name: string;
  benefited_area: string;
  description: string;
  start_date: string;
  estimated_date: string;
  delivery_date: string | null;
  status: ProjectStatus;
  project_type: ProjectType;
  assignees: Assignee[];
}

// Data to create a process
export interface CreateProcessInput {
  project_id: string;
  name: string;
  time_before: number;
  time_after: number;
  frequency_type: FrequencyType;
  frequency_quantity: number;
  weekdays: number;
  order: number;
}

// Data to create a benefit
export interface CreateBenefitInput {
  project_id: string;
  description: string;
}

// Project feedback (post-launch)
export interface Feedback {
  id: string;
  project_id: string;
  author: string;
  description: string;
  date_created?: string;
}

// Data to create a feedback
export interface CreateFeedbackInput {
  project_id: string;
  author: string;
  description: string;
}

// Calculated metrics for a process
export interface ProcessMetrics {
  savings_per_execution: number; // seconds
  daily_savings: number; // seconds
  weekly_savings: number; // seconds
  monthly_savings: number; // seconds
  yearly_savings: number; // seconds
}

// Summary of project metrics
export interface ProjectMetrics {
  total_processes: number;
  total_monthly_savings: number; // seconds
  total_yearly_savings: number; // seconds
  processes_metrics: ProcessMetrics[];
}

// Selector options
export const OPTIONS_STATUS: { value: ProjectStatus; label: string }[] = [
  { value: "en_proceso", label: "En Proceso" },
  { value: "entregado", label: "Entregado" },
  { value: "en_seguimiento", label: "En Seguimiento" },
];

export const OPTIONS_PROJECT_TYPE: { value: ProjectType; label: string }[] =
  [
    { value: "actualizacion", label: "Actualización" },
    { value: "proyecto_nuevo", label: "Proyecto Nuevo" },
  ];

export const OPTIONS_FREQUENCY: { value: FrequencyType; label: string }[] = [
  { value: "diaria", label: "Diaria" },
  { value: "semanal", label: "Semanal" },
  { value: "mensual", label: "Mensual" },
];

// ===== TIPOS PARA COMPATIBILIDAD CON PÁGINA POST-Lanzamiento =====
// Estos tipos ya no se usan en la nueva estructura pero se mantienen para compatibilidad

export interface Mejora {
  id: string;
  proyecto_id: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  prioridad: string;
  estado: string;
  fecha_creacion?: string;
}

export interface CreateMejoraInput {
  proyecto_id: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  prioridad: string;
  estado: string;
}

export const opcionesTipoMejora = [
  { value: "mejora_rendimiento", label: "Mejora de Rendimiento" },
  { value: "mejora_usabilidad", label: "Mejora de Usabilidad" },
  { value: "nueva_funcionalidad", label: "Nueva Funcionalidad" },
  { value: "correccion_error", label: "Corrección de Error" },
  { value: "optimizacion", label: "Optimización" },
  { value: "otro", label: "Otro" },
];

export const opcionesPrioridad = [
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
];

export const opcionesEstadoMejora = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_progreso", label: "En Proceso" },
  { value: "completado", label: "Completado" },
  { value: "cancelado", label: "Cancelado" },
];
