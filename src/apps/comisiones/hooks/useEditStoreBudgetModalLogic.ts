import { useState, useEffect, useMemo } from "react";
import {
  obtenerEmpleadosPorFechaExacta,
  obtenerAsesores,
  obtenerCargos,
  obtenerPresupuestosDiarios,
  obtenerPorcentajesMensuales,
  obtenerPresupuestosEmpleados,
} from "../api/directus/read";
import { calculateBudgetsWithFixedDistributive } from "../lib/calculations.budgets";
import {
  guardarPresupuestosEmpleados,
  eliminarPresupuestosEmpleados,
} from "../api/directus/create";
import { obtenerTiendas } from "../api/directus/read";
import dayjs from "dayjs";
import "dayjs/locale/es";
import localizedFormat from "dayjs/plugin/localizedFormat";

dayjs.locale("es");
dayjs.extend(localizedFormat);

interface UseEditStoreBudgetModalLogicProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveComplete?: () => void;
  selectedMonth?: string;
}
 
export const useEditStoreBudgetModalLogic = ({
  isOpen,
  onSaveComplete,
}: UseEditStoreBudgetModalLogicProps) => {
  // Estados principales
  const [fecha, setFecha] = useState<string>(() => {
    const saved = localStorage.getItem("modalFecha");
    return saved || new Date().toISOString().split("T")[0];
  });
  const [tiendaId, setTiendaId] = useState<number | null>(null);
  const [tiendaNombre, setTiendaNombre] = useState<string>("");
  const [cargoSeleccionado, setCargoSeleccionado] = useState<number | "">("");
  const [codigoEmpleado, setCodigoEmpleado] = useState("");
  const [empleadoEncontrado, setEmpleadoEncontrado] = useState<any | null>(
    null,
  );
  const [empleadosAsignados, setEmpleadosAsignados] = useState<any[]>([]);

  // 🔧 NUEVO: Estado original para dirty check
  const [empleadosAsignadosOriginal, setEmpleadosAsignadosOriginal] = useState<any[]>([]);

  // Datos de catálogos
  const [todosEmpleados, setTodosEmpleados] = useState<any[]>([]);
  const [cargos, setCargos] = useState<any[]>([]);
  const [tiendas, setTiendas] = useState<any[]>([]); // NUEVO

  // Estados UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Estado para días sin presupuesto
  const [diasSinPresupuesto, setDiasSinPresupuesto] = useState<string[]>([]);
  const [diasConPresupuestoCero, setDiasConPresupuestoCero] = useState<string[]>([]); // NUEVO
  const [diasConAsignacion, setDiasConAsignacion] = useState<string[]>([]); // NUEVO
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  // Cargar catálogos al abrir modal
  useEffect(() => {
    if (isOpen) {
      loadCatalogos();
    }
  }, [isOpen]);

  // Resetear formulario al cerrar modal
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Al abrir el modal, obtener la tienda del usuario
  useEffect(() => {
    if (isOpen) {
      loadTiendaUsuario();
    }
  }, [isOpen]);

  // Cargar empleados asignados cuando cambian fecha o tienda
  useEffect(() => {
    if (isOpen && fecha && tiendaId) {
      loadEmpleadosAsignados();
      loadDiasSinPresupuesto();
    } else if (!isOpen) {
      setEmpleadosAsignados([]);
      setDiasSinPresupuesto([]);
      setDiasConPresupuestoCero([]);
      setDiasConAsignacion([]);
    }
  }, [isOpen, fecha, tiendaId]);

  // Función para cargar días sin presupuesto del mes actual
  const loadDiasSinPresupuesto = async () => {
    if (!tiendaId || !fecha) {
      setDiasSinPresupuesto([]);
      setDiasConPresupuestoCero([]);
      return;
    }

    try {
      const fechaObj = dayjs(fecha);
      const mesSeleccionado = fechaObj.format("MMM YYYY");
      const startOfMonth = fechaObj.startOf("month").format("YYYY-MM-DD");
      const endOfMonth = fechaObj.endOf("month").format("YYYY-MM-DD");

      // 1. Obtener presupuestos de empleados (para saber qué días ya tienen asesores)
      const [presupuestosMes, presupuestosCasa] = await Promise.all([
        obtenerPresupuestosEmpleados(tiendaId, undefined, mesSeleccionado),
        obtenerPresupuestosDiarios(tiendaId, startOfMonth, endOfMonth)
      ]);

      // 2. Calcular todos los días del mes
      const diasDelMes = [];
      const diasEnMes = fechaObj.daysInMonth();
      for (let i = 1; i <= diasEnMes; i++) {
        const fechaDia = fechaObj.date(i).format("YYYY-MM-DD");
        diasDelMes.push(fechaDia);
      }

      // 3. Identificar días con presupuesto casa configurado (> 0)
      const diasConMetaValida = new Set(
        presupuestosCasa
          .filter(p => (p.presupuesto || 0) > 0)
          .map(p => p.fecha)
      );

      // 4. Los días RESTRICTIVOS son aquellos que NO tienen meta válida
      const restrictedDays = diasDelMes.filter(dia => !diasConMetaValida.has(dia));
      setDiasConPresupuestoCero(restrictedDays);

      // 5. Filtrar días que NO tienen presupuesto de empleados asignado
      const diasConAsignacionSet = new Set(presupuestosMes.map((p: any) => p.fecha));
      setDiasConAsignacion(Array.from(diasConAsignacionSet)); // Guardar array

      const fechaActual = dayjs().format("YYYY-MM-DD");

      const diasSinPresupuestoCalculado = diasDelMes.filter(
        (dia) =>
          !diasConAsignacionSet.has(dia) &&
          dia <= fechaActual &&
          diasConMetaValida.has(dia)
      );

      setDiasSinPresupuesto(diasSinPresupuestoCalculado);
    } catch (err) {
      console.error("Error al cargar días sin presupuesto:", err);
    }
  };

  // Guardar fecha en localStorage cuando cambia
  useEffect(() => {
    localStorage.setItem("modalFecha", fecha);
  }, [fecha]);

  // Buscar empleado automáticamente cuando se escribe código
  useEffect(() => {
    // Solo buscar si ya se cargaron los empleados
    if (codigoEmpleado.length >= 1 && todosEmpleados.length > 0) {
      buscarEmpleadoPorCodigo();
    } else if (codigoEmpleado.length === 0) {
      setEmpleadoEncontrado(null);
      setError(""); // Limpiar error al borrar
    }
  }, [codigoEmpleado, todosEmpleados]);

  const loadTiendaUsuario = async () => {
    try {
      const tiendasData = await obtenerTiendas();
      setTiendas(tiendasData);

      if (tiendasData.length > 0) {
        // Si ya hay una seleccionada (en el estado local o previo), mantenerla
        // de lo contrario, usar la primera
        if (!tiendaId) {
          setTiendaId(tiendasData[0].id);
          setTiendaNombre(tiendasData[0].nombre);
        }
      } else {
        setError("No tienes tiendas asignadas.");
      }
    } catch (err: any) {
      console.error("Error al cargar tienda del usuario:", err);
      setError("Error al cargar tienda: " + err.message);
    }
  };

  const handleTiendaChange = (id: number) => {
    const tienda = tiendas.find(t => t.id === id);
    if (tienda) {
      setTiendaId(tienda.id);
      setTiendaNombre(tienda.nombre);
    }
  };

  const resetForm = () => {
    // Siempre usar la fecha actual, independientemente de selectedMonth
    setFecha(new Date().toISOString().split("T")[0]);
    // No resetear tiendaId ni tiendaNombre ya que son del usuario

    // Default to Asesor if available
    const cargoAsesor = cargos.find((c) => c.nombre.toLowerCase() === "asesor");
    setCargoSeleccionado(cargoAsesor ? cargoAsesor.id : "");

    setCodigoEmpleado("");
    setEmpleadoEncontrado(null);
    setEmpleadosAsignados([]);
    // 🔧 LIMPIAR estado original para dirty check
    setEmpleadosAsignadosOriginal([]);
    setDiasSinPresupuesto([]);
    setDiasConPresupuestoCero([]);
    setDiasConAsignacion([]);
    setError("");
    setSuccess("");
  };

  const loadCatalogos = async () => {
    try {
      setLoading(true);
      const [empleadosData, cargosData] = await Promise.all([
        obtenerAsesores(),
        obtenerCargos(),
      ]);

      setTodosEmpleados(empleadosData);
      setCargos(cargosData);

      // Set default cargo to Asesor
      const cargoAsesor = cargosData.find(
        (c: any) => c.nombre.toLowerCase() === "asesor",
      );
      if (cargoAsesor) {
        setCargoSeleccionado(cargoAsesor.id);
      }
    } catch (err: any) {
      console.error("Error al cargar catálogos:", err);
      setError("Error al cargar catálogos: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadEmpleadosAsignados = async () => {
    if (!tiendaId || !fecha) {
      setEmpleadosAsignados([]);
      return;
    }

    try {
      setLoading(true);

      // ✅ Usar la nueva función que filtra por fecha EXACTA
      const presupuestos = await obtenerEmpleadosPorFechaExacta(
        [tiendaId],
        fecha,
      );

      // Mapear los datos de la BD al formato del modal
      const empleadosConInfo = presupuestos.map((p: any) => {
        const empleado = todosEmpleados.find((e) => e.id === p.asesor);
        const cargo = cargos.find((c) => c.id === p.cargo);

        return {
          id: p.asesor,
          id_presupuesto: p.id, // ← ID del registro en presupuesto_diario_empleados
          nombre: empleado?.nombre || `Empleado ${p.asesor} `,
          codigo: p.asesor, // ← El código es el ID del asesor
          cargo_id: p.cargo,
          cargo_nombre: cargo?.nombre || "Asesor",
          presupuesto: p.presupuesto || 0,
          fecha: p.fecha,
        };
      });

      setEmpleadosAsignados(empleadosConInfo);

      // 🔧 GUARDAR estado original para dirty check
      setEmpleadosAsignadosOriginal(empleadosConInfo);

      // Intentar recalcular presupuestos si es necesario (solo una vez por carga)
      const needsRecalculation = empleadosConInfo.some(
        (emp: any) => emp.presupuesto === 0 || emp.presupuesto === undefined,
      );
      if (needsRecalculation) {
        // Intentar recalcular en background sin bloquear la UI
        recalculateBudgets(empleadosConInfo)
          .then((result) => {
            if (result.calculated) {
              setEmpleadosAsignados(result.empleados);
            }
            // Si no se calculó, dejar como está
          })
          .catch((err) => {
            console.error("Error al recalcular presupuestos al cargar:", err);
          });
      }
    } catch (err: any) {
      console.error("Error al cargar empleados asignados:", err);
      setError("Error al cargar empleados: " + err.message);
      setEmpleadosAsignados([]);
    } finally {
      setLoading(false);
    }
  };

  const buscarEmpleadoPorCodigo = () => {
    if (!codigoEmpleado.trim()) {
      setEmpleadoEncontrado(null);
      setError("");
      return;
    }

    // Verificar que los empleados estén cargados
    if (todosEmpleados.length === 0) {
      setError("Cargando empleados...");
      return;
    }

    // ✅ El código del asesor es su ID en la tabla asesores
    const codigoNumerico = parseInt(codigoEmpleado.trim());

    if (isNaN(codigoNumerico)) {
      setEmpleadoEncontrado(null);
      setError("El código debe ser un número válido");
      return;
    }

    // ✅ Comparar convirtiendo ambos a número para evitar problemas de tipo
    const empleado = todosEmpleados.find((e) => {
      const empleadoId = typeof e.id === "string" ? parseInt(e.id) : e.id;
      return empleadoId === codigoNumerico;
    });

    if (empleado) {
      setEmpleadoEncontrado(empleado);
      setError("");
    } else {
      setEmpleadoEncontrado(null);
      setError(`No se encontró empleado con código ${codigoEmpleado} `);
    }
  };

  // ✅ Manejar Enter para agregar empleado
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && empleadoEncontrado && cargoSeleccionado) {
      e.preventDefault();
      handleAgregarEmpleado();
    }
  };

  // ✅ Función para recalcular presupuestos
  const recalculateBudgets = async (empleados: any[], targetDate?: string) => {
    // Usar la fecha proporcionada o la fecha actual del formulario
    const activeDate = targetDate || fecha;

    if (!tiendaId || empleados.length === 0)
      return { empleados, calculated: false };

    try {
      // 1. Obtener presupuesto diario de la tienda para la fecha específica
      const presupuestosTienda = await obtenerPresupuestosDiarios(
        tiendaId,
        activeDate,
        activeDate,
      );

      if (!presupuestosTienda || presupuestosTienda.length === 0) {
        console.warn(
          "No hay presupuesto diario asignado para esta tienda y fecha",
        );
        return {
          empleados: empleados.map((e) => ({ ...e, presupuesto: 0 })),
          calculated: false,
        };
      }

      const presupuestoTotal = presupuestosTienda[0].presupuesto;

      // 2. Obtener porcentajes mensuales
      // ✅ CORREGIDO DEFINITIVO: Usar la FECHA del formulario como fuente de verdad única
      // Esto asegura que si el usuario edita "2025-12-26", se usen los % de Diciembre 2025

      let mesAnioParaAPI = "";
      let shouldUseApi = false;

      if (activeDate && activeDate.includes("-")) {
        const partes = activeDate.split("-"); // [YYYY, MM, DD]
        if (partes.length >= 2) {
          const anio = partes[0];
          const mesNumero = partes[1];

          const mesesMap: { [key: string]: string } = {
            "01": "Ene",
            "02": "Feb",
            "03": "Mar",
            "04": "Abr",
            "05": "May",
            "06": "Jun",
            "07": "Jul",
            "08": "Ago",
            "09": "Sep",
            "10": "Oct",
            "11": "Nov",
            "12": "Dic",
          };

          const mesNombre = mesesMap[mesNumero];

          if (mesNombre && anio) {
            mesAnioParaAPI = `${mesNombre} ${anio}`;
            shouldUseApi = true;
          }
        }
      }

      // Si no pudimos determinar el mes válido, NO consultar la API (evita fallback al mes actual)
      if (!shouldUseApi) {
        console.warn(
          "⚠️ No se pudo determinar el mes correcto para consultar porcentajes. Se aborta consulta para evitar fallback incorrecto.",
        );
        return {
          empleados: empleados.map((e) => ({ ...e, presupuesto: 0 })),
          calculated: false,
        };
      }

      const porcentajes = await obtenerPorcentajesMensuales(
        undefined,
        mesAnioParaAPI,
      );

      if (!porcentajes || porcentajes.length === 0) {
        console.warn("No hay porcentajes configurados para este mes");
        return {
          empleados: empleados.map((e) => ({ ...e, presupuesto: 0 })),
          calculated: false,
        };
      }
      // Validación adicional: asegurar que lo que devuelve la API coincide con lo que pedimos
      // (Aunque read.ts ya filtra, doble verificación no hace daño)
      if (!porcentajes || porcentajes.length === 0) {
        console.warn(
          `⚠️ No se encontraron porcentajes configurados para ${mesAnioParaAPI}`,
        );
        return {
          empleados: empleados.map((e) => ({ ...e, presupuesto: 0 })),
          calculated: false,
        };
      }

      const porcentajeConfig = porcentajes[0];

      // 3. Contar empleados por rol
      const empleadosPorRol = {
        gerente: empleados.filter(
          (e) => e.cargo_nombre.toLowerCase() === "gerente",
        ).length,
        asesor: empleados.filter(
          (e) => e.cargo_nombre.toLowerCase() === "asesor",
        ).length,
        coadministrador: empleados.filter(
          (e) => e.cargo_nombre.toLowerCase() === "coadministrador",
        ).length,
        cajero: empleados.filter(
          (e) => e.cargo_nombre.toLowerCase() === "cajero",
        ).length,
        logistico: empleados.filter(
          (e) => e.cargo_nombre.toLowerCase() === "logistico",
        ).length,
        gerente_online: empleados.filter(
          (e) =>
            e.cargo_nombre.toLowerCase() === "gerente online" ||
            e.cargo_nombre.toLowerCase().includes("online"),
        ).length,
      };

      // 4. Calcular distribución
      const presupuestosPorRol = calculateBudgetsWithFixedDistributive(
        presupuestoTotal,
        porcentajeConfig,
        empleadosPorRol,
      );

      // 5. Asignar presupuestos individuales
      const empleadosCalculados = empleados.map((empleado) => {
        const rolLower = empleado.cargo_nombre.toLowerCase();
        let presupuestoNuevo = 0;

        // Casos especiales con presupuesto fijo de 1
        if (
          rolLower === "cajero" ||
          rolLower === "logistico" ||
          rolLower === "gerente online" ||
          rolLower.includes("online")
        ) {
          presupuestoNuevo = 1;
        } else if (
          ["gerente", "asesor", "coadministrador"].includes(rolLower)
        ) {
          // Roles con distribución normal
          const cantidadEnRol =
            empleadosPorRol[rolLower as keyof typeof empleadosPorRol];
          const totalRol =
            presupuestosPorRol[rolLower as keyof typeof presupuestosPorRol];

          if (cantidadEnRol > 0) {
            presupuestoNuevo = Math.round(totalRol / cantidadEnRol);
          }
        }

        return {
          ...empleado,
          presupuesto: presupuestoNuevo,
        };
      });
      return { empleados: empleadosCalculados, calculated: true };
    } catch (error) {
      console.error("Error al recalcular presupuestos:", error);
      // En caso de error, mantener los actuales
      return { empleados, calculated: false };
    }
  };

  const handleAgregarEmpleado = async () => {
    if (!tiendaId) {
      setError("No se pudo identificar la tienda del usuario");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (!empleadoEncontrado || !cargoSeleccionado) {
      setError("Debe seleccionar un cargo");
      return;
    }

    // Verificar que no esté ya asignado
    const yaAsignado = empleadosAsignados.find(
      (e) => e.id === empleadoEncontrado.id,
    );
    if (yaAsignado) {
      setError("Este empleado ya está asignado");
      return;
    }

    const cargo = cargos.find((c) => c.id === cargoSeleccionado);

    // Crear nuevo empleado
    const nuevoEmpleado = {
      id: empleadoEncontrado.id,
      nombre: empleadoEncontrado.nombre,
      codigo: empleadoEncontrado.id,
      cargo_id: cargoSeleccionado,
      cargo_nombre: cargo?.nombre || "Asesor",
      presupuesto: 0,
      fecha: fecha,
    };

    // Crear lista temporal con el nuevo empleado
    const nuevaLista = [...empleadosAsignados, nuevoEmpleado];

    // Calcular presupuestos con la nueva lista
    setLoading(true);
    try {
      const result = await recalculateBudgets(nuevaLista);
      setEmpleadosAsignados(result.empleados);

      // Limpiar campos
      setCodigoEmpleado("");
      // Resetear a cargo por defecto "Asesor"
      const cargoAsesor = cargos.find(
        (c) => c.nombre.toLowerCase() === "asesor",
      );
      setCargoSeleccionado(cargoAsesor ? cargoAsesor.id : "");

      setEmpleadoEncontrado(null);
      setSuccess(`Empleado ${empleadoEncontrado.nombre} agregado`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error al agregar y calcular:", err);
      // Fallback: agregar sin calcular
      setEmpleadosAsignados(nuevaLista);
    } finally {
      setLoading(false);
    }
  };

  const handleQuitarEmpleado = async (empleadoId: number) => {
    const nuevaLista = empleadosAsignados.filter((e) => e.id !== empleadoId);

    setLoading(true);
    try {
      const result = await recalculateBudgets(nuevaLista);
      setEmpleadosAsignados(result.empleados);
    } catch (err) {
      console.error("Error al quitar y calcular:", err);
      setEmpleadosAsignados(nuevaLista);
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiar = () => {
    setEmpleadosAsignados([]);
  };

  const handleGuardar = async () => {
    if (!tiendaId) {
      setError("No se pudo identificar la tienda del usuario");
      return;
    }

    if (empleadosAsignados.length === 0) {
      setError("Debe asignar al menos un empleado");
      return;
    }

    // Fix: Strict validation for future dates logic
    if (dayjs(fecha).isAfter(dayjs(), 'day')) {
      setError("No se pueden asignar presupuestos a fechas futuras.");
      return;
    }

    // Determinar qué días vamos a guardar
    const diasAGuardar = selectedDays.length > 0 ? selectedDays : [fecha];

    try {
      setLoading(true);

      // 1️⃣ Eliminar asignaciones existentes y Guardar nuevas para cada día
      for (const dia of diasAGuardar) {
        await eliminarPresupuestosEmpleados(tiendaId, dia);

        // ✅ RECALCULAR: Obtener los presupuestos específicos para este día concreto
        // Esto asegura que si el día X tiene una meta de $5M y el día Y tiene $10M, 
        // los empleados reciban el monto proporcional correspondiente a ese día.
        const resCalculo = await recalculateBudgets(empleadosAsignados, dia);
        const empleadosParaEsteDia = resCalculo.calculated ? resCalculo.empleados : empleadosAsignados;

        const presupuestosParaGuardar = empleadosParaEsteDia.map((emp) => ({
          asesor: emp.id,
          tienda_id: tiendaId,
          cargo: emp.cargo_id,
          fecha: dia,
          presupuesto: emp.presupuesto || 0,
        }));

        await guardarPresupuestosEmpleados(presupuestosParaGuardar);
      }

      setSuccess(`✅ Asignación actualizada correctamente para ${diasAGuardar.length} día(s)`);
      setTimeout(() => setSuccess(""), 3000);

      // Limpiar selección después de guardar exitosamente
      setSelectedDays([]);

      // Recargar empleados asignados en el modal para la fecha actual
      await loadEmpleadosAsignados();
      await loadDiasSinPresupuesto();

      // Actualizar la vista principal
      if (onSaveComplete) {
        onSaveComplete();
      }

      return true;
    } catch (err: any) {
      console.error("Error al guardar:", err);
      setError("Error al guardar: " + err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Función para alternar selección de días
  const toggleDaySelection = (dia: string) => {
    // BLOQUEO: No permitir seleccionar días con presupuesto 0 o futuros
    const isBudgetZero = diasConPresupuestoCero.includes(dia);
    const isFuture = dayjs(dia).isAfter(dayjs(), 'day');

    if (isBudgetZero || isFuture) return;

    const isRemoving = selectedDays.includes(dia);
    const newSelection = isRemoving
      ? selectedDays.filter((d) => d !== dia)
      : [...selectedDays, dia];

    setSelectedDays(newSelection);

    // Si deseleccionamos y quedan otros días, mover el foco a uno de los que quedan
    if (isRemoving) {
      if (newSelection.length > 0) {
        setFecha(newSelection[newSelection.length - 1]);
      }
    } else {
      // Si seleccionamos uno nuevo, el foco va a ese
      setFecha(dia);
    }
  };

  const selectAllPendingDays = () => {
    // Al haber filtrado ya diasSinPresupuesto en la carga, simplemente usamos el estado
    setSelectedDays(diasSinPresupuesto);
  };

  const clearDaySelection = () => {
    setSelectedDays([]);
  };

  // ✅ Nueva validación de combinación de personal
  const isValidStaffCombination = useMemo(() => {
    if (empleadosAsignados.length === 0) return false;

    const hasAsesor = empleadosAsignados.some(e =>
      e.cargo_nombre.toLowerCase() === "asesor"
    );

    const hasSuperior = empleadosAsignados.some(e => {
      const cargo = e.cargo_nombre.toLowerCase();
      return cargo === "gerente" ||
        cargo === "coadministrador" ||
        cargo === "gerente online" ||
        cargo.includes("online");
    });

    return hasAsesor && hasSuperior;
  }, [empleadosAsignados]);

  // 🔧 NUEVO: Dirty check - detectar si hay cambios respecto al estado original
  const hasChanges = useMemo(() => {
    if (empleadosAsignadosOriginal.length !== empleadosAsignados.length) {
      return true;
    }

    // Comparar IDs de empleados
    const originalIds = new Set(empleadosAsignadosOriginal.map(e => e.id));
    const currentIds = new Set(empleadosAsignados.map(e => e.id));

    // Verificar si hay empleados agregados o eliminados
    const hasAdded = empleadosAsignados.some(e => !originalIds.has(e.id));
    const hasRemoved = empleadosAsignadosOriginal.some(e => !currentIds.has(e.id));

    // Verificar cambios de rol
    const hasRoleChange = empleadosAsignados.some(current => {
      const original = empleadosAsignadosOriginal.find(o => o.id === current.id);
      return original && original.cargo_id !== current.cargo_id;
    });

    return hasAdded || hasRemoved || hasRoleChange;
  }, [empleadosAsignados, empleadosAsignadosOriginal]);

  return {
    // Estados
    fecha,
    setFecha,
    tiendaId,
    tiendaNombre,
    cargoSeleccionado,
    setCargoSeleccionado,
    codigoEmpleado,
    setCodigoEmpleado,
    empleadoEncontrado,
    empleadosAsignados,
    cargos,
    loading,
    error,
    success,
    diasSinPresupuesto,
    diasConPresupuestoCero, // NUEVO: Días con presupuesto casa $0
    diasConAsignacion,
    selectedDays,
    tiendas, // NUEVO
    // Handlers
    handleKeyPress,
    handleAgregarEmpleado,
    handleQuitarEmpleado,
    handleLimpiar,
    handleGuardar,
    toggleDaySelection,
    selectAllPendingDays,
    clearDaySelection,
    handleTiendaChange, // NUEVO
    // Validaciones
    isValidStaffCombination,
    hasChanges, // NUEVO
    // Utils
    setError,
    setSuccess,
    setTiendaId,
  };
};
