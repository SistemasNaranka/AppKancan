export interface RegistrosAsistencia {
  inicioJornada: string | null;
  inicioAlmuerzo: string | null;
  finAlmuerzo: string | null;
  finJornada: string | null;
  observaciones: Record<string, string>;
  ids?: Record<string, number>;
  horasOriginales?: Record<string, string | null>;
  horasEditadas?: Record<string, string | null>;
}

export interface EmpleadoAsistencia {
  id: string;
  documento: string;
  nombre: string;
  cargo?: string;
  estadoActual: string;
  registros: RegistrosAsistencia;
}

export interface TipoNovedad {
  id: number | string;
  nombre: string;
  name: string;
}

export interface NovedadMapeada {
  id: number | string;
  fecha: string;
  empleadoNombre: string;
  tipo: string;
  observaciones: string;
}
export interface HistorialRow {
  fecha: string;
  empleado: string;
  inicio_turno: string | null;
  inicio_almuerzo: string | null;
  fin_almuerzo: string | null;
  fin_turno: string | null;
  observaciones: string | null;
}