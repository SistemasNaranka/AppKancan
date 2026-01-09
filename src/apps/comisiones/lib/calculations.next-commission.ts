/**
 * Funciones específicas para calcular próxima comisión, presupuesto y venta
 * Creado para mantener organizada la nueva funcionalidad
 */

import { CommissionThreshold } from "../types";

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
  // Usar configuración proporcionada o valores por defecto
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

  // Ordenar umbrales por comision_pct ascendente
  const umbralesOrdenados = [...umbrales].sort(
    (a, b) => a.comision_pct - b.comision_pct
  );

  // Encontrar el índice de la comisión actual
  const currentIndex = umbralesOrdenados.findIndex(
    (u) => Math.abs(u.comision_pct - comisionActual) < 0.0001 // Comparación con tolerancia
  );

  if (currentIndex === -1) {
    // Si no encuentra la comisión exacta, buscar la más cercana por debajo
    const closestIndex = umbralesOrdenados.findIndex(
      (u) => u.comision_pct > comisionActual
    );
    if (closestIndex > 0) {
      return umbralesOrdenados[closestIndex - 1].comision_pct;
    }
    return umbralesOrdenados[0]?.comision_pct ?? "NN";
  }

  // Si está en el último nivel, retornar "NN"
  if (currentIndex >= umbralesOrdenados.length - 1) {
    return "NN";
  }

  // Retornar el siguiente nivel
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
    return null; // No hay próximo presupuesto si ya está en el máximo
  }

  // Usar configuración proporcionada o valores por defecto
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

  // Ordenar umbrales por comision_pct ascendente
  const umbralesOrdenados = [...umbrales].sort(
    (a, b) => a.comision_pct - b.comision_pct
  );

  // Encontrar el índice de la próxima comisión
  const nextIndex = umbralesOrdenados.findIndex(
    (u) => Math.abs(u.comision_pct - proximaComision) < 0.0001 // Comparación con tolerancia
  );

  if (nextIndex === -1) {
    return null; // No se encontró la comisión en los umbrales
  }

  // Calcular factor basado en el cumplimiento_min del umbral
  const factor = umbralesOrdenados[nextIndex].cumplimiento_min / 100;

  return Math.round(presupuestoActual * factor * 100) / 100; // Redondear a 2 decimales
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
    return null; // No hay próxima venta si no hay próximo presupuesto
  }

  const proximaVenta = proximoPresupuesto - ventaActual;
  return Math.max(0, Math.round(proximaVenta * 100) / 100); // No puede ser negativa, redondear a 2 decimales
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
    return null; // No hay próximo monto si no hay presupuesto o si ya está en el máximo
  }

  // Calcular: (próximo_presupuesto × próxima_comisión) / 1.19
  const proximoMontoComision =
    (proximoPresupuesto * (proximaComision as number)) / 1.19;
  return Math.round(proximoMontoComision * 100) / 100; // Redondear a 2 decimales
};
