// ─────────────────────────────────────────────────────────────────────────────
// TYPES — Gestión de Prórrogas
// ─────────────────────────────────────────────────────────────────────────────

export type ContractStatus = 'vigente' | 'proximo' | 'vencido';

export type RequestStatus =
  | 'pendiente'
  | 'en_revision'
  | 'aprobada'
  | 'rechazada'
  | 'completada';

export type TabValue = 'resumen' | 'contratos' | 'empleados' | 'prorrogas' | RequestStatus;

// ── Colección: prorrogas ──────────────────────────────────────────────────

export interface Prorroga {
  id: number;
  contrato_id: number;
  numero: number;
  label: string;
  descripcion: string;
  fecha_ingreso: string;
  fecha_final: string;
  duracion: number;
  date_created?: string;
  date_updated?: string;
}

export type CreateProrroga = Omit<Prorroga, 'id' | 'date_created' | 'date_updated'>;
export type UpdateProrroga = Partial<
  Omit<Prorroga, 'id' | 'contrato_id' | 'date_created' | 'date_updated'>
>;

// ── Colección: documentos ─────────────────────────────────────────────────

export interface Documento {
  id: number;
  contrato_id: number;
  nombre: string;
  tipo: 'contrato' | 'evaluacion' | 'otrosi' | 'otro';
  fecha: string;
  firmado: boolean;
  date_created?: string;
}

export type CreateDocumento = Omit<Documento, 'id' | 'date_created'>;

// ── Colección: contratos ──────────────────────────────────────────────────

export interface Contrato {
  id: number;
  numero_contrato?: string;
  empleado_id?: number;
  nombre: string;
  cargo: string;
  tipo_contrato?: string;
  /** Fecha de inicio del contrato original */
  fecha_ingreso?: string;
  /** Fecha de vencimiento del contrato (campo directo en BD) */
  fecha_final?: string;
  empleado_area: string;
  empresa?: string;
  request_status: RequestStatus;
  prorrogas: Prorroga[];
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

export interface ContratoStats {
  total: number;
  pendiente: number;
  en_revision: number;
  aprobada: number;
  rechazada: number;
  completada: number;
}

export interface DashboardStats {
  total: number;
  activos: number;
  por_vencer: number;
  criticos: number;
  vencidos: number;
  nuevos_este_mes: number;
}

// ── Filtros ───────────────────────────────────────────────────────────────

export interface ContratoFilters {
  search?: string;
  request_status?: RequestStatus[];
  area?: string;
}

export interface UIFilters {
  search: string;
  tab: TabValue;
  sortBy: 'vencimiento' | 'nombre' | 'prorroga';
  contractStatus?: ContractStatus | 'todos';
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

// ── Payloads ──────────────────────────────────────────────────────────────

export interface CreateProrrogaPayload {
  contractId: number;
  fechaInicio: string;
  descripcion?: string;
}

// ── Empleados ─────────────────────────────────────────────────────────────

export interface Employee {
  id: number;
  nombre: string;
  cargo: string;
  area: string;
  foto?: string;
  empresa?: string;
}