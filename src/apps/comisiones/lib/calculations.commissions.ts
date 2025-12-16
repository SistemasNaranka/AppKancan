/**
 * Funciones de cálculos de comisiones y cumplimiento
 */

import { StaffMember, EmployeeCommission } from "../types";
import { round } from "./calculations.basic";

/**
 * Calcula el porcentaje de cumplimiento
 */
export const calculateCompliance = (
  ventas: number,
  presupuesto: number
): number => {
  if (presupuesto === 0) return 0;
  // Mantener más precisión para cálculos, redondear solo a 4 decimales para mostrar
  return Math.round((ventas / presupuesto) * 100 * 10000) / 10000;
};

/**
 * Calcula venta base sin IVA para comisión
 */
export const calculateBaseSale = (
  venta_total: number,
  iva_factor: number = 1.19
): number => {
  return round(venta_total / iva_factor);
};

/**
 * Obtiene el porcentaje de comisión según cumplimiento (corregida)
 * Los decimales son importantes para los cálculos
 */
export const getCommissionPercentage = (compliance: number): number => {
  if (compliance >= 110.0) return 0.01; // Excelente: 1.00%
  if (compliance >= 100.0) return 0.007; // Buena: 0.70%
  if (compliance >= 95.0) return 0.0035; // Regular: 0.35%
  return 0; // Sin comisión
};

/**
 * Calcula el monto de comisión basado en venta sin IVA
 * comision_pct ya viene en formato decimal (ej: 0.0035 para 0.35%)
 */
export const calculateCommissionAmount = (
  venta_sin_iva: number,
  comision_pct: number
): number => {
  return round(venta_sin_iva * comision_pct);
};

/**
 * Calcula las comisiones para un empleado (asesores y otros roles individuales)
 */
export const calculateEmployeeCommission = (
  empleado: StaffMember,
  presupuesto: number,
  ventas: number
): EmployeeCommission => {
  const cumplimiento = calculateCompliance(ventas, presupuesto);
  const venta_sin_iva = calculateBaseSale(ventas);
  const comision_pct = getCommissionPercentage(cumplimiento);
  const comision_monto = calculateCommissionAmount(venta_sin_iva, comision_pct);

  return {
    id: empleado.id,
    nombre: empleado.nombre,
    rol: empleado.rol,
    tienda: empleado.tienda,
    fecha: empleado.fecha,
    presupuesto: presupuesto, // Mantener precisión para cálculos
    ventas: ventas, // Mantener precisión para cálculos
    cumplimiento_pct: cumplimiento,
    comision_pct,
    comision_monto,
    dias_laborados: 1, // Por defecto 1 día para funciones individuales
  };
};

/**
 * Calcula las comisiones para gerentes
 * LÓGICA ESPECIAL: Para gerentes, los 3 cálculos principales deben estar basados en la TIENDA COMPLETA:
 * - Monto de comisión: basado en ventas de la tienda
 * - Cumplimiento: basado en rendimiento de la tienda
 * - Porcentaje de comisión: basado en cumplimiento de la tienda
 *
 * Los datos individuales del gerente (ventas y presupuesto) son solo para mostrar en la tabla.
 */
export const calculateGerenteCommission = (
  empleado: StaffMember,
  presupuestoGerente: number,
  ventasIndividualesGerente: number,
  ventasTiendaTotal: number,
  presupuestoTiendaTotal: number
): EmployeeCommission => {
  // 1. CUMPLIMIENTO: basado en la tienda completa
  const cumplimientoTienda = calculateCompliance(
    ventasTiendaTotal,
    presupuestoTiendaTotal
  );

  // 2. PORCENTAJE DE COMISIÓN: basado en cumplimiento de la tienda
  const comision_pct = getCommissionPercentage(cumplimientoTienda);

  // 3. MONTO DE COMISIÓN: basado en ventas de la tienda (no ventas individuales del gerente)
  const ventaTiendaSinIVA = calculateBaseSale(ventasTiendaTotal);
  const comision_monto = calculateCommissionAmount(
    ventaTiendaSinIVA,
    comision_pct
  );

  return {
    id: empleado.id,
    nombre: empleado.nombre,
    rol: empleado.rol,
    tienda: empleado.tienda,
    fecha: empleado.fecha,
    presupuesto: presupuestoGerente, // Muestra presupuesto individual del gerente (para información)
    ventas: ventasIndividualesGerente, // Muestra ventas individuales del gerente (para información)
    cumplimiento_pct: cumplimientoTienda, // Muestra cumplimiento de la tienda (para cálculo)
    comision_pct, // Porcentaje basado en cumplimiento de la tienda
    comision_monto, // Monto basado en ventas de la tienda
    dias_laborados: 1, // Por defecto 1 día para funciones individuales
  };
};

