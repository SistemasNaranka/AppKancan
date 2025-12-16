/**
 * Lógica de cálculos para comisiones, cumplimiento y presupuestos
 *
 * ARCHIVO MODULARIZADO - Este archivo ahora re-exporta las funciones desde módulos separados
 * para mejorar la mantenibilidad del código sin romper la funcionalidad existente.
 *
 * Módulos:
 * - calculations.basic.ts: Funciones básicas de utilidad
 * - calculations.budgets.ts: Cálculos de presupuestos
 * - calculations.commissions.ts: Cálculos de comisiones y cumplimiento
 * - calculations.data.ts: Funciones de obtención de datos
 * - calculations.summary.ts: Funciones de resúmenes
 * - calculations.index.ts: Re-exportaciones principales
 */

import {
  BudgetRecord,
  StaffMember,
  VentasData,
  EmployeeCommission,
  TiendaResumen,
  MesResumen,
  Role,
} from "../types";
import { calcularDiasLaboradosPorEmpleado } from "./utils";

// Re-exportar todas las funciones desde los módulos modulares
export * from "./calculations.index";

// Mantener la función calcularDiasLaboradosPorEmpleado si existe en utils
export { calcularDiasLaboradosPorEmpleado } from "./utils";

// Agregar cualquier función adicional específica que no haya sido migrada
// (actualmente todas las funciones han sido migradas a los módulos)
