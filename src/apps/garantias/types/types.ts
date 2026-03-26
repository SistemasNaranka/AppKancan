// ─────────────────────────────────────────────────────────────────────────────
// Tipos para la app de Garantías
// Tablas en Directus: "garantias" y "clientes"
// ─────────────────────────────────────────────────────────────────────────────

// ── Estado posibles de una garantía ──────────────────────────────────────────
export type EstadoGarantia =
  | "pendiente"
  | "en_revision"
  | "aprobada"
  | "rechazada"
  | "completada";

// ── Tipo de garantía ──────────────────────────────────────────────────────────
export type TipoGarantia = "fabricante" | "comercial" | "extendida" | "defecto_fabrica" | "otro";

// ── Opciones para formularios ─────────────────────────────────────────────
export const TIPO_GARANTIA_OPTIONS: { value: TipoGarantia; label: string }[] = [
  { value: "fabricante", label: "Garantía de Fabricante" },
  { value: "comercial", label: "Garantía Comercial" },
  { value: "extendida", label: "Garantía Extendida" },
  { value: "defecto_fabrica", label: "Defecto de Fábrica" },
  { value: "otro", label: "Otro" },
];

export const GARANTIA_STATUS_OPTIONS: { value: EstadoGarantia; label: string }[] = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_revision", label: "En Revisión" },
  { value: "aprobada", label: "Aprobada" },
  { value: "rechazada", label: "Rechazada" },
  { value: "completada", label: "Completada" },
];

// ── Funciones helper para obtener labels ──────────────────────────────────────
/** Obtiene el label对应的状态 */
export function getStatusLabel(estado: EstadoGarantia): string {
  const option = GARANTIA_STATUS_OPTIONS.find((opt) => opt.value === estado);
  return option?.label ?? estado;
}

/** Obtiene el label对应的类型 */
export function getTipoLabel(tipo: TipoGarantia): string {
  const option = TIPO_GARANTIA_OPTIONS.find((opt) => opt.value === tipo);
  return option?.label ?? tipo;
}

// Alias para compatibilidad con código legacy
export type DirectusGarantia = Garantia;

// ─────────────────────────────────────────────────────────────────────────────
// CLIENTE — tabla "clientes"
// ─────────────────────────────────────────────────────────────────────────────
export interface Cliente {
  id: number;
  nombre: string;
  documento: string;
  telefono: string;
  email?: string;
  direccion?: string;
  date_created?: string;
  date_updated?: string;
}

export type CreateCliente = Omit<Cliente, "id" | "date_created" | "date_updated">;
export type UpdateCliente = Partial<CreateCliente>;

// ─────────────────────────────────────────────────────────────────────────────
// GARANTÍA — tabla "garantias"
// ─────────────────────────────────────────────────────────────────────────────
export interface Garantia {
  id: number;

  // Relación con tabla clientes (puede venir expandida o solo el id)
  // Opcional en creación ya que los datos del cliente se envían embebidos
  cliente_id?: number | Cliente;

  // Campos del cliente aplanados (los usamos en el formulario para no
  // obligar a crear el cliente primero — se crea junto con la garantía)
  cliente_nombre: string;
  cliente_documento: string;
  cliente_telefono: string;
  cliente_email?: string;
  cliente_direccion?: string;

  // Producto
  producto_nombre: string;
  producto_referencia: string;
  producto_sku?: string;
  producto_tienda_id?: number;
  producto_tienda_nombre?: string;

  // Factura / compra
  numero_factura?: string;
  fecha_compra?: string;
  valor_compra?: number;

  // Garantía
  tipo_garantia: TipoGarantia;
  descripcion_problema: string;
  fecha_solicitud: string;
  fecha_vence_garantia?: string;
  estado: EstadoGarantia;

  // Gestión interna
  nota_interna?: string;
  resolucion?: string;
  fecha_resolucion?: string;

  // Metadatos Directus
  date_created?: string;
  date_updated?: string;
  user_created?: string;
  user_updated?: string;
}

export type CreateGarantia = Omit<
  Garantia,
  "id" | "date_created" | "date_updated" | "user_created" | "user_updated"
>;

export type UpdateGarantia = Partial<CreateGarantia>;

// ─────────────────────────────────────────────────────────────────────────────
// STATS — respuesta de useGarantiaStats
// ─────────────────────────────────────────────────────────────────────────────
export interface GarantiaStats {
  total: number;
  pendiente: number;
  en_revision: number;
  aprobada: number;
  rechazada: number;
  completada: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTROS y PAGINACIÓN
// ─────────────────────────────────────────────────────────────────────────────
export interface GarantiaFilters {
  estado?: EstadoGarantia[];
  tipo_garantia?: TipoGarantia[];
  fecha_inicio?: string;
  fecha_fin?: string;
  search?: string;
  tienda_id?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: "asc" | "desc";
}

// Respuesta paginada genérica
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}