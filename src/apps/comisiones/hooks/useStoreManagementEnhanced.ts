import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { DirectusTienda, DirectusAsesor, DirectusCargo } from "../types";
import { obtenerTiendas, obtenerAsesores, obtenerCargos, obtenerPresupuestosDiarios } from "../api/directus/read";
import { 
  guardarPresupuestosTienda, 
  guardarPresupuestosEmpleados, 
  eliminarPresupuestosEmpleados 
} from "../api/directus/create";
import { useAuth } from "@/auth/hooks/useAuth";

export interface StoreDataEnhanced {
  tienda: DirectusTienda | null;
  presupuesto: string;
  fecha: string;
  empleados: DirectusAsesor[];
  empleadosSeleccionados: DirectusAsesor[];
  empleadosFecha: DirectusAsesor[]; // Empleados que trabajaron en la fecha específica
  presupuestosEmpleados: any[];
  loading: boolean;
  error: string | null;
  success: string | null;
  canSave: boolean;
  saving: boolean;
  cargos: DirectusCargo[];
  tiendasDisponibles: DirectusTienda[];
  distribucionCalculada: { [empleadoId: number]: number };
  totalDistribucion: number;
}

export interface UseStoreManagementEnhancedReturn extends StoreDataEnhanced {
  // Estados
  setTienda: (tienda: DirectusTienda | null) => void;
  setPresupuesto: (presupuesto: string) => void;
  setFecha: (fecha: string) => void;
  setEmpleadosSeleccionados: (empleados: DirectusAsesor[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;

  // Handlers
  handleAddEmpleado: (empleado: DirectusAsesor) => void;
  handleRemoveEmpleado: (empleadoId: number) => void;
  handleSaveChanges: () => Promise<void>;
  handleLoadStoreData: (tiendaId: number, fecha: string) => Promise<void>;
  handleClearForm: () => void;
  clearMessages: () => void;
  recalcularDatos: () => void;

  // Helpers
  getStoreEmployees: (tiendaId: number) => Promise<DirectusAsesor[]>;
  validateForm: () => boolean;
  filterEmpleadosByFecha: (fecha: string) => DirectusAsesor[];
  
  // Callback para actualizar datos principales
  onSaveComplete?: () => void;
}

export const useStoreManagementEnhanced = (onSaveComplete?: () => void): UseStoreManagementEnhancedReturn => {
  const { user } = useAuth();
  const isMountedRef = useRef(true);
  
  // Estados principales
  const [tienda, setTienda] = useState<DirectusTienda | null>(null);
  const [presupuesto, setPresupuesto] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [empleados, setEmpleados] = useState<DirectusAsesor[]>([]);
  const [empleadosSeleccionados, setEmpleadosSeleccionados] = useState<DirectusAsesor[]>([]);
  const [empleadosFecha, setEmpleadosFecha] = useState<DirectusAsesor[]>([]);
  const [presupuestosEmpleados, setPresupuestosEmpleados] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [cargos, setCargos] = useState<DirectusCargo[]>([]);
  const [tiendasDisponibles, setTiendasDisponibles] = useState<DirectusTienda[]>([]);

  // Cargar datos base al inicializar
  useEffect(() => {
    loadBaseData();
    
    // Cleanup function
    return () => {
      // Marcar como desmontado para evitar ejecutar callbacks
      isMountedRef.current = false;
      // Limpiar todos los timeouts pendientes
      clearAllTimeouts();
      // Limpiar mensajes
      clearMessages();
    };
  }, []);

  const timeoutRefs = useRef<number[]>([]);
  
  // Función para limpiar todos los timeouts
  const clearAllTimeouts = () => {
    timeoutRefs.current.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    timeoutRefs.current = [];
  };
  
  // Función auxiliar para crear timeouts seguros que no se ejecuten si el componente está desmontado
  const createSafeTimeout = (callback: () => void, delay: number) => {
    const timeoutId = window.setTimeout(() => {
      // Verificar que el componente aún esté montado antes de ejecutar
      if (isMountedRef.current) {
        callback();
      }
    }, delay);
    timeoutRefs.current.push(timeoutId);
    return timeoutId;
  };
  
  // Función auxiliar para crear timeouts rastreables (legacy compatibility)
  const createTrackedTimeout = (callback: () => void, delay: number) => {
    return createSafeTimeout(callback, delay);
  };
  
  const loadBaseData = async () => {
    try {
      setLoading(true);
      const [tiendasData, cargosData] = await Promise.all([
        obtenerTiendas(),
        obtenerCargos()
      ]);
      setTiendasDisponibles(tiendasData);
      setCargos(cargosData);
    } catch (err: any) {
      setError(`Error al cargar datos base: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Obtener empleados de una tienda específica
  const getStoreEmployees = useCallback(async (tiendaId: number) => {
    try {
      const asesoresData = await obtenerAsesores();
      return asesoresData.filter(asesor => {
        const asesorTiendaId = typeof asesor.tienda_id === 'object' 
          ? asesor.tienda_id.id 
          : asesor.tienda_id;
        return asesorTiendaId === tiendaId;
      });
    } catch (err: any) {
      setError(`Error al cargar empleados de la tienda: ${err.message}`);
      return [];
    }
  }, []);

  // Filtrar empleados por fecha (simulado - en la realidad vendría de la API)
  const filterEmpleadosByFecha = useCallback((fechaSeleccionada: string): DirectusAsesor[] => {
    // En una implementación real, esto haría una llamada a la API para obtener
    // qué empleados trabajaron en esa fecha específica
    // Por ahora, simulamos que todos los empleados de la tienda trabajan todos los días
    return empleados;
  }, [empleados]);

  // Cargar datos de una tienda específica
  const handleLoadStoreData = useCallback(async (tiendaId: number, selectedFecha: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Encontrar la tienda
      const tiendaData = (await obtenerTiendas()).find(t => t.id === tiendaId);
      if (!tiendaData) {
        setError("Tienda no encontrada");
        return;
      }
      setTienda(tiendaData);

      // Cargar empleados de la tienda
      const empleadosTienda = await getStoreEmployees(tiendaId);
      setEmpleados(empleadosTienda);

      // Filtrar empleados por fecha
      const empleadosFechaFiltered = filterEmpleadosByFecha(selectedFecha);
      setEmpleadosFecha(empleadosFechaFiltered);

      // Obtener presupuesto diario de la tienda para la fecha desde la API
      try {
        const presupuestosDiarios = await obtenerPresupuestosDiarios(tiendaId, selectedFecha, selectedFecha);
        const presupuestoExistente = presupuestosDiarios.length > 0 
          ? presupuestosDiarios[0].presupuesto.toString() 
          : "0";
        setPresupuesto(presupuestoExistente);
      } catch (budgetError: any) {
        console.log("No se encontró presupuesto existente para la fecha:", budgetError.message);
        setPresupuesto("0");
      }

      // Establecer empleados seleccionados como todos los empleados de la fecha
      setEmpleadosSeleccionados(empleadosFechaFiltered);

      // Establecer fecha
      setFecha(selectedFecha);

      setSuccess("Datos de la tienda cargados correctamente");
    } catch (err: any) {
      setError(`Error al cargar datos de la tienda: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [getStoreEmployees, filterEmpleadosByFecha]);

  // Agregar empleado a la selección
  const handleAddEmpleado = useCallback((empleado: DirectusAsesor) => {
    if (!empleadosSeleccionados.find(emp => emp.id === empleado.id)) {
      setEmpleadosSeleccionados(prev => [...prev, empleado]);
      setError(null);
    }
  }, [empleadosSeleccionados]);

  // Remover empleado de la selección
  const handleRemoveEmpleado = useCallback((empleadoId: number) => {
    setEmpleadosSeleccionados(prev => prev.filter(emp => emp.id !== empleadoId));
  }, []);

  // Limpiar formulario
  const handleClearForm = useCallback(() => {
    setTienda(null);
    setPresupuesto("");
    setFecha(new Date().toISOString().split("T")[0]);
    setEmpleados([]);
    setEmpleadosSeleccionados([]);
    setEmpleadosFecha([]);
    setPresupuestosEmpleados([]);
    setError(null);
    setSuccess(null);
  }, []);

  // Validar formulario
  const validateForm = useCallback(() => {
    if (!tienda) {
      setError("Debe seleccionar una tienda");
      return false;
    }
    if (!presupuesto || parseFloat(presupuesto) <= 0) {
      setError("Debe ingresar un presupuesto válido");
      return false;
    }
    if (!fecha) {
      setError("Debe seleccionar una fecha");
      return false;
    }
    if (empleadosSeleccionados.length === 0) {
      setError("Debe seleccionar al menos un empleado");
      return false;
    }
    return true;
  }, [tienda, presupuesto, fecha, empleadosSeleccionados]);

  // Calcular distribución de presupuesto
  const { distribucionCalculada, totalDistribucion } = useMemo(() => {
    if (!presupuesto || parseFloat(presupuesto) <= 0 || empleadosSeleccionados.length === 0) {
      return { distribucionCalculada: {}, totalDistribucion: 0 };
    }

    const presupuestoTotal = parseFloat(presupuesto);
    const distribucion: { [empleadoId: number]: number } = {};

    // Distribución equitativa por ahora (se podría mejorar con la lógica de roles)
    const presupuestoPorEmpleado = presupuestoTotal / empleadosSeleccionados.length;
    
    empleadosSeleccionados.forEach(empleado => {
      distribucion[empleado.id] = presupuestoPorEmpleado;
    });

    return {
      distribucionCalculada: distribucion,
      totalDistribucion: presupuestoTotal
    };
  }, [presupuesto, empleadosSeleccionados]);

  // Guardar cambios
  const handleSaveChanges = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const presupuestoTotal = parseFloat(presupuesto);

      // 1. Guardar/Actualizar presupuesto diario de la tienda
      const presupuestoTienda = {
        tienda_id: tienda!.id,
        presupuesto: presupuestoTotal,
        fecha: fecha
      };
      
      await guardarPresupuestosTienda([presupuestoTienda] as any);

      // 2. Eliminar presupuestos existentes de empleados para esta fecha y tienda
      await eliminarPresupuestosEmpleados(tienda!.id, fecha);

      // 3. Crear nuevos presupuestos para cada empleado seleccionado
      const nuevosPresupuestosEmpleados = empleadosSeleccionados.map(empleado => ({
        asesor: empleado.id,
        tienda_id: tienda!.id,
        cargo: typeof empleado.cargo_id === 'object' ? empleado.cargo_id.id : empleado.cargo_id,
        fecha: fecha,
        presupuesto: distribucionCalculada[empleado.id] || 0
      }));

      await guardarPresupuestosEmpleados(nuevosPresupuestosEmpleados as any);

      setPresupuestosEmpleados(nuevosPresupuestosEmpleados);
      setSuccess("Cambios guardados correctamente");
      
      // Recalcular datos después de guardar
      createTrackedTimeout(() => {
        recalcularDatos();
        
        // Llamar callback para actualizar datos principales del sistema
        if (onSaveComplete) {
          onSaveComplete();
        }
      }, 500);

    } catch (err: any) {
      console.error("Error al guardar cambios:", err);
      setError(`Error al guardar cambios: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }, [tienda, presupuesto, fecha, empleadosSeleccionados, distribucionCalculada, validateForm, onSaveComplete]);

  // Recalcular datos
  const recalcularDatos = useCallback(() => {
    if (!tienda || !presupuesto || empleadosSeleccionados.length === 0) {
      return;
    }

    console.log("🔄 Recalculando datos para:", {
      tienda: tienda.nombre,
      presupuesto: parseFloat(presupuesto),
      empleados: empleadosSeleccionados.length,
      fecha,
      distribucion: distribucionCalculada
    });

    setSuccess("Datos recalculados correctamente");
  }, [tienda, presupuesto, empleadosSeleccionados, fecha, distribucionCalculada]);

  // Verificar si se puede guardar
  const canSave = useCallback(() => {
    return (
      tienda !== null &&
      presupuesto !== "" &&
      parseFloat(presupuesto) > 0 &&
      fecha !== "" &&
      empleadosSeleccionados.length > 0
    );
  }, [tienda, presupuesto, fecha, empleadosSeleccionados]);

  // Limpiar mensajes
  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  // Manejar cambios
  const handlePresupuestoChange = useCallback((value: string) => {
    setPresupuesto(value);
    clearMessages();
  }, [clearMessages]);

  const handleFechaChange = useCallback((value: string) => {
    setFecha(value);
    clearMessages();
    // Recargar empleados para la nueva fecha
    if (tienda) {
      const empleadosFechaFiltered = filterEmpleadosByFecha(value);
      setEmpleadosFecha(empleadosFechaFiltered);
      setEmpleadosSeleccionados(empleadosFechaFiltered);
    }
  }, [clearMessages, tienda, filterEmpleadosByFecha]);

  return {
    // Estados
    tienda,
    presupuesto,
    fecha,
    empleados,
    empleadosSeleccionados,
    empleadosFecha,
    presupuestosEmpleados,
    loading,
    error,
    success,
    canSave: canSave(),
    saving,
    cargos,
    tiendasDisponibles,
    distribucionCalculada,
    totalDistribucion,

    // Setters
    setTienda,
    setPresupuesto: handlePresupuestoChange,
    setFecha: handleFechaChange,
    setEmpleadosSeleccionados,
    setLoading,
    setError,
    setSuccess,

    // Handlers
    handleAddEmpleado,
    handleRemoveEmpleado,
    handleSaveChanges,
    handleLoadStoreData,
    handleClearForm,
    clearMessages,
    recalcularDatos,

    // Helpers
    getStoreEmployees,
    validateForm,
    filterEmpleadosByFecha,
    onSaveComplete,
  };
};