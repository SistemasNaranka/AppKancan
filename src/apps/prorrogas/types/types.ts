// ─────────────────────────────────────────────────────────────────────────────
// TYPES — Gestión de Prórrogas
// Tipos compatibles con Directus SDK (snake_case en campos de colección)
// ─────────────────────────────────────────────────────────────────────────────

// ── Enums ─────────────────────────────────────────────────────────────────

/** Estado visual del contrato basado en días restantes */
export type ContractStatus = 'vigente' | 'proximo' | 'vencido';

/** Estado de la solicitud de prórroga */
export type RequestStatus =
  | 'pendiente'
  | 'en_revision'
  | 'aprobada'
  | 'rechazada'
  | 'completada';

/** Valor de la pestaña activa en la UI */
export type TabValue = 'resumen' | RequestStatus;

// ── Colección: prorrogas ──────────────────────────────────────────────────

/** Registro de una prórroga en Directus */
export interface Prorroga {
  id: number;
  contrato_id: number;
  numero: number;         // 0 = Contrato Inicial · 1-3 = 4 meses · ≥4 = 12 meses
  label: string;
  descripcion: string;
  fecha_inicio: string;   // YYYY-MM-DD
  fecha_fin: string;      // YYYY-MM-DD
  duracion_meses: number; // calculado por la API según regla de negocio
  date_created?: string;
  date_updated?: string;
}

export type CreateProrroga = Omit<Prorroga, 'id' | 'date_created' | 'date_updated'>;
export type UpdateProrroga = Partial<
  Omit<Prorroga, 'id' | 'contrato_id' | 'date_created' | 'date_updated'>
>;

// ── Colección: documentos ─────────────────────────────────────────────────

/** Documento adjunto a un contrato */
export interface Documento {
  id: number;
  contrato_id: number;
  nombre: string;
  tipo: 'contrato' | 'evaluacion' | 'otrosi' | 'otro';
  fecha: string;          // YYYY-MM-DD
  firmado: boolean;
  date_created?: string;
}

export type CreateDocumento = Omit<Documento, 'id' | 'date_created'>;

// ── Colección: contratos ──────────────────────────────────────────────────

/** Registro principal de un contrato en Directus */
export interface Contrato {
  id: number;
  empleado_nombre: string;
  empleado_cargo: string;
  empleado_departamento: string;
  request_status: RequestStatus;
  /** Relación 1-M: prórrogas del contrato */
  prorrogas: Prorroga[];
  /** Relación 1-M: documentos del contrato */
  documentos: Documento[];
  date_created?: string;
  date_updated?: string;
}

export type CreateContrato = Omit<
  Contrato,
  'id' | 'prorrogas' | 'documentos' | 'date_created' | 'date_updated'
>;

export type UpdateContrato = Partial<CreateContrato>;

// ── Estadísticas ──────────────────────────────────────────────────────────

/** Conteos por estado para las tarjetas del dashboard */
export interface ContratoStats {
  total: number;
  pendiente: number;
  en_revision: number;
  aprobada: number;
  rechazada: number;
  completada: number;
}

// ── Filtros ───────────────────────────────────────────────────────────────

/** Filtros para la query a Directus */
export interface ContratoFilters {
  /** Búsqueda libre por nombre, cargo, departamento */
  search?: string;
  /** Uno o más estados de solicitud */
  request_status?: RequestStatus[];
  /** Departamento exacto */
  departamento?: string;
}

/** Filtros activos en la UI (tab + orden + búsqueda) */
export interface UIFilters {
  search: string;
  tab: TabValue;
  sortBy: 'vencimiento' | 'nombre' | 'prorroga';
}

// ── Paginación ────────────────────────────────────────────────────────────

export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ── Payload del formulario ────────────────────────────────────────────────

/** Lo que emite ProrrogaForm. La API calcula fecha_fin y duracion_meses. */
export interface CreateProrrogaPayload {
  contractId: number;
  fechaInicio: string;    // YYYY-MM-DD
  descripcion?: string;
}