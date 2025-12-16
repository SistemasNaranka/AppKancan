import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { EmployeeCommission } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats commission and sales values for display
 * US format: commas for thousands, dots for decimals
 */
export function formatCurrency(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

/**
 * Calcula los días únicos laborados por cada empleado
 * @param empleados - Array de empleados con sus datos
 * @returns Map con el ID del empleado como key y la cantidad de días únicos como value
 */
export function calcularDiasLaboradosPorEmpleado(
  empleados: EmployeeCommission[]
): Map<string, number> {
  const diasPorEmpleado = new Map<string, Set<string>>();

  // Agrupar fechas por empleado
  empleados.forEach((empleado) => {
    if (!diasPorEmpleado.has(empleado.id)) {
      diasPorEmpleado.set(empleado.id, new Set());
    }
    diasPorEmpleado.get(empleado.id)!.add(empleado.fecha);
  });

  // Convertir sets a conteos
  const conteoDias = new Map<string, number>();
  diasPorEmpleado.forEach((fechas, empleadoId) => {
    conteoDias.set(empleadoId, fechas.size);
  });

  return conteoDias;
}

/**
 * Obtiene los días laborados para un empleado específico
 * @param empleados - Array de empleados
 * @param empleadoId - ID del empleado
 * @returns Número de días únicos laborados
 */
export function obtenerDiasLaboradosEmpleado(
  empleados: EmployeeCommission[],
  empleadoId: string
): number {
  const fechasUnicas = new Set<string>();

  empleados
    .filter((emp) => emp.id === empleadoId)
    .forEach((emp) => fechasUnicas.add(emp.fecha));

  return fechasUnicas.size;
}
