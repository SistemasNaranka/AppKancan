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

export const requestStatusMap: Record<RequestStatus, {
  [x: string]: any; label: string; color: string; bg: string; border: string 
}> = {
  pendiente: { label: 'Pendiente', color: '#b45309', bg: '#fef3c7', border: '#fde047' },
  en_revision: { label: 'En Revisión', color: '#1d4ed8', bg: '#dbeafe', border: '#93c5fd' },
  aprobada: { label: 'Aprobada', color: '#15803d', bg: '#dcfce7', border: '#86efac' },
  rechazada: { label: 'Rechazada', color: '#b91c1c', bg: '#fef2f2', border: '#fca5a5' },
  completada: { label: 'Completada', color: '#7c3aed', bg: '#ede9fe', border: '#c4b5fd' },
};

export type TabValue = 'resumen' | 'contratos' | 'empleados' | 'prorrogas' | RequestStatus | 'activos' | 'vencidos' | 'por_vencer' | 'criticos';

// ── Colección: prorrogas ──────────────────────────────────────────────────

export interface Prorroga {
  id: number;
  contrato: number;
  numero: number;
  label: string;
  descripcion: string;
  fecha_ingreso: Date | string;
  fecha_final: Date | string; 
  duracion: number;
  date_created?: string;
  date_updated?: string;
}

export type CreateProrroga = Omit<Prorroga, 'id' | 'date_created' | 'date_updated'>;
export type UpdateProrroga = Partial<
  Omit<Prorroga, 'id' | 'contrato' | 'date_created' | 'date_updated'>
>;

// ── Colección: documentos ─────────────────────────────────────────────────

export interface Documento {
  id: number;
  contrato: number;
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
  cargo: string | number;
  tipo_contrato?: string;
  area?:string;
  empresa?: string;
  request_status: RequestStatus;
  prorrogas?: Prorroga[];
  documentos?: Documento[];
  date_created?: string;
  documento: string;
  apellido: string;
  prorroga?: boolean | string;
  duracion?: string | number;
  fecha_ingreso: string; // YYYY-MM-DD
  fecha_final: string; // YYYY-MM-DD
  date_updated?: string;
}

export type CreateContrato = Omit<
  Contrato,
  "id" | "date_created" | "date_updated"
>;
export type UpdateContrato = Partial<CreateContrato>;

// ── Estadísticas ──────────────────────────────────────────────────────────

export interface ContratoStats {
  total: number;
  vigentes: number;
  proximos: number;
  vencidos: number;
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
  tipo_contrato?: string;
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
  order?: "asc" | "desc";
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
