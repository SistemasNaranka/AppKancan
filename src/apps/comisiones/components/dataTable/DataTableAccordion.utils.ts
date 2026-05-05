import { grey, green, blue, orange, pink, red } from "@mui/material/colors";
import { Role, CommissionThreshold } from "../../types";

// --- TIPOS Y ESTADOS INICIALES ---
export type Order = "asc" | "desc";
export type SortField =
  | "nombre" | "rol" | "dias_laborados" | "presupuesto" | "ventasActuales"
  | "cumplimiento_pct" | "comision_pct" | "comision_monto" | "proxima_comision"
  | "proxima_venta" | "proximo_monto_comision";

export interface SortState {
  field: SortField;
  order: Order;
}

export interface EmployeeRow {
  id: string; tiendaName: string; tiendaFecha: string; empleadoId: string;
  nombre: string; rol: Role; presupuesto: number; ventasOriginales: number;
  cumplimiento_pct: number; comision_pct: number; comision_monto: number;
  proxima_comision: number | string; proxima_venta?: number;
  proximo_monto_comision?: number; ventasActuales: number; dias_laborados: number;
}

export const INITIAL_SORT_STATE: SortState = {
  field: "nombre",
  order: "desc",
};

// --- FUNCIONES DE ORDENAMIENTO (TU LÓGICA ORIGINAL) ---
const getSortValue = (employee: any, field: SortField): any => {
  switch (field) {
    case "nombre": return employee.nombre;
    case "rol": return employee.rol;
    case "dias_laborados": return employee.dias_laborados;
    case "presupuesto": return employee.presupuesto;
    case "ventasActuales": return employee.ventas;
    case "cumplimiento_pct": return employee.cumplimiento_pct;
    case "comision_pct": return employee.comision_pct;
    case "comision_monto": return employee.comision_monto;
    case "proxima_comision":
      return employee.proxima_comision === "NN" ? Number.MAX_SAFE_INTEGER : employee.proxima_comision;
    case "proxima_venta": return employee.proxima_venta || 0;
    case "proximo_monto_comision": return employee.proximo_monto_comision || 0;
    default: return "";
  }
};

export const compareValues = (a: any, b: any, field: SortField, order: Order): number => {
  if (field === "nombre") {
    const aHasCommission = a.comision_pct > 0;
    const bHasCommission = b.comision_pct > 0;
    if (aHasCommission && !bHasCommission) return order === "desc" ? -1 : 1;
    if (!aHasCommission && bHasCommission) return order === "desc" ? 1 : -1;
    if (aHasCommission && bHasCommission) {
      if (a.comision_pct !== b.comision_pct) {
        return order === "desc" ? b.comision_pct - a.comision_pct : a.comision_pct - b.comision_pct;
      }
      return order === "desc" ? b.cumplimiento_pct - a.cumplimiento_pct : a.cumplimiento_pct - b.cumplimiento_pct;
    } else {
      return order === "desc" ? b.cumplimiento_pct - a.cumplimiento_pct : a.cumplimiento_pct - b.cumplimiento_pct;
    }
  }
  const valueA = getSortValue(a, field);
  const valueB = getSortValue(b, field);
  if (typeof valueA === "string" && typeof valueB === "string") {
    return order === "desc" ? valueB.localeCompare(valueA, "es", { sensitivity: "base" }) : valueA.localeCompare(valueB, "es", { sensitivity: "base" });
  }
  if (typeof valueA === "number" && typeof valueB === "number") {
    return order === "desc" ? valueB - valueA : valueA - valueB;
  }
  return 0;
};

