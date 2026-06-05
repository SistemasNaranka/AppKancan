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
}

export interface EmpleadoAsistencia {
  id: string;
  nombre: string;
  estadoActual: EstadoAsistencia;
  registros: RegistrosEmpleado;
}