/**
 * Función base para calcular comisiones de roles colectivos (cajeros, logísticos)
 * Lógica común: comisión basada en el rendimiento general de la tienda,
 * dividida entre TODOS los empleados que trabajaron en la tienda.
 *
 * @param empleado - Datos del empleado
 * @param ventasTiendaTotal - Ventas totales de la tienda
 * @param presupuestoTiendaTotal - Presupuesto total de la tienda
 * @param cantidadEmpleadosRol - Cantidad total de empleados en la tienda
 * @param ventasIndividualesEmpleado - Ventas individuales del empleado (para mostrar)
 * @param presupuestoIndividualEmpleado - Presupuesto individual del empleado (para mostrar)
 * @param rol - Rol específico del empleado
 * @returns EmployeeCommission con los datos calculados
 */
const calculateCollectiveRoleCommission = (
  empleado: StaffMember,
  ventasTiendaTotal: number,
  presupuestoTiendaTotal: number,
  cantidadEmpleadosRol: number,
  ventasIndividualesEmpleado: number = 0,
  presupuestoIndividualEmpleado: number = 0,
  rol: "cajero" | "logistico"
): EmployeeCommission => {
  // Calcular cumplimiento de la tienda
  const cumplimientoTienda = calculateCompliance(
    ventasTiendaTotal,
    presupuestoTiendaTotal
  );

  // Obtener porcentaje de comisión basado en cumplimiento de la tienda
  const comision_pct = getCommissionPercentage(cumplimientoTienda);

  // Calcular venta base sin IVA de la tienda
  const ventaTiendaSinIVA = calculateBaseSale(ventasTiendaTotal);

  // Dividir la venta sin IVA entre TODOS los empleados de la tienda
  const ventaBasePorEmpleado =
    cantidadEmpleadosRol > 0 ? ventaTiendaSinIVA / cantidadEmpleadosRol : 0;

  // Calcular comisión: (venta_sin_iva / cantidad_empleados) * porcentaje_comision
  const comision_monto = calculateCommissionAmount(
    ventaBasePorEmpleado,
    comision_pct
  );

  return {
    id: empleado.id,
    nombre: empleado.nombre,
    rol: rol,
    tienda: empleado.tienda,
    fecha: empleado.fecha,
    presupuesto: presupuestoIndividualEmpleado, // Muestran presupuesto individual (o 0)
    ventas: ventasIndividualesEmpleado, // Muestran ventas individuales (o 0)
    cumplimiento_pct: cumplimientoTienda, // Muestran cumplimiento de la tienda para cálculo
    comision_pct,
    comision_monto,
    dias_laborados: 1, // Por defecto 1 día para funciones individuales
  };
};

/**
 * Calcula las comisiones para cajeros
 * Lógica especial: comisión basada en el rendimiento general de la tienda,
 * dividida entre TODOS los empleados que trabajaron en la tienda.
 * Muestra ventas individuales registradas en venta_diaria_empleado (o 0 si no tienen)
 * y presupuesto individual asignado (o 0 si no tienen) en la vista, pero calcula comisión colectiva.
 */
export const calculateCajeroCommission = (
  empleado: StaffMember,
  ventasTiendaTotal: number,
  presupuestoTiendaTotal: number,
  cantidadEmpleadosRol: number,
  ventasIndividualesEmpleado: number = 0,
  presupuestoIndividualEmpleado: number = 0
): EmployeeCommission => {
  return calculateCollectiveRoleCommission(
    empleado,
    ventasTiendaTotal,
    presupuestoTiendaTotal,
    cantidadEmpleadosRol,
    ventasIndividualesEmpleado,
    presupuestoIndividualEmpleado,
    "cajero"
  );
};

/**
 * Calcula las comisiones para logísticos
 * Lógica especial: comisión basada en el rendimiento general de la tienda,
 * dividida entre TODOS los empleados que trabajaron en la tienda.
 * Muestra ventas individuales registradas en venta_diaria_empleado (o 0 si no tienen)
 * y presupuesto individual asignado (o 0 si no tienen) en la vista, pero calcula comisión colectiva.
 */
export const calculateLogisticoCommission = (
  empleado: StaffMember,
  ventasTiendaTotal: number,
  presupuestoTiendaTotal: number,
  cantidadEmpleadosRol: number,
  ventasIndividualesEmpleado: number = 0,
  presupuestoIndividualEmpleado: number = 0
): EmployeeCommission => {
  return calculateCollectiveRoleCommission(
    empleado,
    ventasTiendaTotal,
    presupuestoTiendaTotal,
    cantidadEmpleadosRol,
    ventasIndividualesEmpleado,
    presupuestoIndividualEmpleado,
    "logistico"
  );
};
