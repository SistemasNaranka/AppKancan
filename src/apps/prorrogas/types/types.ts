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

export type TabValue = 'resumen' | 'contracts' | 'empleados' | 'prorrogas' | RequestStatus | 'activos' | 'vencidos' | 'por_vencer' | 'criticos';


export interface Extension {
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

export type CreateExtension = Omit<Extension, 'id' | 'date_created' | 'date_updated'>;
export type UpdateExtension = Partial<
  Omit<Extension, 'id' | 'contract_id' | 'date_created' | 'date_updated'>
>;


export interface Contract {
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
  extensions?: Extension[];
  date_created?: string;
  document: string;
  prorroga?: boolean | string;
  duracion?: string | number;
  start_date: string;
  end_date: string;
  date_updated?: string;
}

export type CreateContract = Omit<
  Contract,
  "id" | "date_created" | "date_updated"
>;
export type UpdateContract = Partial<CreateContract>;

export interface ContractStats {
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


export interface ContractFilters {
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

export interface CreateExtensionPayload {
  contractId: number;
  fechaInicio: string;
  descripcion?: string;
}

export interface Employee {
  id: number;
  nombre: string;
  cargo: string;
  area: string;
  foto?: string;
  empresa?: string;
}

export interface PositionHistory {
  id: number;
  contract_id: number;
  previous_position: string | number;
  new_position: string | number;
  effective_date: string;
  date_created?: string;
}

export type CreatePositionHistory = Omit<PositionHistory, 'id' | 'date_created'>;
