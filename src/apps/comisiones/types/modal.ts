export interface DirectusStaff {
  id: number;
  name?: string;
  document: number;
  store_id: number | DirectusTienda;
  position_id: number | DirectusPosition;
}

export interface DirectusPosition {
  id: number;
  name: string;
}

export interface DirectusTienda {
  id: number;
  name: string;
  ultra_code: number;
  company: string;
}

export interface EmpleadoAsignado {
  asesor: DirectusStaff;
  presupuesto: number;
  tiendaId: number;
  cargoAsignado: string;
}

export interface CodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssignmentComplete?: (ventasData: any[]) => void;
  selectedMonth?: string;
}

export const ROLES_EXCLUSIVOS = ["gerente", "coadministrador"] as const;
export type RolExclusivo = (typeof ROLES_EXCLUSIVOS)[number];

export const ROLES_REQUERIDOS = ["gerente", "coadministrador"] as const;
export type RolRequerido = (typeof ROLES_REQUERIDOS)[number];
