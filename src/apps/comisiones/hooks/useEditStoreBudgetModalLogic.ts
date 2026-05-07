import { useState, useEffect, useMemo } from "react";
import dayjs from "dayjs";
import { 
  obtenerTiendas, obtenerEmpleadosPorFechaExacta, 
  obtenerAsesores, obtenerCargos 
} from "../api/directus/read";
import { guardarPresupuestosEmpleados, eliminarPresupuestosEmpleados } from "../api/directus/create";
import { useBudgetCalculations } from "./useBudgetCalculations";
import { useBudgetCalendar } from "./useBudgetCalendar";

export const useEditStoreBudgetModalLogic = ({ isOpen, onSaveComplete, tiendaProp }: any) => {
  const [fecha, setFecha] = useState<string>(() => localStorage.getItem("modalFecha") || dayjs().format("YYYY-MM-DD"));
  const [tiendaId, setTiendaId] = useState<number | "">(
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { recalculateBudgets } = useBudgetCalculations(tiendaId);
  const { 
    diasSinPresupuesto, diasConPresupuestoCero, diasConAsignacion, 
    selectedDays, setSelectedDays, loadDiasSinPresupuesto 
  } = useBudgetCalendar(tiendaId, fecha);

  useEffect(() => { if (isOpen) loadCatalogos(); }, [isOpen]);
  useEffect(() => { localStorage.setItem("modalFecha", fecha); }, [fecha]);

  // ✅ NUEVO: Buscar empleado automáticamente cuando cambia el código
  useEffect(() => {
    if (!codigoEmpleado || codigoEmpleado.length < 1) {
      setEmpleadoEncontrado(null);
      return;
    }

    // Limpiar errores previos al buscar
    if (error && error.includes("no existe")) setError("");

    const cleanCodigo = codigoEmpleado.trim();
    const codigoNum = parseInt(cleanCodigo);
    
    // Búsqueda por ID exacto solamente
    const asesor = todosEmpleados.find((a: any) => String(a.id) === String(codigoEmpleado));
    
    setEmpleadoEncontrado(asesor || null);

    // ✅ NUEVO: Avisar si el código no existe (cuando tiene 4 dígitos)
    if (codigoEmpleado.length === 4 && !asesor) {
      setError(`⚠️ El código ${codigoEmpleado} no existe en la base de datos.`);
    }
  }, [codigoEmpleado, todosEmpleados]);

  useEffect(() => {
    if (fecha && tiendaId) {
      loadEmpleadosAsignados();
      loadDiasSinPresupuesto();
    }
  }, [fecha, tiendaId, todosEmpleados, cargos]);

  const loadCatalogos = async () => {
    try {
      setLoading(true);
      const [tData, eData, cData] = await Promise.all([obtenerTiendas(), obtenerAsesores(), obtenerCargos()]);
      const sortedTiendas = tData.sort((a: any, b: any) => a.id - b.id);
      setTiendas(sortedTiendas);
      setTodosEmpleados(eData);
      setCargos(cData);
      
      // ✅ NUEVO: Auto-selección para tienda única
      if (sortedTiendas.length === 1 && !tiendaId) {
        setTiendaId(Number(sortedTiendas[0].id));
        setTiendaNombre(sortedTiendas[0].nombre);
      }

      const cargoAsesor = cData.find((c: any) => c.nombre.toLowerCase() === "asesor");
      if (cargoAsesor) setCargoSeleccionado(cargoAsesor.id);
    } finally { setLoading(false); }
  };

  const loadEmpleadosAsignados = async () => {
    if (!tiendaId || !fecha) return;
    try {
      setLoading(true);
      const presupuestos = await obtenerEmpleadosPorFechaExacta([tiendaId as number], fecha);
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
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarEmpleado = async () => {
    // ✅ Validaciones con mensajes claros
    if (!tiendaId) {
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

    const cargoDoc = cargos.find((c) => c.id === cargoSeleccionado);
    const nuevoEmpleado = {
      id: empleadoEncontrado.id,
      nombre: empleadoEncontrado.nombre,
      codigo: empleadoEncontrado.id, // Usar ID como código para consistencia
      cargo_id: cargoSeleccionado,
      cargo_nombre: cargoDoc?.nombre || "Asesor",
      presupuesto: 0,
      fecha,
    };

    setLoading(true);
    try {
      const { empleados } = await recalculateBudgets([...empleadosAsignados, nuevoEmpleado], fecha);
      setEmpleadosAsignados(empleados);
      setEmpleadoEncontrado(null);
      setCodigoEmpleado("");
      setError(""); // Limpiar error al agregar con éxito
    } catch (err) {
      console.error("Error al agregar:", err);
      setError("Error al procesar la asignación.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuitarEmpleado = async (id: number) => {
    const nuevaLista = empleadosAsignados.filter((e) => e.id !== id);
    if (nuevaLista.length === 0) {
      setEmpleadosAsignados([]);
      return;
    }
    setLoading(true);
    try {
      const { empleados } = await recalculateBudgets(nuevaLista, fecha);
      setEmpleadosAsignados(empleados);
    } catch (err) {
      console.error("Error al quitar:", err);
      setEmpleadosAsignados(nuevaLista);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAgregarEmpleado();
    }
  };

  const handleGuardar = async () => {
    if (!tiendaId || empleadosAsignados.length === 0) {
      setError("No hay datos para guardar.");
      return;
    }
    const diasAGuardar = selectedDays.length > 0 ? selectedDays : [fecha];
    try {
      setLoading(true);
      for (const dia of diasAGuardar) {
        await eliminarPresupuestosEmpleados(tiendaId as number, dia);
        const { empleados, calculated } = await recalculateBudgets(empleadosAsignados, dia);
        const listaFinal = calculated ? empleados : empleadosAsignados;
        await guardarPresupuestosEmpleados(listaFinal.map(emp => ({
          asesor: emp.id, tienda_id: tiendaId, cargo: emp.cargo_id, fecha: dia, presupuesto: emp.presupuesto || 0,
        })));
      }
      setSuccess(`✅ Guardado con éxito (${diasAGuardar.length} días)`);
      setSelectedDays([]);
      await loadEmpleadosAsignados();
      await loadDiasSinPresupuesto();
      if (onSaveComplete) await onSaveComplete();
      return true;
    } catch (err) {
      setError("Error al guardar en la base de datos.");
      return false;
    } finally { setLoading(false); }
  };

  const hasChanges = useMemo(() => {
    if (empleadosAsignadosOriginal.length !== empleadosAsignados.length) return true;
    const currentIds = new Set(empleadosAsignados.map(e => e.id));
    return empleadosAsignadosOriginal.some(o => !currentIds.has(o.id));
  }, [empleadosAsignados, empleadosAsignadosOriginal]);

  const isValidStaffCombination = useMemo(() => {
    if (empleadosAsignados.length === 0) return true;
    const roles = empleadosAsignados.map(e => (e.cargo_nombre || "").toLowerCase());
    const tieneSuperior = roles.some(r => r.includes("gerente") || r.includes("coadministrador"));
    const tieneAsesor = roles.some(r => r.includes("asesor"));
    return tieneSuperior && tieneAsesor;
  }, [empleadosAsignados]);

  return {
    fecha, setFecha, tiendaId, setTiendaId, tiendaNombre, cargoSeleccionado, setCargoSeleccionado,
    codigoEmpleado, setCodigoEmpleado, empleadoEncontrado, setEmpleadoEncontrado, 
    empleadosAsignados, setEmpleadosAsignados,
    tiendas, todosEmpleados, cargos, loading, error, success,
    setError, setSuccess,
    diasSinPresupuesto, diasConPresupuestoCero, diasConAsignacion, selectedDays,
    hasChanges, handleGuardar, handleAgregarEmpleado, handleQuitarEmpleado,
    handleKeyPress,
    handleLimpiar: () => setEmpleadosAsignados([]),
    handleTiendaChange: (id: number) => {
      setTiendaId(id);
      setTiendaNombre(tiendas.find(t => t.id === id)?.nombre || "");
    },
    toggleDaySelection: (dia: string) => {
      if (diasConPresupuestoCero.includes(dia) || dayjs(dia).isAfter(dayjs(), 'day')) return;
      setSelectedDays(prev => prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]);
      if (!selectedDays.includes(dia)) setFecha(dia);
    },
    selectAllPendingDays: () => setSelectedDays([...diasSinPresupuesto]),
    clearDaySelection: () => setSelectedDays([]),
    isValidStaffCombination
  };
};