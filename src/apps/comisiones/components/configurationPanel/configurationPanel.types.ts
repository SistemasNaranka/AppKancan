// Tipos de las filas editables del panel de configuración de comisiones.

export interface RoleConfigRow {
  id: string;
  role: string;
  calculation_type: "Fijo" | "Distributivo";
  percentage: string;
}

export interface ThresholdRow {
  id: string;
  min_compliance: string;
  pct_commission: string;
  name: string;
  color: string;
}
