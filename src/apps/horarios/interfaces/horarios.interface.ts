export type EstadoAsistencia =
  | 'entrada_pendiente'
  | 'jornada_iniciada'
  | 'en_almuerzo'
  | 'regreso_almuerzo'
  | 'jornada_finalizada';

export interface RegistrosEmpleado {
  inicioJornada?: string;
  inicioAlmuerzo?: string;
  finAlmuerzo?: string;
  finJornada?: string;
  observaciones?: {
    inicioJornada?: string;
    inicioAlmuerzo?: string;
    finAlmuerzo?: string;
    finJornada?: string;
  };
}

export interface EmpleadoAsistencia {
  id: string;
  nombre: string;
  documento?: string;
  estadoActual: EstadoAsistencia;
  registros: RegistrosEmpleado;
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

export interface Novedad {
  id: string;
  empleadoId: string;
  empleadoNombre: string;
  empleadoDocumento?: string;
  tipo: string;
  fecha: string;
  description?: string;
  notes?: string;
  fechaRegistro: string;
}