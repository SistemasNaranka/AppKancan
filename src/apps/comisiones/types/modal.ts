/**
 * Tipos específicos para el modal de códigos
 */

// Interfaces copiadas para evitar problemas de importación
export interface DirectusAsesor {
  id: number;
  nombre?: string;
  documento: number;
  tienda_id: number | DirectusTienda;
  cargo_id: number | DirectusCargo;
}

export interface DirectusCargo {
  id: number;
  nombre: string;
}

export interface DirectusTienda {
  id: number;
  nombre: string;
  codigo_ultra: number;
  empresa: string;
}

export interface EmpleadoAsignado {
  asesor: DirectusAsesor;
  presupuesto: number;
  tiendaId: number;
  cargoAsignado: string;
}

export interface CodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssignmentComplete?: (ventasData: any[]) => void;
  selectedMonth?: string; // Mes seleccionado en formato "MMM YYYY"
}

// Roles que solo pueden tener un empleado cada uno
export const ROLES_EXCLUSIVOS = ["gerente", "coadministrador"] as const;
export type RolExclusivo = (typeof ROLES_EXCLUSIVOS)[number];

// Roles requeridos para poder guardar
export const ROLES_REQUERIDOS = ["gerente", "coadministrador"] as const;
export type RolRequerido = (typeof ROLES_REQUERIDOS)[number];
