import { useState, useEffect, useMemo } from "react";
import dayjs from "dayjs";
import { 
  obtenerTiendas, obtenerEmpleadosPorFechaExacta, 
  obtenerAsesores, obtenerCargos 
} from "../api/directus/read";
import { guardarPresupuestosEmpleados, eliminarPresupuestosEmpleados } from "../api/directus/create";
import { useBudgetCalculations } from "./useBudgetCalculations";
import { useBudgetCalendar } from "./useBudgetCalendar";

export const useEditStoreBudgetModalLogic = ({ isOpen, onSaveComplete }: any) => {
  const [fecha, setFecha] = useState<string>(() => localStorage.getItem("modalFecha") || dayjs().format("YYYY-MM-DD"));
  const [tiendaId, setTiendaId] = useState<number | "">(""); // Corregido: "" en lugar de null
  const [tiendaNombre, setTiendaNombre] = useState("");
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
      setTiendas(tData.sort((a: any, b: any) => a.id - b.id));
      setTodosEmpleados(eData);
      setCargos(cData);
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
    } finally { setLoading(false); }
  };

  const handleAgregarEmpleado = async () => {
    if (!empleadoEncontrado || !cargoSeleccionado) return;
    const cargoDoc = cargos.find((c) => c.id === cargoSeleccionado);
    const nuevoEmpleado = {
      id: empleadoEncontrado.id,
      nombre: empleadoEncontrado.nombre,
      codigo: empleadoEncontrado.codigo,
      cargo_id: cargoSeleccionado,
      cargo_nombre: cargoDoc?.nombre || "Asesor",
      presupuesto: 0,
    };
    const { empleados } = await recalculateBudgets([...empleadosAsignados, nuevoEmpleado], fecha);
    setEmpleadosAsignados(empleados);
    setEmpleadoEncontrado(null);
    setCodigoEmpleado("");
  };

  const handleQuitarEmpleado = async (id: number) => {
    const { empleados } = await recalculateBudgets(empleadosAsignados.filter((e) => e.id !== id), fecha);
    setEmpleadosAsignados(empleados);
  };

  const handleGuardar = async () => {
    if (!tiendaId || empleadosAsignados.length === 0) return;
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
      setError("Error al guardar");
      return false;
    } finally { setLoading(false); }
  };

  const hasChanges = useMemo(() => {
    if (empleadosAsignadosOriginal.length !== empleadosAsignados.length) return true;
    const currentIds = new Set(empleadosAsignados.map(e => e.id));
    return empleadosAsignadosOriginal.some(o => !currentIds.has(o.id));
  }, [empleadosAsignados, empleadosAsignadosOriginal]);

  return {
    fecha, setFecha, tiendaId, setTiendaId, tiendaNombre, cargoSeleccionado, setCargoSeleccionado,
    codigoEmpleado, setCodigoEmpleado, empleadoEncontrado, setEmpleadoEncontrado, 
    empleadosAsignados, setEmpleadosAsignados,
    tiendas, todosEmpleados, cargos, loading, error, success,
    diasSinPresupuesto, diasConPresupuestoCero, diasConAsignacion, selectedDays,
    hasChanges, handleGuardar, handleAgregarEmpleado, handleQuitarEmpleado,
    handleTiendaChange: (id: number) => {
      setTiendaId(id);
      setTiendaNombre(tiendas.find(t => t.id === id)?.nombre || "");
    },
    toggleDaySelection: (dia: string) => {
      if (diasConPresupuestoCero.includes(dia) || dayjs(dia).isAfter(dayjs(), 'day')) return;
      setSelectedDays(prev => prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]);
      if (!selectedDays.includes(dia)) setFecha(dia);
    }
  };
};