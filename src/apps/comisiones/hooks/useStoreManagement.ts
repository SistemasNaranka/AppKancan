import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  DirectusTienda,
  DirectusStaff,
  DirectusPosition,
  BudgetRecord,
} from "../types";
import {
  getStores,
  obtenerAsesores,
  obtenerCargos,
  obtenerPresupuestosDiarios,
} from "../api/directus/read";
import {
  guardarPresupuestosTienda,
  guardarPresupuestosEmpleados,
  eliminarPresupuestosEmpleados,
} from "../api/directus/create";
import { calculateMesResumenAgrupado } from "../lib/calculations.summary";
import { calcularDiasLaboradosPorEmpleado } from "../lib/utils";
import { useAuth } from "@/auth/hooks/useAuth";

export interface StoreData {
  tienda: DirectusTienda | null;
  presupuesto: string;
  fecha: string;
  empleados: DirectusStaff[];
  empleadosSeleccionados: DirectusStaff[];
  presupuestosEmpleados: any[];
  loading: boolean;
  error: string | null;
  success: string | null;
  canSave: boolean;
  saving: boolean;
}

export interface UseStoreManagementReturn extends StoreData {
  setTienda: (tienda: DirectusTienda | null) => void;
  setPresupuesto: (presupuesto: string) => void;
  setFecha: (fecha: string) => void;
  setEmpleadosSeleccionados: (empleados: DirectusStaff[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;

  handleAddEmpleado: (empleado: DirectusStaff) => void;
  handleRemoveEmpleado: (empleadoId: number) => void;
  handleSaveChanges: () => Promise<void>;
  handleLoadStoreData: (tiendaId: number, fecha: string) => Promise<void>;
  handleClearForm: () => void;
  clearMessages: () => void;
  recalcularDatos: () => void;

  getStoreEmployees: (tiendaId: number) => Promise<DirectusStaff[]>;
  validateForm: () => boolean;

  onSaveComplete?: () => void;
}

export const useStoreManagement = (
  onSaveComplete?: () => void,
): UseStoreManagementReturn => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [tienda, setTienda] = useState<DirectusTienda | null>(null);
  const [presupuesto, setPresupuesto] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [empleados, setEmpleados] = useState<DirectusStaff[]>([]);
  const [empleadosSeleccionados, setEmpleadosSeleccionados] = useState<
    DirectusStaff[]
  >([]);
  const [presupuestosEmpleados, setPresupuestosEmpleados] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [tiendas, setTiendas] = useState<DirectusTienda[]>([]);
  const [cargos, setCargos] = useState<DirectusPosition[]>([]);

  useEffect(() => {
    loadBaseData();
  }, []);

  const loadBaseData = async () => {
    try {
      setLoading(true);
      const [tiendasData, cargosData] = await Promise.all([
        getStores(),
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

  const getStoreEmployees = useCallback(async (tiendaId: number) => {
    try {
      const asesoresData = await obtenerAsesores();
      return asesoresData.filter((asesor) => {
        const asesorTiendaId =
          typeof asesor.store_id === "object"
            ? asesor.store_id.id
            : asesor.store_id;
        return asesorTiendaId === tiendaId;
      });
    } catch (err: any) {
      setError(`Error al cargar empleados de la tienda: ${err.message}`);
      return [];
    }
  }, []);

  const handleLoadStoreData = useCallback(
    async (tiendaId: number, selectedFecha: string) => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(null);

        const tiendaData = tiendas.find((t) => t.id === tiendaId);
        if (!tiendaData) {
          setError("Tienda no encontrada");
          return;
        }
        setTienda(tiendaData);

        const empleadosTienda = await getStoreEmployees(tiendaId);
        setEmpleados(empleadosTienda);

        try {
          const presupuestosDiarios = await obtenerPresupuestosDiarios(
            tiendaId,
            selectedFecha,
            selectedFecha,
          );
          const presupuestoExistente =
            presupuestosDiarios.length > 0
              ? presupuestosDiarios[0].budget.toString()
              : "0";
          setPresupuesto(presupuestoExistente);
        } catch (budgetError: any) {
          console.error(
            "No se encontró presupuesto existente para la fecha:",
            budgetError.message,
          );
          setPresupuesto("0");
        }

        setEmpleadosSeleccionados(empleadosTienda);

        setFecha(selectedFecha);

        setSuccess("Datos de la tienda cargados correctamente");
      } catch (err: any) {
        setError(`Error al cargar datos de la tienda: ${err.message}`);
      } finally {
        setLoading(false);
      }
    },
    [tiendas, getStoreEmployees],
  );

  const handleAddEmpleado = useCallback(
    (empleado: DirectusStaff) => {
      if (!empleadosSeleccionados.find((emp) => emp.id === empleado.id)) {
        setEmpleadosSeleccionados((prev) => [...prev, empleado]);
        setError(null);
      }
    },
    [empleadosSeleccionados],
  );

  const handleRemoveEmpleado = useCallback((empleadoId: number) => {
    setEmpleadosSeleccionados((prev) =>
      prev.filter((emp) => emp.id !== empleadoId),
    );
  }, []);

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

      const presupuestoTienda = {
        store_id: tienda!.id,
        budget: presupuestoTotal,
        date: fecha,
      };

      await guardarPresupuestosTienda([presupuestoTienda] as any);

      await eliminarPresupuestosEmpleados(tienda!.id, fecha);

      const nuevosPresupuestosEmpleados = empleadosSeleccionados.map(
        (empleado) => ({
          advisor_id: empleado.id,
          store_id: tienda!.id,
          position_id:
            typeof empleado.position_id === "object"
              ? empleado.position_id.id
              : empleado.position_id,
          date: fecha,
          budget: presupuestoPorEmpleado,
        }),
      );

      await guardarPresupuestosEmpleados(nuevosPresupuestosEmpleados as any);

      setPresupuestosEmpleados(nuevosPresupuestosEmpleados);
      setSuccess("Cambios guardados correctamente");

      recalcularDatos();

      queryClient.invalidateQueries({ queryKey: ["commission-data"] });

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

  const recalcularDatos = useCallback(() => {
    if (!tienda || !presupuesto || empleadosSeleccionados.length === 0) {
      return;
    }

    const datosRecalculados = {
      tienda: tienda.name,
      presupuesto: parseFloat(presupuesto),
      empleados: empleadosSeleccionados.length,
      fecha,
      presupuestoPorEmpleado:
        parseFloat(presupuesto) / empleadosSeleccionados.length,
    };

    setSuccess("Datos recalculados correctamente");
  }, [tienda, presupuesto, empleadosSeleccionados, fecha]);

  const canSave = useCallback(() => {
    return (
      tienda !== null &&
      presupuesto !== "" &&
      parseFloat(presupuesto) > 0 &&
      fecha !== "" &&
      empleadosSeleccionados.length > 0
    );
  }, [tienda, presupuesto, fecha, empleadosSeleccionados]);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const handlePresupuestoChange = useCallback(
    (value: string) => {
      setPresupuesto(value);
      clearMessages();
    },
    [clearMessages],
  );

  const handleFechaChange = useCallback(
    (value: string) => {
      setFecha(value);
      clearMessages();
    },
    [clearMessages],
  );

  return {
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
    setTienda,
    setPresupuesto: handlePresupuestoChange,
    setFecha: handleFechaChange,
    setEmpleadosSeleccionados,
    setLoading,
    setError,
    setSuccess,
    handleAddEmpleado,
    handleRemoveEmpleado,
    handleSaveChanges,
    handleLoadStoreData,
    handleClearForm,
    clearMessages,
    recalcularDatos,
    getStoreEmployees,
    validateForm,
    onSaveComplete,
  };
};
