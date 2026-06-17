import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { EmployeeCommission } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

export function calcularDiasLaboradosPorEmpleado(
  empleados: EmployeeCommission[]
): Map<string, number> {
  const diasPorEmpleado = new Map<string, Set<string>>();

  empleados.forEach((empleado) => {
    if (!diasPorEmpleado.has(empleado.id)) {
      diasPorEmpleado.set(empleado.id, new Set());
    }
    diasPorEmpleado.get(empleado.id)!.add(empleado.fecha);
  });

  const conteoDias = new Map<string, number>();
  diasPorEmpleado.forEach((fechas, empleadoId) => {
    conteoDias.set(empleadoId, fechas.size);
  });

  return conteoDias;
}

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
