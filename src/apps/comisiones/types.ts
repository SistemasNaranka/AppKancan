/**
 * Tipos TypeScript para la Calculadora de Comisiones por Cumplimiento
 */

export type Role =
  | "gerente"
  | "asesor"
  | "cajero"
  | "logistico"
  | "gerente_online"
  | "coadministrador";

export interface BudgetRecord {
  tienda: string;
  tienda_id: number;
  empresa: string;
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
  cargo_id?: number; // ID del cargo para ordenamiento
  tienda: string;
  fecha: string;
  presupuesto: number;
  ventas: number;
  cumplimiento_pct: number;
  comision_pct: number;
  comision_monto: number;
  proxima_comision: number | string; // Próxima comisión (número) o 'NN' si ya está en el máximo
  proximo_presupuesto?: number; // Próximo presupuesto calculado (no se muestra en tabla)
  proxima_venta?: number; // Próxima venta calculada (se muestra en tabla como 'Prox. venta')
  proximo_monto_comision?: number; // Próximo monto de comisión calculado (se muestra en tabla)
  dias_laborados: number; // Días únicos laborados por empleado
}

export interface TiendaResumen {
  tienda: string;
  tienda_id: number;
  empresa: string;
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
  presupuestosEmpleados: any[];
}

// Interfaces para Directus
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

export interface DirectusPresupuestoDiarioTienda {
  id: number;
  tienda_id: number;
  presupuesto: number;
  fecha: string;
}

export interface DirectusPorcentajeMensual {
  id: number;
  fecha: string; // YYYY-MM
  gerente_tipo: "fijo" | "distributivo";
  gerente_porcentaje: number;
  asesor_tipo: "fijo" | "distributivo";
  asesor_porcentaje: number;
  coadministrador_tipo: "fijo" | "distributivo";
  coadministrador_porcentaje: number;
  cajero_tipo: "fijo" | "distributivo";
  cajero_porcentaje: number;
  logistico_tipo: "fijo" | "distributivo";
  logistico_porcentaje: number;
}

export interface DirectusPorcentajeMensualNuevo {
  id: number;
  mes: string;
  anio: string;
  configuracion_roles: Array<{
    rol: string;
    tipo_calculo: "Fijo" | "Distributivo";
    porcentaje: number;
  }>;
}

export interface DirectusPresupuestoDiarioEmpleado {
  id: number;
  asesor: number;
  tienda_id: number;
  cargo: number;
  fecha: string;
  presupuesto: number;
}

export interface DirectusVentasDiariasEmpleado {
  id: number;
  fecha: string;
  asesor_id: number;
  tienda_id: number;
  venta: number;
}

export interface DirectusVentasDiariasTienda {
  id: number;
  tienda_id: number | DirectusTienda;
  ventas_totales: number;
  fecha: string;
}
