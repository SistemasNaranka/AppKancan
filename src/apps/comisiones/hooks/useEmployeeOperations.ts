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
  eliminarPresupuestosEmpleados,
} from "../api/directus/create";
import {
  obtenerPresupuestosDiarios,
  obtenerPresupuestosEmpleados,
  obtenerPorcentajesMensuales,
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
  hasExistingData: boolean;
  isUpdateMode: boolean;

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
  cargarDatosExistentes: (
    fecha: string,
    mesSeleccionado?: string,
    asesoresDisponibles?: DirectusAsesor[]
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
  const [hasExistingData, setHasExistingData] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);

  // Ref para mantener focus en el input
  const codigoInputRef = useRef<HTMLInputElement>(null);

  // Validar si puede guardar (debe tener al menos un gerente o coadministrador)
  useEffect(() => {
    const hasManagerOrCoadmin = empleadosAsignados.some((empleado) =>
      ROLES_EXCLUSIVOS.includes(
        empleado.cargoAsignado.toLowerCase() as RolExclusivo
      )
    );

    // Si ya hay datos existentes del día, no se puede guardar (solo actualizar)
    const newCanSave =
      hasManagerOrCoadmin && empleadosAsignados.length > 0 && !hasExistingData;

    // Solo actualizar si el valor realmente cambió
    if (canSave !== newCanSave) {
      console.log(
        "🔄 Actualizando canSave:",
        newCanSave,
        "empleados:",
        empleadosAsignados.length,
        "hasExistingData:",
        hasExistingData
      );
      setCanSave(newCanSave);
    }
  }, [empleadosAsignados, hasExistingData]);

  // 🚀 NUEVO: Cargar datos existentes para edición (solo del día actual)
  const cargarDatosExistentes = async (
    fecha: string,
    mesSeleccionado?: string,
    asesoresDisponibles?: DirectusAsesor[]
  ) => {
    if (!tiendaUsuario) {
      console.log("No hay tienda de usuario para cargar datos existentes");
      return;
    }

    try {
      console.log(
        "Cargando datos existentes para tienda:",
        tiendaUsuario.id,
        "fecha:",
        fecha,
        "mes:",
        mesSeleccionado
      );
      setLoading(true);
      setError(null);

      // Obtener presupuestos existentes para la tienda y fecha específica
      const datosExistentes = await obtenerPresupuestosEmpleados(
        tiendaUsuario.id,
        fecha,
        mesSeleccionado // Pasar el mes seleccionado para filtrar correctamente
      );

      console.log("Datos existentes encontrados:", datosExistentes.length);

      // Filtrar solo los datos del día específico (no de días anteriores)
      const empleadosHoy = datosExistentes.filter((dato) => {
        return dato.fecha === fecha;
      });

      console.log("Empleados del día de hoy:", empleadosHoy.length);

      if (empleadosHoy.length > 0) {
        // Convertir datos existentes al formato de empleadosAsignados
        const empleadosExistentes: EmpleadoAsignado[] = empleadosHoy.map(
          (dato) => {
            // Buscar el empleado real en la lista de asesores disponibles
            const empleadoReal = asesoresDisponibles?.find(
              (asesor) => asesor.id === dato.asesor
            );

            // Crear un asesor con información real o fallback
            const asesor = empleadoReal || {
              id: dato.asesor,
              nombre: `Empleado ${dato.asesor}`,
              documento: 0,
              tienda_id: dato.tienda_id,
              cargo_id: dato.cargo,
            };

            // Obtener nombre del cargo (usaremos una función simple)
            const getNombreCargoSimple = (cargoId: number): string => {
              const cargoMap: { [key: number]: string } = {
                1: "Gerente",
                2: "Asesor",
                3: "Cajero",
                4: "Logístico",
              };
              return cargoMap[cargoId] || "Asesor";
            };

            return {
              asesor,
              presupuesto: dato.presupuesto,
              tiendaId: dato.tienda_id,
              cargoAsignado: getNombreCargoSimple(dato.cargo),
            };
          }
        );

        console.log(
          "Empleados existentes cargados:",
          empleadosExistentes.length
        );
        setEmpleadosAsignados(empleadosExistentes);
        setHasExistingData(true);
        setIsUpdateMode(true);
        // QUIETO: No mostrar mensaje al cargar datos existentes automáticamente
        // setSuccess(`Se cargaron ${empleadosExistentes.length} empleados del día de hoy`);
        // setMessageType("info");
      } else {
        console.log("No se encontraron empleados para el día de hoy");
        // Solo limpiar si no hay datos existentes
        setEmpleadosAsignados([]);
        setHasExistingData(false);
        setIsUpdateMode(false);
        // QUIETO: No mostrar mensaje al cargar datos existentes automáticamente
        // setSuccess("No hay empleados asignados para el día de hoy");
        // setMessageType("info");
      }
    } catch (error) {
      console.error("Error al cargar datos existentes:", error);
      setError("Error al cargar datos existentes");
      setMessageType("error");
      setHasExistingData(false);
      setIsUpdateMode(false);
    } finally {
      setLoading(false);
    }
  };

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
    setHasExistingData(false);
    setIsUpdateMode(false);
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
          // Usar la tienda actual donde se está trabajando, no la tienda base del empleado
          if (!tiendaUsuario) {
            console.error(
              "tiendaUsuario es null, no se puede procesar el empleado"
            );
            throw new Error("No se tiene la tienda del usuario");
          }

          const tiendaIdFinal = tiendaUsuario.id;

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
              tiendaId: tiendaUsuario?.id || (empleado.tienda_id as number),
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
      console.log("🚀 Iniciando guardado de asignaciones...");
      setSaving(true);
      setError(null);

      const mapearCargoACargoId = (cargoAsignado: string): number => {
        const cargo = cargosDisponibles.find(
          (c) => c.nombre.toLowerCase() === cargoAsignado.toLowerCase()
        );
        return cargo?.id || 2;
      };

      // Eliminar datos existentes del mismo día antes de guardar
      if (tiendaUsuario) {
        console.log("🗑️ Eliminando datos existentes del día...");
        try {
          await eliminarPresupuestosEmpleados(tiendaUsuario.id, fechaActual);
        } catch (eliminarError) {
          console.log(
            "⚠️ No se pudieron eliminar datos existentes, continuando con el guardado:",
            eliminarError
          );
          // Continuar con el guardado aunque no se puedan eliminar los datos existentes
        }
      }

      // Preparar datos para guardar
      const presupuestosParaGuardar = empleadosAsignados.map((empleado) => ({
        asesor: empleado.asesor.id,
        fecha: fechaActual,
        presupuesto: empleado.presupuesto,
        tienda_id: empleado.tiendaId,
        cargo: mapearCargoACargoId(empleado.cargoAsignado),
      }));

      console.log(
        "💾 Guardando presupuestos en la BD...",
        presupuestosParaGuardar
      );

      // ✅ ESTA ES LA LÍNEA QUE FALTABA - GUARDAR EN LA BASE DE DATOS
      console.log("💾 Intentando guardar presupuestos en la BD...");
      await guardarPresupuestosEmpleados(presupuestosParaGuardar);

      console.log("✅ Presupuestos guardados exitosamente");

      // Mostrar mensaje de éxito
      setSuccess("Empleados asignados correctamente");
      setMessageType("success");

      // Resetear estados de datos existentes después de guardar exitosamente
      setHasExistingData(false);
      setIsUpdateMode(false);

      // ❌ NO llamar onAssignmentComplete aquí
      // El modal lo hará después de cerrarse
    } catch (err) {
      console.error("❌ Error al guardar las asignaciones:", err);

      // Verificar si es error de permisos
      const errorMessage =
        (err as any)?.message || (err as any)?.toString() || "";
      if (
        errorMessage.includes("permission") ||
        errorMessage.includes("doesn't have permission")
      ) {
        setError(
          "Error de permisos: No tiene autorización para guardar asignaciones. Contacte al administrador."
        );
      } else {
        setError("Error al guardar las asignaciones: " + errorMessage);
      }
      setMessageType("error");

      // 🔧 CORRECCIÓN: Relanzar el error para que el componente padre lo detecte
      throw err;
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

  // Resetear estado cuando cambia la tienda (solo si es una tienda diferente)
  useEffect(() => {
    if (tiendaUsuario) {
      // Solo resetear si no hay empleados ya cargados o si es una tienda diferente
      const shouldReset =
        empleadosAsignados.length === 0 ||
        !empleadosAsignados[0] ||
        empleadosAsignados[0].tiendaId !== tiendaUsuario.id;

      if (shouldReset) {
        console.log("Reseteando estado para nueva tienda:", tiendaUsuario.id);
        setEmpleadosAsignados([]);
        setCodigoInput("");
        setError(null);
        setSuccess(null);
        setCargoSeleccionado("");
        setHasExistingData(false);
        setIsUpdateMode(false);
      }
    }
  }, [
    tiendaUsuario,
    empleadosAsignados.length,
    empleadosAsignados[0]?.tiendaId,
  ]);

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
    hasExistingData,
    isUpdateMode,
    setCodigoInput,
    setCargoSeleccionado,
    handleAddEmpleado,
    handleRemoveEmpleado,
    handleClearEmpleados,
    handleSaveAsignaciones,
    handleKeyPress,
    cargarDatosExistentes,
    codigoInputRef,
    getCargoNombre,
    getTiendaNombre,
    validateExclusiveRole,
    hasRequiredRoles,
    clearMessages,
  };
};
