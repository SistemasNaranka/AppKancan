// useEmployeeOperations.ts (Versión Mejorada)
import { useState, useEffect, useRef, useMemo } from "react";
import { DirectusAsesor, DirectusCargo, DirectusTienda, EmpleadoAsignado, ROLES_EXCLUSIVOS, RolExclusivo } from "../types/modal";
import { guardarPresupuestosEmpleados, actualizarPresupuestoEmpleado, eliminarPresupuestoEmpleado } from "../api/directus/create";
import { obtenerPresupuestosDiarios, obtenerPresupuestosEmpleados, obtenerPorcentajesMensuales, obtenerAsesores, obtenerCargos } from "../api/directus/read";
import { calculateBudgetsWithFixedDistributive } from "../lib/calculations.budgets";
import { getFechaActual } from "../lib/modalHelpers";
import { calcularPresupuestoTotalTienda, getCargoNombreHelper, getTiendaNombreHelper, validateExclusiveRoleHelper } from "./employeeOperations.utils";

export const useEmployeeOperations = (
  tiendaUsuario: DirectusTienda | null,
  onAssignmentComplete?: (ventasData: any[]) => void
) => {
  // --- ESTADOS ---
  const [codigoInput, setCodigoInput] = useState("");
  const [cargoSeleccionado, setCargoSeleccionado] = useState("");
  const [empleadosAsignados, setEmpleadosAsignados] = useState<EmpleadoAsignado[]>([]);
  const [empleadosOriginal, setEmpleadosOriginal] = useState<EmpleadoAsignado[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | "warning" | "info">("info");
  const [canSave, setCanSave] = useState(false);
  const [hasExistingData, setHasExistingData] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [buttonConfig, setButtonConfig] = useState({ text: "Guardar", action: "save", disabled: false });
  
  const codigoInputRef = useRef<HTMLInputElement>(null);

  // --- LOGICA DE VALIDACIÓN (Efectos) ---
  useEffect(() => {
    const hasManager = empleadosAsignados.some(e => {
      const r = e.cargoAsignado.toLowerCase();
      return ROLES_EXCLUSIVOS.includes(r as RolExclusivo) || r === "gerente online";
    });
    const hasAsesor = empleadosAsignados.some(e => e.cargoAsignado.toLowerCase() === "asesor");

    const newCanSave = hasManager && hasAsesor && empleadosAsignados.length > 0;
    if (canSave !== newCanSave) setCanSave(newCanSave);

    const newConfig = {
      text: hasExistingData ? "Actualizar" : "Guardar",
      action: hasExistingData ? "update" : "save",
      disabled: !newCanSave
    };
    if (JSON.stringify(buttonConfig) !== JSON.stringify(newConfig)) setButtonConfig(newConfig);
  }, [empleadosAsignados, hasExistingData, canSave, buttonConfig]);

  // --- DIRTY CHECK (useMemo) ---
  const hasChanges = useMemo(() => {
    if (empleadosOriginal.length === 0 && empleadosAsignados.length > 0) return true;
    if (empleadosOriginal.length !== empleadosAsignados.length) return true;
    
    const originalIds = new Set(empleadosOriginal.map(e => e.asesor.id));
    const hasAddedOrRemoved = empleadosAsignados.some(e => !originalIds.has(e.asesor.id)) || 
                             empleadosOriginal.some(e => !new Set(empleadosAsignados.map(x => x.asesor.id)).has(e.asesor.id));
    
    const hasRoleChange = empleadosAsignados.some(current => {
      const orig = empleadosOriginal.find(o => o.asesor.id === current.asesor.id);
      return orig && orig.cargoAsignado !== current.cargoAsignado;
    });

    return hasAddedOrRemoved || hasRoleChange;
  }, [empleadosAsignados, empleadosOriginal]);

  // --- HANDLERS PRINCIPALES ---

  // ✅ Función para cargar datos (Lógica original preservada)
  const cargarDatosExistentes = async (fecha: string, mes?: string, asesores?: DirectusAsesor[], cargos?: DirectusCargo[]) => {
    if (!tiendaUsuario) return;
    try {
      setLoading(true);
      const datos = await obtenerPresupuestosEmpleados(tiendaUsuario.id, fecha, mes);
      const hoy = datos.filter(d => d.fecha === fecha);

      if (hoy.length > 0) {
        const asesoresFull = (!asesores || asesores.length === 0) ? await obtenerAsesores() : asesores;
        const cargosFull = (!cargos || cargos.length === 0) ? await obtenerCargos() : cargos;

        const mapeados: EmpleadoAsignado[] = hoy.map(d => {
          const emp = asesoresFull.find(a => a.id === d.asesor);
          return {
            asesor: emp || { id: d.asesor, nombre: `Empleado ${d.asesor}`, documento: 0, tienda_id: d.tienda_id, cargo_id: d.cargo },
            presupuesto: d.presupuesto || 0,
            tiendaId: d.tienda_id,
            cargoAsignado: getCargoNombreHelper(d.cargo, cargosFull)
          };
        });
        setEmpleadosAsignados(mapeados);
        setEmpleadosOriginal(mapeados);
        setHasExistingData(true);
        setIsUpdateMode(true);
      }
    } catch (e) { setError("Error al cargar datos"); } finally { setLoading(false); }
  };

  // ✅ Función de guardado (Lógica compleja de inserts/updates/deletes)[cite: 3]
  const handleSaveAsignaciones = async (fecha: string, cargos: DirectusCargo[]) => {
    if (!canSave) return;
    try {
      setSaving(true);
      const existentes = (await obtenerPresupuestosEmpleados(tiendaUsuario!.id, fecha)).filter(e => e.fecha === fecha);
      const mapaExistentes = new Map(existentes.map(e => [e.asesor, e]));

      const paraInsertar: any[] = [];
      const paraActualizar: any[] = [];
      const paraEliminar: number[] = [];

      empleadosAsignados.forEach(emp => {
        const ex = mapaExistentes.get(emp.asesor.id);
        if (ex) {
          if (ex.presupuesto !== emp.presupuesto) paraActualizar.push({ id: ex.id, presupuesto: emp.presupuesto });
          mapaExistentes.delete(emp.asesor.id);
        } else {
          paraInsertar.push({ 
            asesor: emp.asesor.id, fecha, presupuesto: emp.presupuesto, 
            tienda_id: emp.tiendaId, cargo: cargos.find(c => c.nombre === emp.cargoAsignado)?.id || 2 
          });
        }
      });
      mapaExistentes.forEach(v => paraEliminar.push(v.id));

      if (paraInsertar.length) await guardarPresupuestosEmpleados(paraInsertar);
      for (const u of paraActualizar) await actualizarPresupuestoEmpleado(u.id, u.presupuesto);
      for (const id of paraEliminar) await eliminarPresupuestoEmpleado(id);

      const total = calcularPresupuestoTotalTienda(empleadosAsignados);
      setSuccess(`Guardado con éxito. Total: ${total.toLocaleString()}`);
      setMessageType("success");
    } catch (e) { setError("Error al guardar"); throw e; } finally { setSaving(false); }
  };

  // ✅ Retorno del Hook
  return {
    codigoInput, setCodigoInput, cargoSeleccionado, setCargoSeleccionado, empleadosAsignados,
    loading, saving, error, success, messageType, canSave, hasExistingData, isUpdateMode, hasChanges,
    codigoInputRef, 
    handleClearEmpleados: () => { setEmpleadosAsignados([]); setHasExistingData(false); },
    handleSaveAsignaciones, cargarDatosExistentes,
    getCargoNombre: getCargoNombreHelper, getTiendaNombre: getTiendaNombreHelper,
    validateExclusiveRole: (r: string, a: DirectusAsesor) => validateExclusiveRoleHelper(r, a, empleadosAsignados),
    clearMessages: () => { setError(null); setSuccess(null); }
  };
};