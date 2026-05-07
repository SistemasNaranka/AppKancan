import { useState, useEffect, useMemo, type KeyboardEvent } from "react";
import dayjs from "dayjs";
import { 
  obtenerTiendas, obtenerEmpleadosPorFechaExacta, 
  obtenerAsesores, obtenerCargos 
} from "../api/directus/read";
import { guardarPresupuestosEmpleados, eliminarPresupuestosEmpleados } from "../api/directus/create";
import { useBudgetCalculations } from "./useBudgetCalculations";
import { useBudgetCalendar } from "./useBudgetCalendar";

export const useEditStoreModalLogic = ({ isOpen, onSaveComplete, tiendaProp }: any) => {
  // Estados de UI y Datos
  const [fecha, setFecha] = useState<string>(() => localStorage.getItem("modalFecha") || dayjs().format("YYYY-MM-DD"));
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState<number | "">(
    tiendaProp?.id ? Number(tiendaProp.id) : (typeof tiendaProp === 'number' ? tiendaProp : (tiendaProp && !isNaN(Number(tiendaProp)) ? Number(tiendaProp) : ""))
  );
  const [tiendaNombre, setTiendaNombre] = useState(tiendaProp?.nombre || "");
  const [cargoSeleccionado, setCargoSeleccionado] = useState<number | "">("");
  const [codigoEmpleado, setCodigoEmpleado] = useState("");
  const [empleadoEncontrado, setEmpleadoEncontrado] = useState<any>(null);
  const [empleadosAsignados, setEmpleadosAsignados] = useState<any[]>([]);
  const [empleadosAsignadosOriginal, setEmpleadosAsignadosOriginal] = useState<any[]>([]);
  const [tiendas, setTiendas] = useState<any[]>([]);
  const [todosEmpleados, setTodosEmpleados] = useState<any[]>([]);
  const [cargos, setCargos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Inicializar sub-hooks
  const { recalculateBudgets } = useBudgetCalculations(tiendaSeleccionada);
  const { 
    diasSinPresupuesto, diasConPresupuestoCero, diasConAsignacion, 
    selectedDays, setSelectedDays, loadDiasSinPresupuesto 
  } = useBudgetCalendar(tiendaSeleccionada, fecha);

  // Efectos principales (Carga de catálogos y persistencia)
  useEffect(() => { if (isOpen) loadCatalogos(); }, [isOpen]);
  useEffect(() => { localStorage.setItem("modalFecha", fecha); }, [fecha]);

  // Sincronizar tienda si cambia el prop (cuando el modal está abierto)
  useEffect(() => {
    if (tiendaProp && isOpen) {
      const idRaw = tiendaProp.id || (typeof tiendaProp === 'number' ? tiendaProp : (tiendaProp && !isNaN(Number(tiendaProp)) ? Number(tiendaProp) : ""));
      const id = idRaw !== "" ? Number(idRaw) : "";
      const nombre = tiendaProp.nombre || "";
      
      if (id !== "" && id !== tiendaSeleccionada) {
        setTiendaSeleccionada(id);
      }
      if (nombre && nombre !== tiendaNombre) {
        setTiendaNombre(nombre);
      }
    }
  }, [tiendaProp, isOpen]);

  // Carga de catálogos - Solo una vez al abrir
  useEffect(() => { 
    if (isOpen) {
      loadCatalogos(); 
    }
  }, [isOpen]);

  // Carga de datos del calendario (independiente de catálogos)
  useEffect(() => {
    if (isOpen && tiendaSeleccionada) {
      loadDiasSinPresupuesto();
    }
  }, [isOpen, tiendaSeleccionada, fecha]);

  // Carga de empleados asignados (depende de catálogos)
  useEffect(() => {
    if (isOpen && tiendaSeleccionada && fecha && todosEmpleados.length > 0) {
      loadEmpleadosAsignados();
    }
  }, [isOpen, fecha, tiendaSeleccionada, todosEmpleados.length > 0]);

  const loadCatalogos = async () => {
    try {
      setLoadingCatalogos(true);
      const [tData, eData, cData] = await Promise.all([obtenerTiendas(), obtenerAsesores(), obtenerCargos()]);
      setTiendas(tData.sort((a: any, b: any) => a.id - b.id));
      setTodosEmpleados(eData);
      setCargos(cData);
      const cargoAsesor = cData.find((c: any) => c.nombre.toLowerCase() === "asesor");
      if (cargoAsesor) setCargoSeleccionado(cargoAsesor.id);

      // Si ya tenemos tienda seleccionada (por prop) pero no el nombre, buscarlo
      if (tiendaSeleccionada) {
        const currentTienda = tData.find(t => Number(t.id) === Number(tiendaSeleccionada));
        if (currentTienda) {
          setTiendaNombre(currentTienda.nombre);
        }
      } else if (tData.length === 1) {
        // Caso usuario tienda: seleccionar la única disponible
        setTiendaSeleccionada(Number(tData[0].id));
        setTiendaNombre(tData[0].nombre);
      }
    } finally { setLoadingCatalogos(false); }
  };

  const loadEmpleadosAsignados = async () => {
    if (!tiendaSeleccionada || !fecha) return;
    try {
      setLoading(true);
      const presupuestos = await obtenerEmpleadosPorFechaExacta([tiendaSeleccionada as number], fecha);
      const mapeados = presupuestos.map((p: any) => {
        const emp = todosEmpleados.find((e) => e.id === p.asesor);
        const car = cargos.find((c) => c.id === p.cargo);
        return { 
          id: p.asesor, id_presupuesto: p.id, nombre: emp?.nombre || `Empleado ${p.asesor}`, 
          codigo: p.asesor, cargo_id: p.cargo, cargo_nombre: car?.nombre || "Asesor", 
          presupuesto: p.presupuesto || 0, fecha: p.fecha 
        };
      });
      setEmpleadosAsignados(mapeados);
      setEmpleadosAsignadosOriginal(mapeados);
    } finally { setLoading(false); }
  };

  const handleGuardar = async () => {
    if (!tiendaSeleccionada || empleadosAsignados.length === 0) return;
    const diasAGuardar = selectedDays.length > 0 ? selectedDays : [fecha];
    try {
      setLoading(true);
      for (const dia of diasAGuardar) {
        await eliminarPresupuestosEmpleados(tiendaSeleccionada as number, dia);
        const res = await recalculateBudgets(empleadosAsignados, dia);
        const listaFinal = res.calculated ? res.empleados : empleadosAsignados;
        await guardarPresupuestosEmpleados(listaFinal.map(emp => ({
          asesor: emp.id, tienda_id: tiendaSeleccionada, cargo: emp.cargo_id, fecha: dia, presupuesto: emp.presupuesto || 0,
        })));
      }
      setSuccess(`✅ Asignación actualizada (${diasAGuardar.length} días)`);
      setSelectedDays([]);
      await loadEmpleadosAsignados();
      await loadDiasSinPresupuesto();
      if (onSaveComplete) await onSaveComplete();
      return true;
    } catch (err) {
      setError("Error al guardar");
      return false;
    } finally { setLoading(false); }
  };

  const hasChanges = useMemo(() => {
    if (empleadosAsignadosOriginal.length !== empleadosAsignados.length) return true;
    const currentIds = new Set(empleadosAsignados.map(e => e.id));
    return empleadosAsignadosOriginal.some(o => !currentIds.has(o.id));
  }, [empleadosAsignados, empleadosAsignadosOriginal]);

  // Búsqueda automática de empleado por código (EXCLUSIVAMENTE ID EXACTO).
  useEffect(() => {
    if (!codigoEmpleado || codigoEmpleado.length < 1) {
      setEmpleadoEncontrado(null);
      return;
    }
    
    // Limpiar errores previos al buscar
    if (error && error.includes("no existe")) setError("");

    // Búsqueda por ID exacto solamente
    const found = todosEmpleados.find((e: any) => String(e.id) === String(codigoEmpleado));
    
    setEmpleadoEncontrado(found ?? null);

    // ✅ NUEVO: Avisar si el código no existe (cuando tiene 4 dígitos)
    if (codigoEmpleado.length === 4 && !found) {
      setError(`⚠️ El código ${codigoEmpleado} no existe en la base de datos.`);
    }
  }, [codigoEmpleado, todosEmpleados]);

  // Validacin de roles requeridos (Gerente + Asesor)
  const hasRequiredRoles = useMemo(() => {
    const roles = empleadosAsignados.map(e => e.cargo_nombre.toLowerCase());
    const tieneGerente = roles.some(r => r === "gerente" || r === "coadministrador" || r.includes("gerente"));
    const tieneAsesor = roles.some(r => r === "asesor");
    return tieneGerente && tieneAsesor;
  }, [empleadosAsignados]);

  const handleAgregarEmpleado = async () => {
    // ✅ Validación con mensajes claros
    if (!tiendaSeleccionada) {
      setError("Debe seleccionar una tienda primero.");
      return;
    }
    if (!cargoSeleccionado) {
      setError("Debe seleccionar un cargo para el empleado.");
      return;
    }
    if (!empleadoEncontrado) {
      if (codigoEmpleado.length > 0) {
        setError(`El código ${codigoEmpleado} no es válido o no existe.`);
      } else {
        setError("Ingrese un código de empleado.");
      }
      return;
    }
    
    if (empleadosAsignados.some((e) => e.id === empleadoEncontrado.id)) {
      setError("El empleado ya está asignado.");
      return;
    }
    
    const cargo = cargos.find((c) => c.id === cargoSeleccionado);
    const nuevoEmpleado = {
      id: empleadoEncontrado.id,
      codigo: empleadoEncontrado.id,
      nombre: empleadoEncontrado.nombre,
      cargo_id: cargoSeleccionado,
      cargo_nombre: cargo?.nombre ?? "Asesor",
      presupuesto: 0,
      fecha,
    };

    const nuevaLista = [...empleadosAsignados, nuevoEmpleado];
    
    setLoading(true);
    try {
      // Reclculo inmediato para evitar ceros
      const { empleados: calculados } = await recalculateBudgets(nuevaLista, fecha);
      setEmpleadosAsignados(calculados);
      setCodigoEmpleado("");
      setEmpleadoEncontrado(null);
      clearMessages();
    } catch (err) {
      console.error("Error al recalcular al agregar:", err);
      setEmpleadosAsignados(nuevaLista);
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleQuitarEmpleado = async (id: number) => {
    const nuevaLista = empleadosAsignados.filter((e) => e.id !== id);
    
    if (nuevaLista.length === 0) {
      setEmpleadosAsignados([]);
      return;
    }

    setLoading(true);
    try {
      const { empleados: calculados } = await recalculateBudgets(nuevaLista, fecha);
      setEmpleadosAsignados(calculados);
    } catch (err) {
      console.error("Error al recalcular al quitar:", err);
      setEmpleadosAsignados(nuevaLista);
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiar = () => {
    setEmpleadosAsignados([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAgregarEmpleado();
    }
  };

  const selectAllPendingDays = () => {
    setSelectedDays([...(diasSinPresupuesto ?? [])]);
  };

  const clearDaySelection = () => {
    setSelectedDays([]);
  };

  return {
    fecha, setFecha, tiendaSeleccionada, tiendaNombre, cargoSeleccionado, setCargoSeleccionado,
    codigoEmpleado, setCodigoEmpleado, empleadoEncontrado, empleadosAsignados,
    tiendas, todosEmpleados, cargos, loading, loadingCatalogos, error, success,
    setError, setSuccess, clearMessages,
    diasSinPresupuesto, diasConPresupuestoCero, diasConAsignacion, selectedDays,
    hasChanges, hasRequiredRoles, handleGuardar,
    handleAgregarEmpleado, handleQuitarEmpleado, handleLimpiar, handleKeyPress,
    selectAllPendingDays, clearDaySelection,
    handleTiendaChange: (id: number | string) => {
      const numericId = id === "" ? "" : Number(id);
      setTiendaSeleccionada(numericId);
      const tienda = tiendas.find(t => Number(t.id) === numericId);
      setTiendaNombre(tienda?.nombre || "");
      // Limpiar empleados al cambiar de tienda para evitar mezclar datos
      setEmpleadosAsignados([]);
      setEmpleadosAsignadosOriginal([]);
    },
    toggleDaySelection: (dia: string) => {
      if (diasConPresupuestoCero.includes(dia) || dayjs(dia).isAfter(dayjs(), 'day')) return;
      
      // Si el día ya está seleccionado, lo quitamos
      if (selectedDays.includes(dia)) {
        setSelectedDays(prev => prev.filter(d => d !== dia));
      } else {
        // Si no está seleccionado, lo agregamos y cambiamos la fecha activa
        setSelectedDays(prev => [...prev, dia]);
        setFecha(dia);
      }
    },
  };
};