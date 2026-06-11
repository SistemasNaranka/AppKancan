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

// ── Colección: adm_extensions ─────────────────────────────────────────────

export interface Prorroga {
  id: number;
  contract_id: number;
  extension_number: number;
  label: string;
  description: string;
  start_date: Date | string;
  end_date: Date | string;
  duration: number;
  date_created?: string;
  date_updated?: string;
}

export type CreateProrroga = Omit<Prorroga, 'id' | 'date_created' | 'date_updated'>;
export type UpdateProrroga = Partial<
  Omit<Prorroga, 'id' | 'contract_id' | 'date_created' | 'date_updated'>
>;

// ── Colección: adm_contracts ──────────────────────────────────────────────

export interface Contrato {
  id: number;
  contract_id?: string;
  numero_contrato?: string;
  empleado_id?: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  second_last_name?: string;
  position: string | number;
  contract_type?: string;
  department?: string;
  empleado_area?: string;
  empresa?: string;
  status: RequestStatus;
  extensions?: Prorroga[];
  date_created?: string;
  document: string;
  prorroga?: boolean | string;
  duracion?: string | number;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
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
  status?: RequestStatus[];
  department?: string;
  contract_type?: string;
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

// ── Historial de Cargos — adm_position_history ────────────────────────────

export interface HistorialCargo {
  id: number;
  contract_id: number;
  previous_position: string | number;
  new_position: string | number;
  effective_date: string; // YYYY-MM-DD
  date_created?: string;
}

export type CreateHistorialCargo = Omit<HistorialCargo, 'id' | 'date_created'>;
