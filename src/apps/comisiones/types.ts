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
  fecha: string;
  presupuesto_total: number;
  presupuesto_gerente?: number;
  presupuesto_asesores?: number;
}

export interface StaffMember {
  id: string;
  nombre: string;
  documento: number;
  tienda: string;
  fecha: string;
  rol: Role;
}

export interface MonthConfig {
  mes: string;
  porcentaje_gerente: number;
}

export interface VentasData {
  tienda: string;
  fecha: string;
  ventas_tienda: number;
  ventas_por_asesor: Record<string, number>;
}

export interface VentasMensualesData {
  tienda: string;
  mes: string;
  ventas_tienda_mensual: number;
  ventas_por_asesor_mensual: Record<string, number>;
}

export interface EmployeeCommission {
  id: string;
  nombre: string;
  documento: number;
  rol: Role;
  cargo_id?: number;
  tienda: string;
  fecha: string;
  presupuesto: number;
  ventas: number;
  cumplimiento_pct: number;
  comision_pct: number;
  comision_monto: number;
  proxima_comision: number | string;
  proximo_presupuesto?: number;
  proxima_venta?: number;
  proximo_monto_comision?: number;
  dias_laborados: number;
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
  thresholdConfig: CommissionThresholdConfig | null;
}

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
  fecha: string;
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

export interface CommissionThreshold {
  min_compliance: number;
  pct_commission: number;
  name: string;
  color?: string;
}

export interface CommissionThresholdConfig {
  mes: string;
  anio: string;
  compliance_values: CommissionThreshold[];
}

export interface DirectusCommissionCompliance {
  id: number;
  month: string;
  year: string;
  compliance_values: CommissionThreshold[];
}
