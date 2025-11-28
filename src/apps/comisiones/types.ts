/**
 * Tipos TypeScript para la Calculadora de Comisiones por Cumplimiento
 */

export type Role = "gerente" | "asesor" | "cajero";

export interface BudgetRecord {
  tienda: string;
  fecha: string; // YYYY-MM-DD
  presupuesto_total: number;
  presupuesto_gerente?: number;
  presupuesto_asesores?: number;
}

export interface StaffMember {
  id: string;
  nombre: string;
  tienda: string;
  fecha: string; // YYYY-MM-DD
  rol: Role;
}

export interface MonthConfig {
  mes: string; // "MMM YYYY"
  porcentaje_gerente: number; // 0-10
}

export interface VentasData {
  tienda: string;
  fecha: string; // YYYY-MM-DD
  ventas_tienda: number;
  ventas_por_asesor: Record<string, number>; // id_asesor -> ventas
}

export interface VentasMensualesData {
  tienda: string;
  mes: string; // "MMM YYYY"
  ventas_tienda_mensual: number;
  ventas_por_asesor_mensual: Record<string, number>; // id_asesor -> ventas mensuales
}

export interface EmployeeCommission {
  id: string;
  nombre: string;
  rol: Role;
  tienda: string;
  fecha: string;
  presupuesto: number;
  ventas: number;
  cumplimiento_pct: number;
  comision_pct: number;
  comision_monto: number;
}

export interface TiendaResumen {
  tienda: string;
  fecha: string;
  presupuesto_tienda: number;
  ventas_tienda: number;
  cumplimiento_tienda_pct: number;
  empleados: EmployeeCommission[];
  total_comisiones: number;
}

export interface MesResumen {
  mes: string;
  tiendas: TiendaResumen[];
  total_comisiones: number;
  comisiones_por_rol: Record<Role, number>;
}

export interface AppState {
  budgets: BudgetRecord[];
  staff: StaffMember[];
  monthConfigs: MonthConfig[];
  ventas: VentasData[];
  ventasMensuales: VentasMensualesData[];
}

// Interfaces para Directus
export interface DirectusAsesor {
  id: number;
  nombre?: string;
  codigo_asesor: number;
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

export interface DirectusPresupuestoDiarioTienda {
  id: number;
  tienda_id: number | DirectusTienda;
  presupuesto: number;
  fecha: string;
}

export interface DirectusPorcentajeMensual {
  id: number;
  fecha: string;
  porcentaje_gerente: number;
  porcentaje_asesor: number;
  porcentaje_cajero: number;
  porcentaje_logistico: number;
  tienda_id: number | DirectusTienda;
}

export interface DirectusPresupuestoDiarioEmpleado {
  id: number;
  asesor_id: number | DirectusAsesor;
  fecha: string;
  presupuesto: number;
  tienda_id: number | DirectusTienda;
}

export interface DirectusVentasDiariasEmpleado {
  id: number;
  ventas: number;
  asesor_id: number | DirectusAsesor;
  fecha: string;
}

export interface DirectusVentasDiariasTienda {
  id: number;
  tienda_id: number | DirectusTienda;
  ventas_totales: number;
  fecha: string;
}
