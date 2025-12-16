/**
 * Archivo principal que re-exporta todas las funciones de cálculos de comisiones
 * Este archivo mantiene la compatibilidad con el código existente
 */

// Re-exportar funciones básicas de utilidad
export {
  round,
  getMonthYear,
  monthToTimestamp,
  getCurrentDate,
  isCurrentMonth,
} from "./calculations.basic";

// Re-exportar funciones de cálculos de presupuestos
export {
  calculateBudgetsWithFixedDistributive,
  calculateManagerBudget,
  calculateAdvisorBudget,
  filterBudgetsByMonth,
} from "./calculations.budgets";

// Re-exportar funciones de cálculos de comisiones y cumplimiento
export {
  calculateCompliance,
  calculateBaseSale,
  getCommissionPercentage,
  calculateCommissionAmount,
  calculateEmployeeCommission,
  calculateGerenteCommission,
  calculateCajeroCommission,
  calculateLogisticoCommission,
} from "./calculations.commissions";

// Re-exportar funciones de obtención y filtrado de datos
export {
  getEmployeeVentas,
  getTiendaVentas,
  getAvailableMonths,
} from "./calculations.data";

// Re-exportar funciones de cálculos de resúmenes
export {
  calculateMesResumenAgrupado,
  calculateTiendaResumen,
} from "./calculations.summary";
