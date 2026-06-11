export const getFechaActual = (selectedMonth: string | undefined): string => {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Bogota" });
};

export const mapearCargoACargoId = (
  cargoAsignado: string,
  cargosDisponibles: any[]
): number => {
  const cargo = cargosDisponibles.find(
    (c) => c.name.toLowerCase() === cargoAsignado.toLowerCase()
  );
  return cargo?.id || 2;
};

export const getCargoNombre = (
  cargoId: any,
  cargosDisponibles: any[]
): string => {
  if (typeof cargoId === "object" && cargoId?.name) {
    return cargoId.name;
  }

  if (typeof cargoId === "number") {
    const cargo = cargosDisponibles.find((c: any) => c.id === cargoId);
    const name = cargo?.name || "Asesor";
    return name;
  }
  return "Asesor";
};

export const getTiendaNombre = (tiendaId: any): string => {
  if (typeof tiendaId === "object" && tiendaId?.name) {
    return tiendaId.name;
  }

  if (typeof tiendaId === "number") {
    return `Tienda ${tiendaId}`;
  }
  return `Tienda ${tiendaId}`;
};

export const validarCodigoEmpleado = (
  codigoInput: string
): { isValid: boolean; codigo?: number; error?: string } => {
  if (!codigoInput.trim()) {
    return { isValid: false, error: "Código requerido" };
  }

  const codigo = parseInt(codigoInput.trim());
  if (isNaN(codigo)) {
    return { isValid: false, error: "Código de asesor inválido" };
  }

  return { isValid: true, codigo };
};

export const filtrarEmpleadosDisponibles = (
  empleados: any[],
  empleadosAsignados: any[]
): any[] => {
  const idsAsignados = empleadosAsignados.map((e) => e.asesor.id);
  return empleados.filter((empleado) => !idsAsignados.includes(empleado.id));
};

export const validarGerenteExistente = (
  nuevoEmpleado: any,
  empleadosAsignados: any[],
  cargoSeleccionado: string,
  cargosDisponibles: any[]
): string | null => {
  const gerenteCargo = cargosDisponibles.find(
    (c) => c.name.toLowerCase() === "gerente"
  );

  if (gerenteCargo && cargoSeleccionado === gerenteCargo.name.toLowerCase()) {
    const tiendaId =
      typeof nuevoEmpleado.tienda_id === "object"
        ? nuevoEmpleado.tienda_id.id
        : nuevoEmpleado.tienda_id;

    const gerenteExistente = empleadosAsignados.find(
      (e) =>
        e.cargoAsignado === gerenteCargo.name.toLowerCase() &&
        e.tiendaId === tiendaId
    );

    if (gerenteExistente) {
      return `Ya hay un gerente asignado para esta tienda: ${gerenteExistente.asesor.name}`;
    }
  }

  return null;
};
