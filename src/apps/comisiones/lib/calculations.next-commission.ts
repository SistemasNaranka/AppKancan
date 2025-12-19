/**
 * Funciones específicas para calcular próxima comisión, presupuesto y venta
 * Creado para mantener organizada la nueva funcionalidad
 */

/**
 * Calcula la próxima comisión basada en la comisión actual
 * @param comisionActual - La comisión actual en formato decimal (ej: 0.0035 para 0.35%)
 * @returns La próxima comisión en formato decimal o 'NN' si ya está en el máximo
 */
export const getNextCommission = (comisionActual: number): number | string => {
  // Mapeo de comisiones actuales a próximas comisiones
  const escalonesComision: Record<number, number | string> = {
    0: 0.0035, // 0.00% → 0.35%
    0.0035: 0.005, // 0.35% → 0.50%
    0.005: 0.007, // 0.50% → 0.70%
    0.007: 0.01, // 0.70% → 1.00%
    0.01: "NN", // 1.00% → NN (máximo alcanzado)
  };

  return escalonesComision[comisionActual] ?? "NN";
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
 * Calcula el próximo presupuesto basado en la próxima comisión
 * @param proximaComision - La próxima comisión
 * @param presupuestoActual - El presupuesto actual del empleado
 * @returns El próximo presupuesto o null si no aplica
 */
export const getNextBudget = (
  proximaComision: number | string,
  presupuestoActual: number
): number | null => {
  if (proximaComision === "NN" || typeof proximaComision !== "number") {
    return null; // No hay próximo presupuesto si ya está en el máximo
  }

  // Factores de multiplicación basados en la próxima comisión
  const factoresPresupuesto: Record<number, number> = {
    0.0035: 0.9, // Próxima comisión 0.35% → multiplicar por 0.90
    0.005: 0.95, // Próxima comisión 0.50% → multiplicar por 0.95
    0.007: 1.0, // Próxima comisión 0.70% → multiplicar por 1.00
    0.01: 1.1, // Próxima comisión 1.00% → multiplicar por 1.10
  };

  const factor = factoresPresupuesto[proximaComision];
  if (factor === undefined) {
    return null;
  }

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
