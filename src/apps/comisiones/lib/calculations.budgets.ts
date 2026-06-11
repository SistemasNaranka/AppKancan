/**
 * Funciones de cálculos de presupuestos para comisiones
 */

import { BudgetRecord } from "../types";
import { round, getMonthYear } from "./calculations.utils";

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
    coadministrador_tipo: "fijo" | "distributivo";
    coadministrador_porcentaje: number;
    cajero_tipo: "fijo" | "distributivo";
    cajero_porcentaje: number;
    logistico_tipo: "fijo" | "distributivo";
    logistico_porcentaje: number;
  },
  empleadosPorRol: {
    gerente: number;
    asesor: number;
    coadministrador: number;
    cajero: number;
    logistico: number;
    gerente_online: number;
  }
): { [rol: string]: number } => {
  const presupuestos: { [rol: string]: number } = {
    gerente: 0,
    asesor: 0,
    coadministrador: 0,
    cajero: 0,
    logistico: 0,
    gerente_online: 0,
  };

  let presupuestoRestante = presupuesto_total;

  if (porcentajes.gerente_tipo === "fijo" && empleadosPorRol.gerente > 0) {
    const presupuestoGerente = round(
      (presupuesto_total * porcentajes.gerente_porcentaje) / 100
    );
    presupuestos.gerente = presupuestoGerente;
    presupuestoRestante -= presupuestoGerente;
  }

  if (
    porcentajes.coadministrador_tipo === "fijo" &&
    empleadosPorRol.coadministrador > 0
  ) {
    const presupuestoCoadministrador = round(
      (presupuesto_total * porcentajes.coadministrador_porcentaje) / 100
    );
    presupuestos.coadministrador = presupuestoCoadministrador;
    presupuestoRestante -= presupuestoCoadministrador;
  }

  if (porcentajes.cajero_tipo === "fijo" && empleadosPorRol.cajero > 0) {
    const presupuestoCajero = round(
      (presupuesto_total * porcentajes.cajero_porcentaje) / 100
    );
    presupuestos.cajero = presupuestoCajero;
    presupuestoRestante -= presupuestoCajero;
  }

  if (empleadosPorRol.gerente_online > 0) {
    presupuestos.gerente_online = empleadosPorRol.gerente_online * 1;
  }

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
    porcentajes.coadministrador_tipo === "distributivo" &&
    empleadosPorRol.coadministrador > 0
  ) {
    distributivos.push("coadministrador");
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

export const calculateManagerBudget = (
  presupuesto_total: number,
  porcentaje_gerente: number
): number => {
  return round((presupuesto_total * porcentaje_gerente) / 100);
};

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

export const filterBudgetsByMonth = (
  budgets: BudgetRecord[],
  mes: string
): BudgetRecord[] => {
  return budgets.filter((b) => getMonthYear(b.fecha) === mes);
};
