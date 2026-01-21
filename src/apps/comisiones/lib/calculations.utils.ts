/**
 * Funciones de utilidad para cálculos de comisiones
 * Combina:
 * - Funciones básicas de utilidad (anteriormente calculations.basic.ts)
 * - Funciones de obtención y filtrado de datos (anteriormente calculations.data.ts)
 * - Funciones para cálculo de próxima comisión (anteriormente calculations.next-commission.ts)
 */

import { BudgetRecord, VentasData, CommissionThreshold } from "../types";

// ==================== Funciones básicas de utilidad ====================

/**
 * Redondea un número a 2 decimales
 */
export const round = (value: number): number => {
  return Math.round(value * 100) / 100;
};

/**
 * Obtiene el mes y año de una fecha (formato "MMM YYYY")
 */
export const getMonthYear = (dateStr: string): string => {
  const date = new Date(dateStr + "T00:00:00");
  const months = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${month} ${year}`;
};

/**
 * Convierte un mes en formato "MMM YYYY" a timestamp para comparar
 */
export const monthToTimestamp = (monthStr: string): number => {
  const [monthName, yearStr] = monthStr.split(" ");
  const monthMap: Record<string, number> = {
    Ene: 0,
    Feb: 1,
    Mar: 2,
    Abr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Ago: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dic: 11,
  };
  const month = monthMap[monthName];
  const year = parseInt(yearStr);
  return year * 12 + month;
};

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD usando la hora local de Colombia
 */
export const getCurrentDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Verifica si un mes es el mes actual usando la hora local
 */
export const isCurrentMonth = (mes: string): boolean => {
  const [mesNombre, anioStr] = mes.split(" ");
  const mesesMap: { [key: string]: number } = {
    Ene: 0,
    Feb: 1,
    Mar: 2,
    Abr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Ago: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dic: 11,
  };

  const mesNumero = mesesMap[mesNombre];
  const anio = parseInt(anioStr);

  const ahora = new Date();
  return ahora.getFullYear() === anio && ahora.getMonth() === mesNumero;
};

// ==================== Funciones de obtención y filtrado de datos ====================

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

// ==================== Funciones para cálculo de próxima comisión ====================

/**
 * Calcula la próxima comisión basada en la comisión actual y configuración de umbrales
 * @param comisionActual - La comisión actual en formato decimal (ej: 0.0035 para 0.35%)
 * @param thresholdConfig - Configuración de umbrales de comisión (opcional)
 * @returns La próxima comisión en formato decimal o 'NN' si ya está en el máximo
 */
export const getNextCommission = (
  comisionActual: number,
  thresholdConfig?: CommissionThreshold[]
): number | string => {
  const DEFAULT_THRESHOLDS = [
    { cumplimiento_min: 90, comision_pct: 0.0035, nombre: "Muy Regular" },
    { cumplimiento_min: 95, comision_pct: 0.005, nombre: "Regular" },
    { cumplimiento_min: 100, comision_pct: 0.007, nombre: "Buena" },
    { cumplimiento_min: 110, comision_pct: 0.01, nombre: "Excelente" },
  ];

  const umbrales =
    thresholdConfig && thresholdConfig.length > 0
      ? thresholdConfig
      : DEFAULT_THRESHOLDS;

  const umbralesOrdenados = [...umbrales].sort(
    (a, b) => a.comision_pct - b.comision_pct
  );

  const currentIndex = umbralesOrdenados.findIndex(
    (u) => Math.abs(u.comision_pct - comisionActual) < 0.0001
  );

  if (currentIndex === -1) {
    const closestIndex = umbralesOrdenados.findIndex(
      (u) => u.comision_pct > comisionActual
    );
    if (closestIndex > 0) {
      return umbralesOrdenados[closestIndex - 1].comision_pct;
    }
    return umbralesOrdenados[0]?.comision_pct ?? "NN";
  }

  if (currentIndex >= umbralesOrdenados.length - 1) {
    return "NN";
  }

  return umbralesOrdenados[currentIndex + 1].comision_pct;
};

/**
 * Formatea la próxima comisión para mostrar en las tablas
 * @param proximaComision - La próxima comisión (número o string)
 * @returns String formateado para mostrar
 */
export const formatProximaComision = (
  proximaComision: number | string
): string => {
  if (proximaComision === "NN") {
    return "-";
  }

  if (typeof proximaComision === "number") {
    return `${(proximaComision * 100).toFixed(2)}%`;
  }

  return "-";
};

/**
 * Calcula el próximo presupuesto basado en la próxima comisión y configuración de umbrales
 * @param proximaComision - La próxima comisión
 * @param presupuestoActual - El presupuesto actual del empleado
 * @param thresholdConfig - Configuración de umbrales de comisión (opcional)
 * @returns El próximo presupuesto o null si no aplica
 */
export const getNextBudget = (
  proximaComision: number | string,
  presupuestoActual: number,
  thresholdConfig?: CommissionThreshold[]
): number | null => {
  if (proximaComision === "NN" || typeof proximaComision !== "number") {
    return null;
  }

  const DEFAULT_THRESHOLDS = [
    { cumplimiento_min: 90, comision_pct: 0.0035, nombre: "Muy Regular" },
    { cumplimiento_min: 95, comision_pct: 0.005, nombre: "Regular" },
    { cumplimiento_min: 100, comision_pct: 0.007, nombre: "Buena" },
    { cumplimiento_min: 110, comision_pct: 0.01, nombre: "Excelente" },
  ];

  const umbrales =
    thresholdConfig && thresholdConfig.length > 0
      ? thresholdConfig
      : DEFAULT_THRESHOLDS;

  const umbralesOrdenados = [...umbrales].sort(
    (a, b) => a.comision_pct - b.comision_pct
  );

  const nextIndex = umbralesOrdenados.findIndex(
    (u) => Math.abs(u.comision_pct - proximaComision) < 0.0001
  );

  if (nextIndex === -1) {
    return null;
  }

  const factor = umbralesOrdenados[nextIndex].cumplimiento_min / 100;

  return Math.round(presupuestoActual * factor * 100) / 100;
};

/**
 * Calcula la próxima venta basada en el próximo presupuesto y venta actual
 * @param proximoPresupuesto - El próximo presupuesto calculado
 * @param ventaActual - La venta actual del empleado
 * @returns La próxima venta o null si no aplica
 */
export const getNextSale = (
  proximoPresupuesto: number | null,
  ventaActual: number
): number | null => {
  if (proximoPresupuesto === null) {
    return null;
  }

  const proximaVenta = proximoPresupuesto - ventaActual;
  return Math.max(0, Math.round(proximaVenta * 100) / 100);
};

/**
 * Calcula el próximo monto de comisión basado en próximo presupuesto y próxima comisión
 * @param proximoPresupuesto - El próximo presupuesto
 * @param proximaComision - La próxima comisión (porcentaje)
 * @returns El próximo monto de comisión o null si no aplica
 */
export const getNextCommissionAmount = (
  proximoPresupuesto: number | null,
  proximaComision: number | string
): number | null => {
  if (
    proximoPresupuesto === null ||
    proximaComision === "NN" ||
    typeof proximaComision !== "number"
  ) {
    return null;
  }

  const proximoMontoComision =
    (proximoPresupuesto * (proximaComision as number)) / 1.19;
  return Math.round(proximoMontoComision * 100) / 100;
};
