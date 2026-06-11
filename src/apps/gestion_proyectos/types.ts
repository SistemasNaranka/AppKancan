export type ProjectStatus = "en_proceso" | "entregado" | "en_seguimiento";

export type ProjectType = "actualizacion" | "proyecto_nuevo";

export type FrequencyType = "diaria" | "semanal" | "mensual";

export interface Assignee {
  name: string;
  id?: number;
}

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

export interface Benefit {
  id: string;
  project_id: string;
  description: string;
}

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
  processes?: Process[];
  benefits?: Benefit[];
  feedbacks?: Feedback[];
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

export interface CreateBenefitInput {
  project_id: string;
  description: string;
}

export interface Feedback {
  id: string;
  project_id: string;
  author: string;
  description: string;
  date_created?: string;
}

export interface CreateFeedbackInput {
  project_id: string;
  author: string;
  description: string;
}

export interface ProcessMetrics {
  savings_per_execution: number; 
  daily_savings: number; 
  weekly_savings: number; 
  monthly_savings: number; 
  yearly_savings: number; 
}

export interface ProjectMetrics {
  total_processes: number;
  total_monthly_savings: number; 
  total_yearly_savings: number; 
  processes_metrics: ProcessMetrics[];
}

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
