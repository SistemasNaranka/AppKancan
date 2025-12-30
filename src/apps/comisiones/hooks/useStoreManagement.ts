import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  DirectusTienda,
  DirectusAsesor,
  DirectusCargo,
  BudgetRecord,
} from "../types";
import {
  obtenerTiendas,
  obtenerAsesores,
  obtenerCargos,
  obtenerPresupuestosDiarios,
} from "../api/directus/read";
import {
  guardarPresupuestosTienda,
  guardarPresupuestosEmpleados,
  eliminarPresupuestosEmpleados,
} from "../api/directus/create";
import {
  calcularDiasLaboradosPorEmpleado,
  calculateMesResumenAgrupado,
} from "../lib/calculations";
import { useAuth } from "@/auth/hooks/useAuth";

export interface StoreData {
  tienda: DirectusTienda | null;
  presupuesto: string;
  fecha: string;
  empleados: DirectusAsesor[];
  empleadosSeleccionados: DirectusAsesor[];
  presupuestosEmpleados: any[];
  loading: boolean;
  error: string | null;
  success: string | null;
  canSave: boolean;
  saving: boolean;
}

export interface UseStoreManagementReturn extends StoreData {
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

  // Callback para actualizar datos principales
  onSaveComplete?: () => void;
}

export const useStoreManagement = (
  onSaveComplete?: () => void
): UseStoreManagementReturn => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Estados principales
  const [tienda, setTienda] = useState<DirectusTienda | null>(null);
  const [presupuesto, setPresupuesto] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [empleados, setEmpleados] = useState<DirectusAsesor[]>([]);
  const [empleadosSeleccionados, setEmpleadosSeleccionados] = useState<
    DirectusAsesor[]
  >([]);
  const [presupuestosEmpleados, setPresupuestosEmpleados] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Estado de datos base
  const [tiendas, setTiendas] = useState<DirectusTienda[]>([]);
  const [cargos, setCargos] = useState<DirectusCargo[]>([]);

  // Cargar datos base al inicializar
  useEffect(() => {
    loadBaseData();
  }, []);

  const loadBaseData = async () => {
    try {
      setLoading(true);
      const [tiendasData, cargosData] = await Promise.all([
        obtenerTiendas(),
        obtenerCargos(),
      ]);
      setTiendas(tiendasData);
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
      return asesoresData.filter((asesor) => {
        const asesorTiendaId =
          typeof asesor.tienda_id === "object"
            ? asesor.tienda_id.id
            : asesor.tienda_id;
        return asesorTiendaId === tiendaId;
      });
    } catch (err: any) {
      setError(`Error al cargar empleados de la tienda: ${err.message}`);
      return [];
    }
  }, []);

  // Cargar datos de una tienda específica
  const handleLoadStoreData = useCallback(
    async (tiendaId: number, selectedFecha: string) => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(null);

        // Encontrar la tienda
        const tiendaData = tiendas.find((t) => t.id === tiendaId);
        if (!tiendaData) {
          setError("Tienda no encontrada");
          return;
        }
        setTienda(tiendaData);

        // Cargar empleados de la tienda
        const empleadosTienda = await getStoreEmployees(tiendaId);
        setEmpleados(empleadosTienda);

        // Obtener presupuesto diario de la tienda para la fecha desde la API
        try {
          const presupuestosDiarios = await obtenerPresupuestosDiarios(
            tiendaId,
            selectedFecha,
            selectedFecha
          );
          const presupuestoExistente =
            presupuestosDiarios.length > 0
              ? presupuestosDiarios[0].presupuesto.toString()
              : "0";
          setPresupuesto(presupuestoExistente);
        } catch (budgetError: any) {
          console.log(
            "No se encontró presupuesto existente para la fecha:",
            budgetError.message
          );
          setPresupuesto("0");
        }

        // Establecer empleados seleccionados como todos los empleados de la tienda
        setEmpleadosSeleccionados(empleadosTienda);

        // Establecer fecha
        setFecha(selectedFecha);

        setSuccess("Datos de la tienda cargados correctamente");
      } catch (err: any) {
        setError(`Error al cargar datos de la tienda: ${err.message}`);
      } finally {
        setLoading(false);
      }
    },
    [tiendas, getStoreEmployees]
  );

  // Agregar empleado a la selección
  const handleAddEmpleado = useCallback(
    (empleado: DirectusAsesor) => {
      if (!empleadosSeleccionados.find((emp) => emp.id === empleado.id)) {
        setEmpleadosSeleccionados((prev) => [...prev, empleado]);
        setError(null);
      }
    },
    [empleadosSeleccionados]
  );

  // Remover empleado de la selección
  const handleRemoveEmpleado = useCallback((empleadoId: number) => {
    setEmpleadosSeleccionados((prev) =>
      prev.filter((emp) => emp.id !== empleadoId)
    );
  }, []);

  // Limpiar formulario
  const handleClearForm = useCallback(() => {
    setTienda(null);
    setPresupuesto("");
    setFecha(new Date().toISOString().split("T")[0]);
    setEmpleados([]);
    setEmpleadosSeleccionados([]);
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
      const presupuestoPorEmpleado =
        presupuestoTotal / empleadosSeleccionados.length;

      // 1. Guardar/Actualizar presupuesto diario de la tienda
      const presupuestoTienda = {
        tienda_id: tienda!.id,
        presupuesto: presupuestoTotal,
        fecha: fecha,
      };

      await guardarPresupuestosTienda([presupuestoTienda] as any);

      // 2. Eliminar presupuestos existentes de empleados para esta fecha y tienda
      await eliminarPresupuestosEmpleados(tienda!.id, fecha);

      // 3. Crear nuevos presupuestos para cada empleado seleccionado
      const nuevosPresupuestosEmpleados = empleadosSeleccionados.map(
        (empleado) => ({
          asesor: empleado.id,
          tienda_id: tienda!.id,
          cargo:
            typeof empleado.cargo_id === "object"
              ? empleado.cargo_id.id
              : empleado.cargo_id,
          fecha: fecha,
          presupuesto: presupuestoPorEmpleado,
        })
      );

      await guardarPresupuestosEmpleados(nuevosPresupuestosEmpleados as any);

      setPresupuestosEmpleados(nuevosPresupuestosEmpleados);
      setSuccess("Cambios guardados correctamente");

      // Recalcular datos después de guardar
      recalcularDatos();

      // Invalidar cache de React Query para actualizar datos en tiempo real
      queryClient.invalidateQueries({ queryKey: ["commission-data"] });

      // Llamar callback para actualizar datos principales del sistema
      if (onSaveComplete) {
        onSaveComplete();
      }
    } catch (err: any) {
      console.error("Error al guardar cambios:", err);
      setError(`Error al guardar cambios: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }, [tienda, presupuesto, fecha, empleadosSeleccionados, validateForm]);

  // Recalcular datos (simulado)
  const recalcularDatos = useCallback(() => {
    if (!tienda || !presupuesto || empleadosSeleccionados.length === 0) {
      return;
    }

    console.log("🔄 Recalculando datos para:", {
      tienda: tienda.nombre,
      presupuesto: parseFloat(presupuesto),
      empleados: empleadosSeleccionados.length,
      fecha,
      presupuestoPorEmpleado:
        parseFloat(presupuesto) / empleadosSeleccionados.length,
    });

    setSuccess("Datos recalculados correctamente");
  }, [tienda, presupuesto, empleadosSeleccionados, fecha]);

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
  const handlePresupuestoChange = useCallback(
    (value: string) => {
      setPresupuesto(value);
      clearMessages();
    },
    [clearMessages]
  );

  const handleFechaChange = useCallback(
    (value: string) => {
      setFecha(value);
      clearMessages();
    },
    [clearMessages]
  );

  return {
    // Estados
    tienda,
    presupuesto,
    fecha,
    empleados,
    empleadosSeleccionados,
    presupuestosEmpleados,
    loading,
    error,
    success,
    canSave: canSave(),
    saving,

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
    onSaveComplete,
  };
};
