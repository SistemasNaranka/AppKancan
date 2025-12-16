import { useState, useEffect, useRef } from "react";
import {
  DirectusAsesor,
  DirectusCargo,
  DirectusTienda,
  EmpleadoAsignado,
  ROLES_EXCLUSIVOS,
  RolExclusivo,
} from "../types/modal";
import {
  guardarPresupuestosEmpleados,
  guardarVentasEmpleados,
} from "../api/directus/create";
import {
  obtenerVentasEmpleados,
  obtenerPorcentajesMensuales,
  obtenerPresupuestosDiarios,
} from "../api/directus/read";
import { calculateBudgetsWithFixedDistributive } from "../lib/calculations";

interface UseEmployeeOperationsReturn {
  // Estados
  codigoInput: string;
  cargoSeleccionado: string;
  empleadosAsignados: EmpleadoAsignado[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  success: string | null;
  messageType: "success" | "error" | "warning" | "info";
  canSave: boolean;

  // Handlers
  setCodigoInput: (value: string) => void;
  setCargoSeleccionado: (value: string) => void;
  handleAddEmpleado: (
    asesoresDisponibles: DirectusAsesor[],
    cargosDisponibles: DirectusCargo[]
  ) => Promise<void>;
  handleRemoveEmpleado: (asesorId: number) => Promise<void>;
  handleClearEmpleados: () => void;
  handleSaveAsignaciones: (
    fechaActual: string,
    cargosDisponibles: DirectusCargo[]
  ) => Promise<void>;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  onAssignmentComplete?: (ventasData: any[]) => void;

  // Refs para focus
  codigoInputRef: React.RefObject<HTMLInputElement>;

  // Helpers
  getCargoNombre: (cargoId: any, cargosDisponibles: DirectusCargo[]) => string;
  getTiendaNombre: (tiendaId: any) => string;
  // Funciones de validación
  validateExclusiveRole: (
    role: string,
    asesor: DirectusAsesor
  ) => string | null;
  hasRequiredRoles: () => boolean;
  // Función para limpiar mensajes
  clearMessages: () => void;
}

export const useEmployeeOperations = (
  tiendaUsuario: DirectusTienda | null,
  onAssignmentComplete?: (ventasData: any[]) => void
): UseEmployeeOperationsReturn => {
  const [codigoInput, setCodigoInput] = useState("");
  const [cargoSeleccionado, setCargoSeleccionado] = useState("");
  const [empleadosAsignados, setEmpleadosAsignados] = useState<
    EmpleadoAsignado[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<
    "success" | "error" | "warning" | "info"
  >("info");
  const [canSave, setCanSave] = useState(false);

  // Ref para mantener focus en el input
  const codigoInputRef = useRef<HTMLInputElement>(null);

  // Validar si puede guardar (debe tener al menos un gerente o coadministrador)
  useEffect(() => {
    const hasManagerOrCoadmin = empleadosAsignados.some((empleado) =>
      ROLES_EXCLUSIVOS.includes(
        empleado.cargoAsignado.toLowerCase() as RolExclusivo
      )
    );
    setCanSave(hasManagerOrCoadmin && empleadosAsignados.length > 0);
  }, [empleadosAsignados]);

  const calcularPresupuestosTodosEmpleados = async (
    empleadosConRoles: Array<{ asesor: DirectusAsesor; cargoAsignado: string }>,
    fechaActual: string
  ): Promise<{ [asesorId: number]: number } | null> => {
    try {
      if (empleadosConRoles.length === 0) return {};

      if (!tiendaUsuario) {
        console.error("No se tiene la tienda del usuario");
        return null;
      }

      const tiendaId = tiendaUsuario.id;

      const presupuestosTienda = await obtenerPresupuestosDiarios(
        tiendaId,
        fechaActual,
        fechaActual
      );

      if (presupuestosTienda.length === 0) {
        return null;
      }

      const presupuestoTienda = presupuestosTienda[0].presupuesto;

      const mesAnio = fechaActual.substring(0, 7);
      const porcentajes = await obtenerPorcentajesMensuales(undefined, mesAnio);

      if (porcentajes.length === 0) {
        return null;
      }

      const porcentajeConfig = porcentajes[0];

      const empleadosPorRol = {
        gerente: empleadosConRoles.filter((e) => e.cargoAsignado === "gerente")
          .length,
        asesor: empleadosConRoles.filter((e) => e.cargoAsignado === "asesor")
          .length,
        cajero: empleadosConRoles.filter((e) => e.cargoAsignado === "cajero")
          .length,
        logistico: empleadosConRoles.filter(
          (e) => e.cargoAsignado === "logistico"
        ).length,
      };

      const presupuestosPorRol = calculateBudgetsWithFixedDistributive(
        presupuestoTienda,
        porcentajeConfig,
        empleadosPorRol
      );

      const presupuestos: { [asesorId: number]: number } = {};

      empleadosConRoles.forEach((empleadoConRol) => {
        const rolLower = empleadoConRol.cargoAsignado;

        if (
          rolLower === "gerente" ||
          rolLower === "asesor" ||
          rolLower === "cajero" ||
          rolLower === "logistico"
        ) {
          const cantidadEmpleadosRol =
            empleadosPorRol[rolLower as keyof typeof empleadosPorRol];
          if (cantidadEmpleadosRol > 0) {
            presupuestos[empleadoConRol.asesor.id] = Math.round(
              presupuestosPorRol[rolLower as keyof typeof presupuestosPorRol] /
                cantidadEmpleadosRol
            );
          }
        }
      });

      return presupuestos;
    } catch (err) {
      return null;
    }
  };

  const validateExclusiveRole = (
    role: string,
    asesor: DirectusAsesor
  ): string | null => {
    const roleLower = role.toLowerCase();

    if (ROLES_EXCLUSIVOS.includes(roleLower as RolExclusivo)) {
      const tiendaId =
        typeof asesor.tienda_id === "object"
          ? asesor.tienda_id.id
          : asesor.tienda_id;

      const rolExistente = empleadosAsignados.find(
        (e) =>
          e.cargoAsignado.toLowerCase() === roleLower && e.tiendaId === tiendaId
      );

      if (rolExistente) {
        return `Ya hay un ${roleLower} asignado para esta tienda: ${rolExistente.asesor.nombre}`;
      }
    }

    return null;
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleClearEmpleados = () => {
    setEmpleadosAsignados([]);
    setCodigoInput("");
    setCargoSeleccionado("");
    setError(null);
    setSuccess(null);
    // Focus en el input después de limpiar
    setTimeout(() => {
      codigoInputRef.current?.focus();
    }, 100);
  };

  const handleAddEmpleado = async (
    asesoresDisponibles: DirectusAsesor[],
    cargosDisponibles: DirectusCargo[]
  ) => {
    if (!codigoInput.trim()) return;

    const codigo = parseInt(codigoInput.trim());
    if (isNaN(codigo)) {
      setError("Código de asesor inválido");
      setMessageType("error");
      return;
    }

    const asesor = asesoresDisponibles.find(
      (a) => a.id === codigo || a.id.toString() === codigoInput.trim()
    );
    if (!asesor) {
      setError(`No se encontró empleado con código ${codigo}`);
      setMessageType("error");
      return;
    }

    if (empleadosAsignados.some((e) => e.asesor.id === asesor.id)) {
      setError("Este empleado ya está asignado para hoy");
      setMessageType("error");
      return;
    }

    // Validar roles exclusivos
    const exclusiveRoleError = validateExclusiveRole(cargoSeleccionado, asesor);
    if (exclusiveRoleError) {
      setError(exclusiveRoleError);
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const empleadosConNuevo = [
        ...empleadosAsignados.map((e) => ({
          asesor: e.asesor,
          cargoAsignado: e.cargoAsignado,
        })),
        { asesor, cargoAsignado: cargoSeleccionado },
      ];

      const fechaActual = new Date().toISOString().split("T")[0];
      const presupuestosCalculados = await calcularPresupuestosTodosEmpleados(
        empleadosConNuevo,
        fechaActual
      );

      if (presupuestosCalculados === null) {
        setError(
          "No se pudo calcular el presupuesto. Verifique que existan datos de tienda y porcentajes."
        );
        setMessageType("error");
        return;
      }

      const empleadosActualizados: EmpleadoAsignado[] = empleadosConNuevo.map(
        (empleadoConRol) => {
          let tiendaIdFinal: number;
          if (
            typeof empleadoConRol.asesor.tienda_id === "object" &&
            empleadoConRol.asesor.tienda_id !== null
          ) {
            tiendaIdFinal = empleadoConRol.asesor.tienda_id.id;
          } else {
            tiendaIdFinal = empleadoConRol.asesor.tienda_id as number;
          }

          return {
            asesor: empleadoConRol.asesor,
            presupuesto: presupuestosCalculados[empleadoConRol.asesor.id] || 0,
            tiendaId: tiendaIdFinal,
            cargoAsignado: empleadoConRol.cargoAsignado,
          };
        }
      );

      setEmpleadosAsignados(empleadosActualizados);

      // Limpiar input y mantener focus
      setCodigoInput("");

      // Focus en el input después de un breve delay
      setTimeout(() => {
        codigoInputRef.current?.focus();
      }, 100);

      // CAMBIO AUTOMÁTICO DEL SELECT: Si se asignó gerente o coadministrador, cambiar a asesor
      if (
        ROLES_EXCLUSIVOS.includes(
          cargoSeleccionado.toLowerCase() as RolExclusivo
        )
      ) {
        // Buscar cargo de asesor en los cargos filtrados
        const cargoAsesor = cargosDisponibles.find(
          (cargo) => cargo.nombre.toLowerCase() === "asesor"
        );
        if (cargoAsesor) {
          setCargoSeleccionado("asesor");
        }
      }

      // Mensaje de éxito
      setSuccess(` ${asesor.nombre} ha sido agregado a la lista`);
      setMessageType("success");
    } catch (err) {
      console.error("Error agregando empleado:", err);
      setError("Error al agregar el empleado");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveEmpleado = async (asesorId: number) => {
    try {
      const empleadosRestantes = empleadosAsignados
        .filter((e) => e.asesor.id !== asesorId)
        .map((e) => e.asesor);

      if (empleadosRestantes.length > 0) {
        const empleadosRestantesConRoles = empleadosRestantes.map(
          (empleado) => ({
            asesor: empleado,
            cargoAsignado: "asesor",
          })
        );

        const fechaActual = new Date().toISOString().split("T")[0];
        const presupuestosCalculados = await calcularPresupuestosTodosEmpleados(
          empleadosRestantesConRoles,
          fechaActual
        );

        if (presupuestosCalculados) {
          const empleadosActualizados: EmpleadoAsignado[] =
            empleadosRestantes.map((empleado) => ({
              asesor: empleado,
              presupuesto: presupuestosCalculados[empleado.id] || 0,
              tiendaId: empleado.tienda_id as number,
              cargoAsignado: "asesor",
            }));
          setEmpleadosAsignados(empleadosActualizados);
        } else {
          setEmpleadosAsignados((prev) =>
            prev.filter((e) => e.asesor.id !== asesorId)
          );
        }
      } else {
        setEmpleadosAsignados([]);
      }

      setError(null);
      setSuccess("Empleado removido de la asignación");
      setMessageType("success");
    } catch (err) {
      setError("Error al remover el empleado");
      setMessageType("error");
    }
  };

  const hasRequiredRoles = (): boolean => {
    return empleadosAsignados.some((empleado) =>
      ROLES_EXCLUSIVOS.includes(
        empleado.cargoAsignado.toLowerCase() as RolExclusivo
      )
    );
  };

  const handleSaveAsignaciones = async (
    fechaActual: string,
    cargosDisponibles: DirectusCargo[]
  ) => {
    if (empleadosAsignados.length === 0) {
      setError("Debe asignar al menos un empleado");
      setMessageType("error");
      return;
    }

    if (!hasRequiredRoles()) {
      setError("Debe asignar al menos un gerente o coadministrador");
      setMessageType("error");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const mapearCargoACargoId = (cargoAsignado: string): number => {
        const cargo = cargosDisponibles.find(
          (c) => c.nombre.toLowerCase() === cargoAsignado.toLowerCase()
        );
        return cargo?.id || 2;
      };

      const presupuestosParaGuardar = empleadosAsignados.map((empleado) => ({
        asesor: empleado.asesor.id,
        fecha: fechaActual,
        presupuesto: empleado.presupuesto,
        tienda_id: empleado.tiendaId,
        cargo: mapearCargoACargoId(empleado.cargoAsignado),
      }));

      const presupuestosGuardados = await guardarPresupuestosEmpleados(
        presupuestosParaGuardar
      );

      const ventasRealesEmpleados = await obtenerVentasEmpleados(
        undefined,
        fechaActual
      );

      const empleadosAsignadosIds = presupuestosGuardados.map(
        (p) => p.asesor as number
      );

      const ventasFiltradas = ventasRealesEmpleados.filter((venta) =>
        empleadosAsignadosIds.includes(venta.asesor_id as number)
      );

      if (ventasFiltradas.length > 0) {
        await guardarVentasEmpleados(ventasFiltradas);
      }

      setSuccess("Empleados asignados correctamente");
      setMessageType("success");
      onAssignmentComplete?.(ventasFiltradas);
    } catch (err) {
      console.error("Error al guardar las asignaciones:", err);
      setError("Error al guardar las asignaciones");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      // Este método se llamará con los datos necesarios desde el componente
    }
  };

  const getCargoNombre = (
    cargoId: any,
    cargosDisponibles: DirectusCargo[]
  ): string => {
    if (typeof cargoId === "object" && cargoId?.nombre) {
      return cargoId.nombre;
    }
    if (typeof cargoId === "number") {
      const cargo = cargosDisponibles.find(
        (c: DirectusCargo) => c.id === cargoId
      );
      return cargo?.nombre || "Asesor";
    }
    return "Asesor";
  };

  const getTiendaNombre = (tiendaId: any): string => {
    if (typeof tiendaId === "object" && tiendaId?.nombre) {
      return tiendaId.nombre;
    }
    if (typeof tiendaId === "number") {
      return `Tienda ${tiendaId}`;
    }
    return `Tienda ${tiendaId}`;
  };

  // Resetear estado cuando cambia la tienda
  useEffect(() => {
    if (tiendaUsuario) {
      setEmpleadosAsignados([]);
      setCodigoInput("");
      setError(null);
      setSuccess(null);
      setCargoSeleccionado("");
    }
  }, [tiendaUsuario]);

  // Focus inicial cuando se monta el componente
  useEffect(() => {
    if (tiendaUsuario && codigoInputRef.current) {
      codigoInputRef.current.focus();
    }
  }, [tiendaUsuario]);

  return {
    codigoInput,
    cargoSeleccionado,
    empleadosAsignados,
    loading,
    saving,
    error,
    success,
    messageType,
    canSave,
    setCodigoInput,
    setCargoSeleccionado,
    handleAddEmpleado,
    handleRemoveEmpleado,
    handleClearEmpleados,
    handleSaveAsignaciones,
    handleKeyPress,
    codigoInputRef,
    getCargoNombre,
    getTiendaNombre,
    validateExclusiveRole,
    hasRequiredRoles,
    clearMessages,
  };
};
