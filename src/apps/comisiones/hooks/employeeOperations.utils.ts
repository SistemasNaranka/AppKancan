// employeeOperations.utils.ts
import { DirectusStaff, DirectusPosition, EmpleadoAsignado, ROLES_EXCLUSIVOS, RolExclusivo } from "../types/modal";

/** 
 * ✅ CERO MODIFICACIÓN: Función extraída tal cual para calcular el total de la tienda.
 */
export const calcularPresupuestoTotalTienda = (empleados: EmpleadoAsignado[]): number => {
  return empleados.reduce((total, empleado) => total + (empleado.presupuesto || 0), 0);
};

/** 
 * ✅ FORMATEO HUMANA MENTE: Traduce IDs a nombres legibles.
 */
export const getCargoNombreHelper = (cargoId: any, cargosDisponibles: DirectusPosition[]): string => {
  if (typeof cargoId === "object" && cargoId?.name) return cargoId.name;
  if (typeof cargoId === "number") {
    const cargo = cargosDisponibles.find((c) => c.id === cargoId);
    return cargo?.name || "Asesor";
  }
  return "Asesor";
};

export const getTiendaNombreHelper = (tiendaId: any): string => {
  if (typeof tiendaId === "object" && tiendaId?.name) return tiendaId.name;
  return `Tienda ${tiendaId}`;
};

/** 
 * ✅ VALIDACIÓN DE ROLES: Mantenemos la lógica de exclusividad de roles.
 */
export const validateExclusiveRoleHelper = (
  role: string, 
  asesor: DirectusStaff, 
  empleadosAsignados: EmpleadoAsignado[]
): string | null => {
  const roleLower = role.toLowerCase();
  if (ROLES_EXCLUSIVOS.includes(roleLower as RolExclusivo)) {
    const tiendaId = typeof asesor.store_id === "object" ? asesor.store_id.id : asesor.store_id;
    const rolExistente = empleadosAsignados.find(
      (e) => e.cargoAsignado.toLowerCase() === roleLower && e.tiendaId === tiendaId
    );
    if (rolExistente) return `Ya hay un ${roleLower} asignado para esta tienda: ${rolExistente.asesor.name}`;
  }
  return null;
};