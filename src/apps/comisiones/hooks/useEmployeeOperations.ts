// useEmployeeOperations.ts (Versión Mejorada)
import { useState, useEffect, useRef, useMemo } from "react";
import { DirectusAsesor, DirectusCargo, DirectusTienda, EmpleadoAsignado, ROLES_EXCLUSIVOS, RolExclusivo } from "../types/modal";
import { guardarPresupuestosEmpleados, actualizarPresupuestoEmpleado, eliminarPresupuestoEmpleado } from "../api/directus/create";
import { obtenerPresupuestosDiarios, obtenerPresupuestosEmpleados, obtenerPorcentajesMensuales, obtenerAsesores, obtenerCargos } from "../api/directus/read";
import { calculateBudgetsWithFixedDistributive } from "../lib/calculations.budgets";
import { getFechaActual } from "../lib/modalHelpers";
import { calcularPresupuestoTotalTienda, getCargoNombreHelper, getTiendaNombreHelper, validateExclusiveRoleHelper } from "./employeeOperations.utils";
import { useBudgetCalculations } from "./useBudgetCalculations";

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
  const { recalculateBudgets } = useBudgetCalculations(tiendaUsuario?.id || "");

  // ✅ NUEVO: Validación de roles mínimos requeridos
  const hasRequiredRoles = useMemo(() => {
    const hasManager = empleadosAsignados.some(e => {
      const r = e.cargoAsignado.toLowerCase();
      return ROLES_EXCLUSIVOS.includes(r as RolExclusivo) || r === "gerente online";
    });
    const hasAsesor = empleadosAsignados.some(e => e.cargoAsignado.toLowerCase() === "asesor");
    return hasManager && hasAsesor;
  }, [empleadosAsignados]);

  // --- LOGICA DE VALIDACIÓN (Efectos) ---
  useEffect(() => {
    const newCanSave = hasRequiredRoles && empleadosAsignados.length > 0;
    if (canSave !== newCanSave) setCanSave(newCanSave);

    const newConfig = {
      text: hasExistingData ? "Actualizar" : "Guardar",
      action: hasExistingData ? "update" : "save",
      disabled: !newCanSave
    };
    if (JSON.stringify(buttonConfig) !== JSON.stringify(newConfig)) setButtonConfig(newConfig);
  }, [empleadosAsignados, hasExistingData, canSave, buttonConfig, hasRequiredRoles]);

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

        // ✅ DISTRIBUCIÓN AUTOMÁTICA: Si todos los presupuestos son 0, recalculamos
        const totalPresupuesto = mapeados.reduce((sum, e) => sum + e.presupuesto, 0);
        if (totalPresupuesto === 0 && mapeados.length > 0) {
          const { empleados: calculados } = await recalculateBudgets(
            mapeados.map(e => ({ ...e.asesor, cargo_nombre: e.cargoAsignado })),
            fecha
          );
          
          const finalMapeados = mapeados.map((m, i) => ({
            ...m,
            presupuesto: calculados[i]?.presupuesto || 0
          }));
          
          setEmpleadosAsignados(finalMapeados);
          setEmpleadosOriginal(finalMapeados);
        } else {
          setEmpleadosAsignados(mapeados);
          setEmpleadosOriginal(mapeados);
        }

        setHasExistingData(true);
        setIsUpdateMode(true);
      }
    } catch (e) { setError("Error al cargar datos"); } finally { setLoading(false); }
  };

  // ✅ Función para agregar empleado con distribución de presupuesto
  const handleAddEmpleado = async (asesores: DirectusAsesor[], cargos: DirectusCargo[], empleadoYaEncontrado?: DirectusAsesor | null) => {
    if (!codigoInput.trim() || !cargoSeleccionado) {
      setError("Código y cargo son requeridos");
      setMessageType("warning");
      return;
    }

    const cleanCodigo = codigoInput.trim();
    const codigoNum = parseInt(cleanCodigo);
    
    // 1. Usar el empleado ya encontrado por el buscador si existe
    // 2. Si no, buscarlo en la lista de forma flexible (id o documento, string o number)
    // Búsqueda ESTRICTA por ID solamente
    const asesor = empleadoYaEncontrado || asesores.find(a => 
      String(a.id) === cleanCodigo
    );

    if (!asesor) {
      setError(`No se encontró empleado con código ${cleanCodigo}`);
      setMessageType("error");
      return;
    }

    // Validar si ya está asignado
    if (empleadosAsignados.some(e => e.asesor.id === asesor.id)) {
      setError(`${asesor.nombre} ya está asignado`);
      setMessageType("warning");
      return;
    }

    // Validar roles exclusivos
    const errorRol = validateExclusiveRoleHelper(cargoSeleccionado, asesor, empleadosAsignados);
    if (errorRol) {
      setError(errorRol);
      setMessageType("error");
      return;
    }

    const nuevoEmpleado: EmpleadoAsignado = {
      asesor,
      cargoAsignado: cargoSeleccionado,
      presupuesto: 0,
      tiendaId: typeof asesor.tienda_id === 'object' ? asesor.tienda_id.id : asesor.tienda_id
    };

    const nuevaLista = [...empleadosAsignados, nuevoEmpleado];
    
    try {
      setLoading(true);
      const fecha = getFechaActual(undefined); // O pasar la fecha actual desde props
      const { empleados: calculados } = await recalculateBudgets(
        nuevaLista.map(e => ({ ...e.asesor, cargo_nombre: e.cargoAsignado })),
        fecha
      );

      const listaConPresupuestos = nuevaLista.map((emp, index) => ({
        ...emp,
        presupuesto: calculados[index]?.presupuesto || 0
      }));

      setEmpleadosAsignados(listaConPresupuestos);
      setCodigoInput("");
      setSuccess(`${asesor.nombre} agregado con éxito`);
      setMessageType("success");
      
      if (codigoInputRef.current) codigoInputRef.current.focus();
    } catch (e) {
      setError("Error al calcular presupuestos");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Función para remover empleado y redistribuir
  const handleRemoveEmpleado = async (asesorId: number) => {
    const nuevaLista = empleadosAsignados.filter(e => e.asesor.id !== asesorId);
    
    if (nuevaLista.length === 0) {
      setEmpleadosAsignados([]);
      return;
    }

    try {
      setLoading(true);
      const fecha = getFechaActual(undefined);
      const { empleados: calculados } = await recalculateBudgets(
        nuevaLista.map(e => ({ ...e.asesor, cargo_nombre: e.cargoAsignado })),
        fecha
      );

      const listaConPresupuestos = nuevaLista.map((emp, index) => ({
        ...emp,
        presupuesto: calculados[index]?.presupuesto || 0
      }));

      setEmpleadosAsignados(listaConPresupuestos);
      setSuccess("Empleado removido y presupuestos redistribuidos");
      setMessageType("info");
    } catch (e) {
      setError("Error al redistribuir presupuestos");
      setEmpleadosAsignados(nuevaLista);
    } finally {
      setLoading(false);
    }
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
    handleAddEmpleado, handleRemoveEmpleado,
    getCargoNombre: getCargoNombreHelper, getTiendaNombre: getTiendaNombreHelper,
    validateExclusiveRole: (r: string, a: DirectusAsesor) => validateExclusiveRoleHelper(r, a, empleadosAsignados),
    hasRequiredRoles: () => hasRequiredRoles,
    clearMessages: () => { setError(null); setSuccess(null); }
  };
};