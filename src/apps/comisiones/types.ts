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
  documento: number;
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
  documento: number;
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
  thresholdConfig: CommissionThresholdConfig | null; // Configuración actual de umbrales
}

// Interfaces para Directus
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

export interface DirectusStoreDailyBudget {
  id: number;
  store_id: number;
  budget: number;
  date: string;
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
  month: string;
  year: string;
  role_config: Array<{
    role: string;
    calculation_type: "Fixed" | "Distributive";
    percentage: number;
  }>;
}

export interface DirectusStaffDailyBudget {
  id: number;
  advisor_id: number;
  store_id: number;
  position_id: number;
  date: string;
  budget: number;
}

export interface DirectusVentasDiariasEmpleado {
  id: number;
  date: string;
  advisor_id: number;
  store_id: number;
  sale: number;
}

export interface DirectusVentasDiariasTienda {
  id: number;
  tienda_id: number | DirectusTienda;
  ventas_totales: number;
  fecha: string;
}

// ==================== CONFIGURACIÓN DE UMBRALES DE COMISIONES ====================

/**
 * Un umbral individual de comisión
 * Solo necesita min_compliance, ya que el max es implícito (min del siguiente umbral)
 */
export interface CommissionThreshold {
  min_compliance: number; // Porcentaje mínimo de cumplimiento (95, 100, 110...)
  pct_commission: number; // Porcentaje de comisión en formato decimal (0.0035 = 0.35%)
  name: string; // Etiqueta para mostrar en UI
  color?: string; // Color hexadecimal o nombre de color
}

/**
 * Configuración de umbrales de comisión por mes
 */
export interface CommissionThresholdConfig {
  mes: string; // "MMM YYYY"
  anio: string; // "YYYY"
  compliance_values: CommissionThreshold[]; // Array de umbrales ordenados por min_compliance ascendente
}

/**
 * Respuesta de Directus para cumplimiento_mensual_comisiones
 */
export interface DirectusCommissionCompliance {
  id: number;
  month: string; // "01"-"12"
  year: string; // "YYYY"
  compliance_values: CommissionThreshold[]; // JSON array
}
