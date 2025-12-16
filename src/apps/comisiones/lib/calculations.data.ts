/**
 * Funciones de obtención y filtrado de datos para comisiones
 */

import { BudgetRecord, VentasData } from "../types";
import { getMonthYear, monthToTimestamp } from "./calculations.basic";

/**
 * Obtiene ventas para un empleado específico
 */
export const getEmployeeVentas = (
  ventasData: VentasData[],
  tienda: string,
  fecha: string,
  empleadoId: string
): number => {
  if (!Array.isArray(ventasData)) {
    return 0;
  }
  const venta = ventasData.find(
    (v) => v.tienda === tienda && v.fecha === fecha
  );
  if (!venta) return 0;
  return venta.ventas_por_asesor[empleadoId] || 0;
};

/**
 * Obtiene ventas totales de una tienda
 */
export const getTiendaVentas = (
  ventasData: VentasData[],
  tienda: string,
  fecha: string
): number => {
  if (!Array.isArray(ventasData)) {
    return 0;
  }
  const venta = ventasData.find(
    (v) => v.tienda === tienda && v.fecha === fecha
  );
  return venta?.ventas_tienda || 0;
};

/**
 * Obtiene todos los meses únicos disponibles en los datos ordenados cronológicamente
 */
export const getAvailableMonths = (budgets: BudgetRecord[]): string[] => {
  const months = new Set<string>();
  budgets.forEach((b) => {
    months.add(getMonthYear(b.fecha));
  });
  return Array.from(months).sort(
    (a, b) => monthToTimestamp(a) - monthToTimestamp(b)
  );
};
