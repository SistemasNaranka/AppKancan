// ─────────────────────────────────────────────────────────────────────────────
// TYPES — Gestión de Contratos
// Tipos compatibles con la estructura real de la base de datos
// ─────────────────────────────────────────────────────────────────────────────

// ── Enums ─────────────────────────────────────────────────────────────────

/** Estado visual del contrato basado en días restantes */
export type ContractStatus = "vigente" | "proximo" | "vencido";

/** Tipo de contrato */
export type TipoContrato = string;

/** Valor de la pestaña activa en la UI */
export type TabValue = "resumen" | "todos";

// ── Colección: contratos ──────────────────────────────────────────────────

/** Registro principal de un contrato en Directus */
export interface Contrato {
  id: number;
  date_created?: string;
  documento: string;
  nombre: string;
  apellido: string;
  cargo: string;
  tipo_contrato: TipoContrato;
  prorroga: boolean | string;
  duracion: string | number;
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

/** Conteos para las tarjetas del dashboard */
export interface ContratoStats {
  total: number;
  vigentes: number;
  proximos: number;
  vencidos: number;
}

// ── Filtros ───────────────────────────────────────────────────────────────

/** Filtros para la query a Directus */
export interface ContratoFilters {
  /** Búsqueda libre por nombre, apellido, cargo */
  search?: string;
  /** Tipo de contrato */
  tipo_contrato?: string;
  /** Cargo */
  cargo?: string;
}

/** Filtros activos en la UI (tab + orden + búsqueda) */
export interface UIFilters {
  search: string;
  tab: TabValue;
  sortBy: "vencimiento" | "nombre" | "fecha_ingreso";
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