// --- PROCESAMIENTO Y COLORES (TU LÓGICA ORIGINAL) ---
export const getRowBackgroundColor = (pct: number, thresholdConfig?: CommissionThreshold[]): string => {
  if (!thresholdConfig || thresholdConfig.length === 0) return grey[100];
  const umbralesOrdenados = [...thresholdConfig].sort((a, b) => a.cumplimiento_min - b.cumplimiento_min);
  const pctValue = pct * 100;
  const isWithinThresholds = umbralesOrdenados.some((umbral) => {
    const nextUmbral = umbralesOrdenados[umbralesOrdenados.indexOf(umbral) + 1];
    return pctValue >= umbral.cumplimiento_min && (!nextUmbral || pctValue < nextUmbral.cumplimiento_min);
  });
  if (!isWithinThresholds) return grey[100];
  const backgroundColorMap: Record<string, string> = { red: red[50], pink: pink[50], orange: orange[50], blue: blue[50], green: green[50], purple: "#f3e5f5", yellow: "#fff9c4" };
  for (let i = 0; i < umbralesOrdenados.length; i++) {
    const umbral = umbralesOrdenados[i];
    const nextUmbral = umbralesOrdenados[i + 1];
    if (pctValue >= umbral.cumplimiento_min && (!nextUmbral || pctValue < nextUmbral.cumplimiento_min)) {
      if (umbral.color && backgroundColorMap[umbral.color]) return backgroundColorMap[umbral.color];
      if (umbral.cumplimiento_min >= 85 && umbral.cumplimiento_min < 90) return red[50];
      else if (umbral.cumplimiento_min >= 90 && umbral.cumplimiento_min < 95) return pink[50];
      else if (umbral.cumplimiento_min >= 95 && umbral.cumplimiento_min < 100) return orange[50];
      else if (umbral.cumplimiento_min >= 100 && umbral.cumplimiento_min < 110) return blue[50];
      else return green[50];
    }
  }
  return grey[100];
};

export const getRowHoverColor = (pct: number, thresholdConfig?: CommissionThreshold[]): string => {
  if (!thresholdConfig || thresholdConfig.length === 0) return grey[200];
  const umbralesOrdenados = [...thresholdConfig].sort((a, b) => a.cumplimiento_min - b.cumplimiento_min);
  const pctValue = pct * 100;
  const isWithinThresholds = umbralesOrdenados.some((umbral) => {
    const nextUmbral = umbralesOrdenados[umbralesOrdenados.indexOf(umbral) + 1];
    return pctValue >= umbral.cumplimiento_min && (!nextUmbral || pctValue < nextUmbral.cumplimiento_min);
  });
  if (!isWithinThresholds) return grey[200];
  const hoverColorMap: Record<string, string> = { red: red[100], pink: pink[100], orange: orange[100], blue: blue[100], green: green[100], purple: "#e1bee7", yellow: "#fff59d" };
  for (let i = 0; i < umbralesOrdenados.length; i++) {
    const umbral = umbralesOrdenados[i];
    const nextUmbral = umbralesOrdenados[i + 1];
    if (pctValue >= umbral.cumplimiento_min && (!nextUmbral || pctValue < nextUmbral.cumplimiento_min)) {
      if (umbral.color && hoverColorMap[umbral.color]) return hoverColorMap[umbral.color];
      if (umbral.cumplimiento_min >= 85 && umbral.cumplimiento_min < 90) return red[100];
      else if (umbral.cumplimiento_min >= 90 && umbral.cumplimiento_min < 95) return pink[100];
      else if (umbral.cumplimiento_min >= 95 && umbral.cumplimiento_min < 100) return orange[100];
      else if (umbral.cumplimiento_min >= 100 && umbral.cumplimiento_min < 110) return blue[100];
      else return green[100];
    }
  }
  return grey[200];
};

export const processRowsWithSorting = (employeesData: any[], sortState: SortState, tienda: { tienda: string; fecha: string }) => {
  return [...employeesData]
    .sort((a, b) => compareValues(a, b, sortState.field, sortState.order))
    .map((emp) => ({
      id: `${tienda.tienda}-${tienda.fecha}-${emp.id}`,
      tiendaName: tienda.tienda, tiendaFecha: tienda.fecha, empleadoId: emp.id,
      nombre: emp.nombre, rol: emp.rol, presupuesto: emp.presupuesto,
      ventasOriginales: emp.ventas, cumplimiento_pct: emp.cumplimiento_pct,
      comision_pct: emp.comision_pct, comision_monto: emp.comision_monto,
      proxima_comision: emp.proxima_comision, proxima_venta: emp.proxima_venta,
      proximo_monto_comision: emp.proximo_monto_comision, ventasActuales: emp.ventas,
      dias_laborados: emp.dias_laborados,
    }));
};