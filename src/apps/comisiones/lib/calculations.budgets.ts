/**
 * Funciones de cálculos de presupuestos para comisiones
 */

import { BudgetRecord } from "../types";
import { round, getMonthYear } from "./calculations.basic";

/**
 * Calcula presupuestos diarios con sistema fijo/distributivo
 */
export const calculateBudgetsWithFixedDistributive = (
  presupuesto_total: number,
  porcentajes: {
    gerente_tipo: "fijo" | "distributivo";
    gerente_porcentaje: number;
    asesor_tipo: "fijo" | "distributivo";
    asesor_porcentaje: number;
    cajero_tipo: "fijo" | "distributivo";
    cajero_porcentaje: number;
    logistico_tipo: "fijo" | "distributivo";
    logistico_porcentaje: number;
  },
  empleadosPorRol: {
    gerente: number;
    asesor: number;
    cajero: number;
    logistico: number;
  }
): { [rol: string]: number } => {
  const presupuestos: { [rol: string]: number } = {
    gerente: 0,
    asesor: 0,
    cajero: 0,
    logistico: 0,
  };

  let presupuestoRestante = presupuesto_total;

  // 1. Calcular fijos primero
  if (porcentajes.gerente_tipo === "fijo" && empleadosPorRol.gerente > 0) {
    const presupuestoGerente = round(
      (presupuesto_total * porcentajes.gerente_porcentaje) / 100
    );
    presupuestos.gerente = presupuestoGerente;
    presupuestoRestante -= presupuestoGerente;
  }

  if (porcentajes.cajero_tipo === "fijo" && empleadosPorRol.cajero > 0) {
    const presupuestoCajero = round(
      (presupuesto_total * porcentajes.cajero_porcentaje) / 100
    );
    presupuestos.cajero = presupuestoCajero;
    presupuestoRestante -= presupuestoCajero;
  }

  // 2. Calcular distributivos con el presupuesto restante
  const distributivos: string[] = [];

  if (
    porcentajes.gerente_tipo === "distributivo" &&
    empleadosPorRol.gerente > 0
  ) {
    distributivos.push("gerente");
  }
  if (
    porcentajes.asesor_tipo === "distributivo" &&
    empleadosPorRol.asesor > 0
  ) {
    distributivos.push("asesor");
  }
  if (
    porcentajes.cajero_tipo === "distributivo" &&
    empleadosPorRol.cajero > 0
  ) {
    distributivos.push("cajero");
  }
  if (
    porcentajes.logistico_tipo === "distributivo" &&
    empleadosPorRol.logistico > 0
  ) {
    distributivos.push("logistico");
  }

  // Distribuir presupuesto restante entre todos los empleados de roles distributivos
  let totalEmpleadosDistributivos = 0;
  distributivos.forEach((rol) => {
    totalEmpleadosDistributivos +=
      empleadosPorRol[rol as keyof typeof empleadosPorRol];
  });

  if (totalEmpleadosDistributivos > 0) {
    const presupuestoPorEmpleado = round(
      presupuestoRestante / totalEmpleadosDistributivos
    );

    distributivos.forEach((rol) => {
      const cantidadEmpleados =
        empleadosPorRol[rol as keyof typeof empleadosPorRol];
      presupuestos[rol] = presupuestoPorEmpleado * cantidadEmpleados;
    });
  }

  return presupuestos;
};

/**
 * Calcula el presupuesto para el gerente basado en el porcentaje fijo mensual (LEGACY)
 */
export const calculateManagerBudget = (
  presupuesto_total: number,
  porcentaje_gerente: number
): number => {
  return round((presupuesto_total * porcentaje_gerente) / 100);
};

/**
 * Calcula el presupuesto para cada asesor (LEGACY)
 */
export const calculateAdvisorBudget = (
  presupuesto_total: number,
  porcentaje_gerente: number,
  cantidad_asesores: number
): number => {
  if (cantidad_asesores === 0) return 0;
  const presupuesto_asesores =
    presupuesto_total * ((100 - porcentaje_gerente) / 100);
  return round(presupuesto_asesores / cantidad_asesores);
};

/**
 * Filtra presupuestos por mes
 */
export const filterBudgetsByMonth = (
  budgets: BudgetRecord[],
  mes: string
): BudgetRecord[] => {
  return budgets.filter((b) => getMonthYear(b.fecha) === mes);
};
