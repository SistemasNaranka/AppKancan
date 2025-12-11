import { StaffMember } from "../types";

export interface StaffValidationError {
  message: string;
  type: "warning" | "error";
}

export const validateStaffAssignment = (
  staff: StaffMember[]
): StaffValidationError[] => {
  const errors: StaffValidationError[] = [];

  if (!staff || staff.length === 0) {
    errors.push({
      message: "No hay personal asignado en el sistema.",
      type: "warning",
    });
    return errors;
  }

  // Validar que hay al menos un gerente
  const gerentes = staff.filter((member) => member.rol === "gerente");
  if (gerentes.length === 0) {
    errors.push({
      message:
        "No hay gerentes asignados. Verifica la configuración de personal.",
      type: "warning",
    });
  }

  // Validar que hay al menos un asesor
  const asesores = staff.filter((member) => member.rol === "asesor");
  if (asesores.length === 0) {
    errors.push({
      message:
        "No hay asesores asignados. Verifica la configuración de personal.",
      type: "warning",
    });
  }

  // Validar empleados sin tienda asignada
  const empleadosSinTienda = staff.filter(
    (member) => !member.tienda || member.tienda.trim() === ""
  );
  if (empleadosSinTienda.length > 0) {
    errors.push({
      message: `${empleadosSinTienda.length} empleado(s) no tienen tienda asignada.`,
      type: "warning",
    });
  }

  // Validar duplicados por ID
  const ids = staff.map((member) => member.id);
  const idsDuplicados = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (idsDuplicados.length > 0) {
    errors.push({
      message: `Hay empleados con IDs duplicados: ${[
        ...new Set(idsDuplicados),
      ].join(", ")}`,
      type: "error",
    });
  }

  return errors;
};

export const getStaffSummary = (staff: StaffMember[]) => {
  if (!staff || staff.length === 0) {
    return {
      total: 0,
      porRol: {},
      porTienda: {},
    };
  }

  const porRol = staff.reduce((acc, member) => {
    acc[member.rol] = (acc[member.rol] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const porTienda = staff.reduce((acc, member) => {
    const tienda = member.tienda || "Sin asignar";
    acc[tienda] = (acc[tienda] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    total: staff.length,
    porRol,
    porTienda,
  };
};
