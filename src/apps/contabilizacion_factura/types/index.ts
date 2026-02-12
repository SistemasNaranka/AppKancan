/**
 * Tipos e interfaces para el módulo de Contabilización de Facturas
 */

// Ejemplo: Tipo para una factura
export interface Factura {
    id: string;
    numero_factura: string;
    fecha_emision: string;
    fecha_vencimiento: string;
    cliente: string;
    subtotal: number;
    impuestos: number;
    total: number;
    estado: EstadoFactura;
    observaciones?: string;
    fecha_creacion?: string;
    fecha_actualizacion?: string;
}

// Estados posibles de una factura
export enum EstadoFactura {
    PENDIENTE = "pendiente",
    PAGADA = "pagada",
    VENCIDA = "vencida",
    CANCELADA = "cancelada",
}

// Ejemplo: Tipo para filtros de búsqueda
export interface FacturaFilters {
    estado?: EstadoFactura;
    fecha_desde?: string;
    fecha_hasta?: string;
    cliente?: string;
}

// Ejemplo: Tipo para el estado del módulo
export interface ContabilizacionState {
    facturas: Factura[];
    isLoading: boolean;
    error: string | null;
    filters: FacturaFilters;
}
