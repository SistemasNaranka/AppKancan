// Estados del proyecto
export type EstadoProyecto = "en_proceso" | "entregado" | "en_seguimiento";

// Tipo de proyecto
export type TipoProyecto = "mejora" | "nuevo";

// Tipo de frecuencia
export type FrecuenciaTipo = "diaria" | "semanal" | "mensual";

// Encargado (estructura como en Directus)
export interface Encargado {
  nombre: string;
}

// Proceso (paso) del proyecto
export interface Proceso {
  id: string;
  proyecto_id: string;
  nombre: string;
  tiempo_antes: number;
  tiempo_despues: number;
  frecuencia_tipo: FrecuenciaTipo;
  frecuencia_cantidad: number;
  dias_semana: number;
  orden: number;
}

// Beneficio del proyecto
export interface Beneficio {
  id: string;
  proyecto_id: string;
  descripcion: string;
}

// Proyecto principal
export interface Proyecto {
  id: string;
  nombre: string;
  area_beneficiada: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_estimada: string;
  fecha_entrega: string | null;
  estado: EstadoProyecto;
  tipo_proyecto: TipoProyecto;
  encargados: Encargado[];
  creado_por?: string;
  fecha_creacion?: string;
  // Campos relacionados (opcionales, se cargan por separado)
  procesos?: Proceso[];
  beneficios?: Beneficio[];
  // Alias para compatibilidad con PostLanzamiento (mapeado desde beneficios)
  mejoras?: Array<{
    id: string;
    proyecto_id: string;
    titulo: string;
    descripcion: string;
    tipo: string;
    prioridad: string;
    estado: string;
  }>;
}

// Datos para crear un proyecto (sin id ni campos automáticos)
export interface CreateProyectoInput {
  nombre: string;
  area_beneficiada: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_estimada: string;
  fecha_entrega: string | null;
  estado: EstadoProyecto;
  tipo_proyecto: TipoProyecto;
  encargados: Encargado[];
}

// Datos para crear un proceso
export interface CreateProcesoInput {
  proyecto_id: string;
  nombre: string;
  tiempo_antes: number;
  tiempo_despues: number;
  frecuencia_tipo: FrecuenciaTipo;
  frecuencia_cantidad: number;
  dias_semana: number;
  orden: number;
}

// Datos para crear un beneficio
export interface CreateBeneficioInput {
  proyecto_id: string;
  descripcion: string;
}

// Métricas calculadas de un proceso
export interface MetricasProceso {
  ahorro_por_ejecucion: number; // segundos
  ahorro_diario: number; // segundos
  ahorro_semanal: number; // segundos
  ahorro_mensual: number; // segundos
  ahorro_anual: number; // segundos
}

// Resumen de métricas de un proyecto
export interface MetricasProyecto {
  total_procesos: number;
  ahorro_total_mensual: number; // segundos
  ahorro_total_anual: number; // segundos
  procesos: MetricasProceso[];
}

// Opciones para selectores
export const OPCIONES_ESTADO: { value: EstadoProyecto; label: string }[] = [
  { value: "en_proceso", label: "En Proceso" },
  { value: "entregado", label: "Entregado" },
  { value: "en_seguimiento", label: "En Seguimiento" },
];

export const OPCIONES_TIPO_PROYECTO: { value: TipoProyecto; label: string }[] =
  [
    { value: "mejora", label: "Mejora" },
    { value: "nuevo", label: "Nuevo" },
  ];

export const OPCIONES_FRECUENCIA: { value: FrecuenciaTipo; label: string }[] = [
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
  { value: "en_progreso", label: "En Progreso" },
  { value: "completado", label: "Completado" },
  { value: "cancelado", label: "Cancelado" },
];
