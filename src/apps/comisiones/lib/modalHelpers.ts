/**
 * Funciones auxiliares para el modal de códigos
 */

export const getFechaActual = (mesSeleccionado?: string): string => {
  // SIEMPRE usar la fecha de HOY del sistema
  const now = new Date();
  return now.toISOString().split("T")[0]; // YYYY-MM-DD
};

/**
 * Mapea el nombre del cargo a su ID correspondiente
 */
export const mapearCargoACargoId = (
  cargoAsignado: string,
  cargosDisponibles: any[]
): number => {
  const cargo = cargosDisponibles.find(
    (c) => c.nombre.toLowerCase() === cargoAsignado.toLowerCase()
  );
  return cargo?.id || 2; // Default a asesor si no encuentra
};

/**
 * Obtiene el nombre del cargo a partir de su ID
 */
export const getCargoNombre = (
  cargoId: any,
  cargosDisponibles: any[]
): string => {
  // Si es un objeto con nombre, devolverlo
  if (typeof cargoId === "object" && cargoId?.nombre) {
    return cargoId.nombre;
  }
  // Si es un número, buscar en cargosDisponibles
  if (typeof cargoId === "number") {
    const cargo = cargosDisponibles.find((c: any) => c.id === cargoId);
    return cargo?.nombre || "Asesor";
  }
  return "Asesor";
};

/**
 * Obtiene el nombre de la tienda a partir de su ID
 */
export const getTiendaNombre = (tiendaId: any): string => {
  // Si es un objeto con nombre, devolverlo
  if (typeof tiendaId === "object" && tiendaId?.nombre) {
    return tiendaId.nombre;
  }
  // Si es un número, devolver el ID como string
  if (typeof tiendaId === "number") {
    return `Tienda ${tiendaId}`;
  }
  return `Tienda ${tiendaId}`;
};

/**
 * Valida si un código de empleado es válido
 */
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

/**
 * Filtra empleados para mostrar solo los disponibles
 */
export const filtrarEmpleadosDisponibles = (
  empleados: any[],
  empleadosAsignados: any[]
): any[] => {
  const idsAsignados = empleadosAsignados.map((e) => e.asesor.id);
  return empleados.filter((empleado) => !idsAsignados.includes(empleado.id));
};

/**
 * Valida si ya existe un gerente asignado para una tienda
 */
export const validarGerenteExistente = (
  nuevoEmpleado: any,
  empleadosAsignados: any[],
  cargoSeleccionado: string,
  cargosDisponibles: any[]
): string | null => {
  const gerenteCargo = cargosDisponibles.find(
    (c) => c.nombre.toLowerCase() === "gerente"
  );

  if (gerenteCargo && cargoSeleccionado === gerenteCargo.nombre.toLowerCase()) {
    const tiendaId =
      typeof nuevoEmpleado.tienda_id === "object"
        ? nuevoEmpleado.tienda_id.id
        : nuevoEmpleado.tienda_id;

    const gerenteExistente = empleadosAsignados.find(
      (e) =>
        e.cargoAsignado === gerenteCargo.nombre.toLowerCase() &&
        e.tiendaId === tiendaId
    );

    if (gerenteExistente) {
      return `Ya hay un gerente asignado para esta tienda: ${gerenteExistente.asesor.nombre}`;
    }
  }

  return null;
};
