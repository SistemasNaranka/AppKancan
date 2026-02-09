import { useState, useEffect, useRef, useMemo } from "react";
import {
  DirectusAsesor,
  DirectusCargo,
  DirectusTienda,
  EmpleadoAsignado,
  ROLES_EXCLUSIVOS,
  RolExclusivo,
} from "../types/modal";
import { DirectusPresupuestoDiarioEmpleado } from "../types";
import { ROLES_REQUERIDOS } from "../types/modal";
import {
  guardarPresupuestosEmpleados,
  eliminarPresupuestosEmpleados,
  actualizarPresupuestoEmpleado,
  eliminarPresupuestoEmpleado,
} from "../api/directus/create";
import {
  obtenerPresupuestosDiarios,
  obtenerPresupuestosEmpleados,
  obtenerPorcentajesMensuales,
  obtenerAsesores,
  obtenerCargos,
} from "../api/directus/read";
import { calculateBudgetsWithFixedDistributive } from "../lib/calculations.budgets";
import { getFechaActual } from "../lib/modalHelpers";

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
  hasChanges: boolean; // 🔧 NUEVO: Dirty check

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
    asesoresDisponibles?: DirectusAsesor[],
    cargosDisponibles?: DirectusCargo[]
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
  // 🔧 NUEVO: Estado original para dirty check
  const [empleadosOriginal, setEmpleadosOriginal] = useState<
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

  // 🚀 NUEVO: Estado para configuración del botón
  const [buttonConfig, setButtonConfig] = useState({
    text: "Guardar",
    action: "save",
    disabled: false,
  });

  // ✅ NUEVA VALIDACIÓN: Debe tener al menos un gerente/coadministrador/gerente online Y un asesor
  useEffect(() => {
    const hasManagerOrCoadminOrGerenteOnline = empleadosAsignados.some(
      (empleado) => {
        const rolLower = empleado.cargoAsignado.toLowerCase();
        return (
          ROLES_EXCLUSIVOS.includes(rolLower as RolExclusivo) ||
          rolLower === "gerente online"
        );
      }
    );
    const hasAsesor = empleadosAsignados.some(
      (empleado) => empleado.cargoAsignado.toLowerCase() === "asesor"
    );

    // ✅ NUEVA LÓGICA: Determinar texto del botón
    let newButtonConfig = {
      text: hasExistingData ? "Actualizar" : "Guardar",
      action: hasExistingData ? "update" : "save",
      disabled:
        !(hasManagerOrCoadminOrGerenteOnline && hasAsesor) ||
        empleadosAsignados.length === 0,
    };

    const newCanSave =
      hasManagerOrCoadminOrGerenteOnline &&
      hasAsesor &&
      empleadosAsignados.length > 0;

    // Solo actualizar si el valor realmente cambió
    if (canSave !== newCanSave) {
      setCanSave(newCanSave);
    }

    // Actualizar configuración del botón
    if (JSON.stringify(buttonConfig) !== JSON.stringify(newButtonConfig)) {
      setButtonConfig(newButtonConfig);
    }
  }, [empleadosAsignados, hasExistingData, canSave, buttonConfig]);

  // 🔧 NUEVO: Dirty check - detectar si hay cambios respecto al estado original
  const hasChanges = useMemo(() => {
    // Si no hay datos originales, siempre hay "cambios" (modo creación)
    if (empleadosOriginal.length === 0 && empleadosAsignados.length > 0) {
      return true;
    }
    
    // Si no hay datos originales ni actuales, no hay cambios
    if (empleadosOriginal.length === 0 && empleadosAsignados.length === 0) {
      return false;
    }

    // Comparar cantidades
    if (empleadosOriginal.length !== empleadosAsignados.length) {
      console.log(`🔍 [useEmployeeOperations] hasChanges=true (cantidad diferente: ${empleadosOriginal.length} vs ${empleadosAsignados.length})`);
      return true;
    }

    // Comparar IDs de empleados
    const originalIds = new Set(empleadosOriginal.map(e => e.asesor.id));
    const currentIds = new Set(empleadosAsignados.map(e => e.asesor.id));

    // Verificar si hay empleados agregados o eliminados
    const hasAdded = empleadosAsignados.some(e => !originalIds.has(e.asesor.id));
    const hasRemoved = empleadosOriginal.some(e => !currentIds.has(e.asesor.id));

    // Verificar cambios de rol
    const hasRoleChange = empleadosAsignados.some(current => {
      const original = empleadosOriginal.find(o => o.asesor.id === current.asesor.id);
      return original && original.cargoAsignado !== current.cargoAsignado;
    });

    const changesDetected = hasAdded || hasRemoved || hasRoleChange;
    if (changesDetected) {
      console.log(`🔍 [useEmployeeOperations] hasChanges=true (added: ${hasAdded}, removed: ${hasRemoved}, roleChange: ${hasRoleChange})`);
    }

    return changesDetected;
  }, [empleadosAsignados, empleadosOriginal]);

  // 🚀 NUEVO: Cargar datos existentes para edición (solo del día actual)
  const cargarDatosExistentes = async (
    fecha: string,
    mesSeleccionado?: string,
    asesoresDisponibles?: DirectusAsesor[],
    cargosDisponibles?: DirectusCargo[]
  ) => {
    if (!tiendaUsuario) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Obtener presupuestos existentes para la tienda y fecha específica
      const datosExistentes = await obtenerPresupuestosEmpleados(
        tiendaUsuario.id,
        fecha,
        mesSeleccionado // Pasar el mes seleccionado para filtrar correctamente
      );

      // Filtrar solo los datos del día específico (no de días anteriores)
      const empleadosHoy = datosExistentes.filter((dato) => {
        return dato.fecha === fecha;
      });

      if (empleadosHoy.length > 0) {
        // ✅ CORRECCIÓN: Obtener lista completa de asesores SIEMPRE antes de procesar datos
        let asesoresCompletos = asesoresDisponibles;
        if (!asesoresCompletos || asesoresCompletos.length === 0) {
          try {
            asesoresCompletos = await obtenerAsesores();
          } catch (error) {
            console.warn("No se pudo cargar la lista de asesores:", error);
            asesoresCompletos = [];
          }
        }

        // ✅ CORRECCIÓN: Obtener lista de cargos SIEMPRE antes de procesar datos
        let cargosCompletos = cargosDisponibles;
        if (!cargosCompletos || cargosCompletos.length === 0) {
          try {
            cargosCompletos = await obtenerCargos();
          } catch (error) {
            console.warn("No se pudo cargar la lista de cargos:", error);
            cargosCompletos = [];
          }
        }

        // Convertir datos existentes al formato de empleadosAsignados
        const empleadosExistentes: EmpleadoAsignado[] = empleadosHoy.map(
          (dato) => {
            // Buscar el empleado real en la lista de asesores disponibles
            const empleadoReal = asesoresCompletos?.find(
              (asesor) => asesor.id === dato.asesor
            );

            // ✅ MEJORADO: Crear asesor con información completa preservada
            const asesor: DirectusAsesor = empleadoReal || {
              id: dato.asesor,
              nombre: `Empleado ${dato.asesor}`, // Mantener formato consistente
              documento: 0,
              tienda_id: dato.tienda_id,
              cargo_id: dato.cargo,
            };

            // ✅ CORRECCIÓN: Obtener nombre del cargo desde la base de datos
            const getNombreCargoReal = (
              cargoId: number,
              cargosDisponibles: DirectusCargo[]
            ): string => {
              const cargo = cargosDisponibles.find((c) => c.id === cargoId);
              const nombreCargo = cargo?.nombre || "Asesor";
              return nombreCargo;
            };

            // ✅ PRESERVAR INFORMACIÓN COMPLETA incluyendo presupuesto
            return {
              asesor,
              presupuesto: dato.presupuesto || 0, // ✅ ASEGURAR QUE NO SEA 0
              tiendaId: dato.tienda_id,
              cargoAsignado: getNombreCargoReal(
                dato.cargo,
                cargosCompletos || []
              ),
            };
          }
        );

        // ✅ MEJORADO: Actualizar estados con lógica más robusta
        setEmpleadosAsignados(empleadosExistentes);
        // 🔧 GUARDAR estado original para dirty check
        setEmpleadosOriginal(empleadosExistentes);
        console.log(`📋 [useEmployeeOperations] Estado original guardado: ${empleadosExistentes.length} empleados`);
        setHasExistingData(true);
        setIsUpdateMode(true);

        // QUIETO: No mostrar mensaje al cargar datos existentes automáticamente
        // setSuccess(`Se cargaron ${empleadosExistentes.length} empleados del día de hoy`);
        // setMessageType("info");
      } else {
        // ✅ MEJORADO: Solo limpiar estados si no hay datos existentes
        // NO limpiar empleadosAsignados si ya hay datos cargados (evita pérdida de datos temporales)
        if (empleadosAsignados.length === 0) {
          setEmpleadosAsignados([]);
          setHasExistingData(false);
          setIsUpdateMode(false);
        } else {
          // Si hay empleados cargados pero no hay datos para la fecha específica,
          // mantener los empleados temporales pero marcar que no hay datos guardados
          setHasExistingData(false);
          setIsUpdateMode(false);
        }

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
        gerente: empleadosConRoles.filter(
          (e) => e.cargoAsignado.toLowerCase() === "gerente"
        ).length,
        asesor: empleadosConRoles.filter(
          (e) => e.cargoAsignado.toLowerCase() === "asesor"
        ).length,
        coadministrador: empleadosConRoles.filter(
          (e) => e.cargoAsignado.toLowerCase() === "coadministrador"
        ).length,
        cajero: empleadosConRoles.filter(
          (e) => e.cargoAsignado.toLowerCase() === "cajero"
        ).length,
        logistico: empleadosConRoles.filter(
          (e) => e.cargoAsignado.toLowerCase() === "logistico"
        ).length,
        gerente_online: empleadosConRoles.filter(
          (e) => e.cargoAsignado.toLowerCase() === "gerente online"
        ).length,
      };

      empleadosConRoles.forEach((e, i) => {
        // Log de depuración removido para limpieza
      });

      const presupuestosPorRol = calculateBudgetsWithFixedDistributive(
        presupuestoTienda,
        porcentajeConfig,
        empleadosPorRol
      );

      // ✅ DEBUG: Mostrar todos los presupuestos calculados

      const presupuestos: { [asesorId: number]: number } = {};

      empleadosConRoles.forEach((empleadoConRol) => {
        const rolLower = empleadoConRol.cargoAsignado.toLowerCase();

        if (
          rolLower === "gerente" ||
          rolLower === "asesor" ||
          rolLower === "coadministrador" ||
          rolLower === "cajero" ||
          rolLower === "logistico" ||
          rolLower === "gerente online"
        ) {
          // ✅ NUEVA LÓGICA: Para cajero, logístico y gerente online, asignar siempre presupuesto de 1
          if (
            rolLower === "cajero" ||
            rolLower === "logistico" ||
            rolLower === "gerente online"
          ) {
            presupuestos[empleadoConRol.asesor.id] = 1;
          } else {
            // Lógica original para otros roles
            const cantidadEmpleadosRol =
              empleadosPorRol[rolLower as keyof typeof empleadosPorRol];
            const presupuestoRolTotal =
              presupuestosPorRol[rolLower as keyof typeof presupuestosPorRol];
            const presupuestoIndividual =
              cantidadEmpleadosRol > 0
                ? Math.round(presupuestoRolTotal / cantidadEmpleadosRol)
                : 0;

            presupuestos[empleadoConRol.asesor.id] = presupuestoIndividual;
          }
          // Rol válido - presupuesto asignado arriba
        } else {
          // Rol desconocido - usar presupuesto por defecto
        }
      });

      return presupuestos;
    } catch (err) {
      return null;
    }
  };

  // ✅ CORRECCIÓN 3: Función para calcular presupuesto total de la tienda
  const calcularPresupuestoTotalTienda = (
    empleados: EmpleadoAsignado[]
  ): number => {
    return empleados.reduce(
      (total, empleado) => total + (empleado.presupuesto || 0),
      0
    );
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

      const fechaActual = getFechaActual();
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
    // ✅ SOLUCIÓN AL PROBLEMA: Permitir eliminar empleados sin restricciones para evitar el bucle
    const empleadoAEliminar = empleadosAsignados.find(
      (e) => e.asesor.id === asesorId
    );

    if (!empleadoAEliminar) {
      setError("Empleado no encontrado");
      setMessageType("error");
      return;
    }

    try {
      // ✅ CORRECCIÓN 1: Mantener roles originales de cada empleado
      const empleadosRestantes = empleadosAsignados.filter(
        (e) => e.asesor.id !== asesorId
      );

      if (empleadosRestantes.length > 0) {
        // ✅ MANTENER ROLES ORIGINALES - NO CAMBIAR TODO A "ASESOR"
        const empleadosRestantesConRoles = empleadosRestantes.map(
          (empleado) => ({
            asesor: empleado.asesor,
            cargoAsignado: empleado.cargoAsignado, // ← MANTENER ROL ORIGINAL
          })
        );

        const fechaActual = getFechaActual();
        const presupuestosCalculados = await calcularPresupuestosTodosEmpleados(
          empleadosRestantesConRoles,
          fechaActual
        );

        if (presupuestosCalculados) {
          const empleadosActualizados: EmpleadoAsignado[] =
            empleadosRestantes.map((empleado) => ({
              asesor: empleado.asesor,
              presupuesto: presupuestosCalculados[empleado.asesor.id] || 0,
              tiendaId:
                tiendaUsuario?.id || (empleado.asesor.tienda_id as number),
              cargoAsignado: empleado.cargoAsignado, // ← MANTENER ROL ORIGINAL
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
    const hasManagerOrCoadminOrGerenteOnline = empleadosAsignados.some(
      (empleado) => {
        const rolLower = empleado.cargoAsignado.toLowerCase();
        return (
          ROLES_EXCLUSIVOS.includes(rolLower as RolExclusivo) ||
          rolLower === "gerente online"
        );
      }
    );
    const hasAsesor = empleadosAsignados.some(
      (empleado) => empleado.cargoAsignado.toLowerCase() === "asesor"
    );

    return hasManagerOrCoadminOrGerenteOnline && hasAsesor;
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
      setError(
        "Debe asignar al menos un gerente/coadministrador/gerente online Y un asesor"
      );
      setMessageType("error");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // ✅ MEJORADO: Recálculo preservando información completa de empleados
      const empleadosConRoles = empleadosAsignados.map((e) => ({
        asesor: e.asesor,
        cargoAsignado: e.cargoAsignado,
      }));

      const presupuestosRecalculados = await calcularPresupuestosTodosEmpleados(
        empleadosConRoles,
        fechaActual
      );

      if (presupuestosRecalculados === null) {
        setError("No se pudo recalcular el presupuesto");
        setMessageType("error");
        return;
      }

      // ✅ PRESERVAR Y ACTUALIZAR EMPLEADOS CON INFORMACIÓN COMPLETA
      const empleadosActualizados: EmpleadoAsignado[] = empleadosAsignados.map(
        (empleado) => {
          const nuevoPresupuesto = presupuestosRecalculados[empleado.asesor.id];

          return {
            ...empleado, // ✅ PRESERVAR TODA LA INFORMACIÓN EXISTENTE
            presupuesto: nuevoPresupuesto || 0, // Solo actualizar el presupuesto
          };
        }
      );

      const mapearCargoACargoId = (cargoAsignado: string): number => {
        // Buscar coincidencia exacta primero
        let cargo = cargosDisponibles.find(
          (c) => c.nombre.toLowerCase() === cargoAsignado.toLowerCase()
        );

        // Si no encuentra coincidencia exacta, buscar coincidencia parcial
        if (!cargo) {
          cargo = cargosDisponibles.find((c) => {
            const cargoNombre = c.nombre.toLowerCase();
            const busqueda = cargoAsignado.toLowerCase();
            return (
              cargoNombre.includes(busqueda) || busqueda.includes(cargoNombre)
            );
          });
        }

        // Si es "Gerente Online" y no se encuentra, intentar crear mapeo manual
        if (!cargo && cargoAsignado.toLowerCase() === "gerente online") {
          // Buscar por palabras clave
          const cargoGerenteOnline = cargosDisponibles.find(
            (c) =>
              c.nombre.toLowerCase().includes("gerente") &&
              c.nombre.toLowerCase().includes("online")
          );

          if (cargoGerenteOnline) {
            return cargoGerenteOnline.id;
          }
        }

        return cargo?.id || 2;
      };

      // ✅ NUEVA LÓGICA: Operaciones individuales en lugar de borrar todo y crear de nuevo
      // Obtener empleados existentes para comparar
      const empleadosExistentes = await obtenerPresupuestosEmpleados(
        tiendaUsuario!.id,
        fechaActual
      );
      const existentesFiltrados = empleadosExistentes.filter(
        (e) => e.fecha === fechaActual
      );

      // Crear mapa de existentes por asesor ID
      const mapaExistentes = new Map<
        number,
        { id: number; presupuesto: number; cargo: number }
      >();
      existentesFiltrados.forEach((e) => {
        mapaExistentes.set(e.asesor, {
          id: e.id,
          presupuesto: e.presupuesto,
          cargo: e.cargo,
        });
      });

      // Arrays para operaciones
      const paraInsertar: Omit<DirectusPresupuestoDiarioEmpleado, "id">[] = [];
      const paraActualizar: { id: number; presupuesto: number }[] = [];
      const paraEliminar: number[] = [];

      // Procesar empleados actuales
      empleadosActualizados.forEach((empleado) => {
        const existente = mapaExistentes.get(empleado.asesor.id);

        if (existente) {
          // Existe, verificar si cambió el presupuesto
          if (existente.presupuesto !== empleado.presupuesto) {
            paraActualizar.push({
              id: existente.id,
              presupuesto: empleado.presupuesto,
            });
          }
          // Marcar como procesado (eliminar del mapa)
          mapaExistentes.delete(empleado.asesor.id);
        } else {
          // Nuevo, insertar
          paraInsertar.push({
            asesor: empleado.asesor.id,
            fecha: fechaActual,
            presupuesto: empleado.presupuesto,
            tienda_id: empleado.tiendaId,
            cargo: mapearCargoACargoId(empleado.cargoAsignado),
          });
        }
      });

      // Los que quedan en mapaExistentes se eliminan
      mapaExistentes.forEach((value) => {
        paraEliminar.push(value.id);
      });

      // Ejecutar operaciones
      if (paraInsertar.length > 0) {
        await guardarPresupuestosEmpleados(paraInsertar);
      }

      for (const update of paraActualizar) {
        await actualizarPresupuestoEmpleado(update.id, update.presupuesto);
      }

      for (const id of paraEliminar) {
        await eliminarPresupuestoEmpleado(id);
      }

      // ✅ CORRECCIÓN 3: Calcular y mostrar presupuesto total de la tienda
      const presupuestoTotal = calcularPresupuestoTotalTienda(
        empleadosActualizados
      );

      // Mostrar mensaje de éxito con presupuesto total
      const mensajeExito = hasExistingData
        ? `Asignación actualizada correctamente (${
            empleadosActualizados.length
          } empleados, Total: ${presupuestoTotal.toLocaleString()})`
        : `Empleados asignados correctamente (${
            empleadosActualizados.length
          } empleados, Total: ${presupuestoTotal.toLocaleString()})`;

      setSuccess(mensajeExito);
      setMessageType("success");

      // ✅ MEJORADO: Actualizar estado local con empleados actualizados después del guardado exitoso
      setEmpleadosAsignados(empleadosActualizados);

      // 🚀 CORRECCIÓN: NO actualizar estado global inmediatamente con datos parciales
      // Esto causaba valores incorrectos porque faltaban datos completos para los cálculos
      // En su lugar, el modal padre se encargará de recargar los datos completos

      // ✅ CORREGIDO: NO resetear hasExistingData e isUpdateMode inmediatamente
      // Estos estados deben mantenerse para que el modal sepa que hay datos guardados
      // Se resetearán solo cuando se carguen nuevos datos o se limpie manualmente
      // setHasExistingData(false);
      // setIsUpdateMode(false);

      // ✅ MEJORADO: Mantener estados de datos existentes después del guardado
      // Esto permite que cuando se reabra el modal, sepa que hay datos guardados

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
      const nombre = cargo?.nombre || "Asesor";
      return nombre;
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
    hasChanges, // 🔧 NUEVO: Dirty check
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
