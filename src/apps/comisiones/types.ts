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
