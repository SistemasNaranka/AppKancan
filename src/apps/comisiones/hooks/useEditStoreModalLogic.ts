import { useState, useEffect, useMemo } from "react";
import dayjs from "dayjs";
import { 
  obtenerTiendas, obtenerEmpleadosPorFechaExacta, 
  obtenerAsesores, obtenerCargos 
} from "../api/directus/read";
import { guardarPresupuestosEmpleados, eliminarPresupuestosEmpleados } from "../api/directus/create";
import { useBudgetCalculations } from "./useBudgetCalculations";
import { useBudgetCalendar } from "./useBudgetCalendar";

export const useEditStoreModalLogic = ({ isOpen, onSaveComplete }: any) => {
  // Estados de UI y Datos
  const [fecha, setFecha] = useState<string>(() => localStorage.getItem("modalFecha") || dayjs().format("YYYY-MM-DD"));
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState<number | "">("");
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

  // Inicializar sub-hooks
  const { recalculateBudgets } = useBudgetCalculations(tiendaSeleccionada);
  const { 
    diasSinPresupuesto, diasConPresupuestoCero, diasConAsignacion, 
    selectedDays, setSelectedDays, loadDiasSinPresupuesto 
  } = useBudgetCalendar(tiendaSeleccionada, fecha);

  // Efectos principales (Carga de catálogos y persistencia)
  useEffect(() => { if (isOpen) loadCatalogos(); }, [isOpen]);
  useEffect(() => { localStorage.setItem("modalFecha", fecha); }, [fecha]);

  // Carga de empleados y días según contexto
  useEffect(() => {
    if (fecha && tiendaSeleccionada) {
      loadEmpleadosAsignados();
      loadDiasSinPresupuesto();
    }
  }, [fecha, tiendaSeleccionada, todosEmpleados, cargos]);

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

  return {
    fecha, setFecha, tiendaSeleccionada, tiendaNombre, cargoSeleccionado, setCargoSeleccionado,
    codigoEmpleado, setCodigoEmpleado, empleadoEncontrado, empleadosAsignados,
    tiendas, todosEmpleados, cargos, loading, error, success,
    diasSinPresupuesto, diasConPresupuestoCero, diasConAsignacion, selectedDays,
    hasChanges, handleGuardar,
    handleTiendaChange: (id: number) => {
      setTiendaSeleccionada(id);
      setTiendaNombre(tiendas.find(t => t.id === id)?.nombre || "");
    },
    toggleDaySelection: (dia: string) => {
      if (diasConPresupuestoCero.includes(dia) || dayjs(dia).isAfter(dayjs(), 'day')) return;
      setSelectedDays(prev => prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]);
      if (!selectedDays.includes(dia)) setFecha(dia);
    }
    // ... otros handlers (Agregar/Quitar) que usan recalculateBudgets
  };
};