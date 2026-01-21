import { useEffect } from "react";
import { DirectusTienda } from "../types/modal";
import { useEmployeeData } from "./useEmployeeData";
import { useEmployeeOperations } from "./useEmployeeOperations";

interface UseEmployeeManagementReturn {
  // Estados
  codigoInput: string;
  cargoSeleccionado: string;
  empleadosAsignados: any[];
  asesoresDisponibles: any[];
  cargosDisponibles: any[];
  cargosFiltrados: any[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  success: string | null;
  messageType: "success" | "error" | "warning" | "info";
  canSave: boolean;
  hasExistingData: boolean;
  isUpdateMode: boolean;
  empleadoEncontrado: any | null;

  // Handlers
  setCodigoInput: (value: string) => void;
  setCargoSeleccionado: (value: string) => void;
  handleAddEmpleado: () => Promise<void>;
  handleRemoveEmpleado: (asesorId: number) => Promise<void>;
  handleClearEmpleados: () => void;
  handleSaveAsignaciones: (fechaActual: string) => Promise<void>;
  cargarDatosExistentes: (
    fecha: string,
    mesSeleccionado?: string,
  ) => Promise<void>;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  onAssignmentComplete?: (ventasData: any[]) => void;

  // Refs para focus
  codigoInputRef: React.RefObject<HTMLInputElement>;

  // Helpers
  getCargoNombre: (cargoId: any) => string;
  getTiendaNombre: (tiendaId: any) => string;
  // Funciones de validación
  validateExclusiveRole: (role: string, asesor: any) => string | null;
  hasRequiredRoles: () => boolean;
  // Función para limpiar mensajes
  clearMessages: () => void;
  // Función para buscar empleado
  buscarEmpleadoPorCodigo: (codigo: string) => void;
}

export const useEmployeeManagement = (
  tiendaUsuario: DirectusTienda | null,
  onAssignmentComplete?: (ventasData: any[]) => void,
): UseEmployeeManagementReturn => {
  // Hook para datos
  const {
    asesoresDisponibles,
    cargosDisponibles,
    cargosFiltrados,
    loading,
    error: dataError,
    empleadoEncontrado,
    loadAsesoresDisponibles,
    setCargoSeleccionado: setCargoSeleccionadoInData,
    buscarEmpleadoPorCodigo,
  } = useEmployeeData([], tiendaUsuario);

  // Hook para operaciones
  const {
    codigoInput,
    cargoSeleccionado,
    empleadosAsignados,
    saving,
    error,
    success,
    messageType,
    canSave,
    hasExistingData,
    isUpdateMode,
    setCodigoInput,
    setCargoSeleccionado: setCargoSeleccionadoInOperations,
    handleAddEmpleado,
    handleRemoveEmpleado,
    handleClearEmpleados,
    handleSaveAsignaciones,
    cargarDatosExistentes,
    codigoInputRef,
    getCargoNombre,
    getTiendaNombre,
    validateExclusiveRole,
    hasRequiredRoles,
    clearMessages,
  } = useEmployeeOperations(tiendaUsuario, onAssignmentComplete);

  // ✅ NUEVO: Sincronizar cargo seleccionado entre hooks
  const setCargoSeleccionado = (value: string) => {
    setCargoSeleccionadoInData(value);
    setCargoSeleccionadoInOperations(value);
  };

  // ✅ NUEVO: Modificar handleAddEmpleado para incluir datos necesarios
  const handleAddEmpleadoModified = async () => {
    await handleAddEmpleado(asesoresDisponibles, cargosDisponibles);
  };

  // ✅ NUEVO: Modificar handleSaveAsignaciones para incluir datos necesarios
  const handleSaveAsignacionesModified = async (fechaActual: string) => {
    await handleSaveAsignaciones(fechaActual, cargosDisponibles);
  };

  // ✅ NUEVO: Modificar cargarDatosExistentes para incluir datos necesarios
  const cargarDatosExistentesModified = async (
    fecha: string,
    mesSeleccionado?: string,
  ) => {
    await cargarDatosExistentes(
      fecha,
      mesSeleccionado,
      asesoresDisponibles,
      cargosDisponibles,
    );
  };

  // ✅ NUEVO: Modificar handleKeyPress para incluir la lógica
  const handleKeyPressModified = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddEmpleadoModified();
    }
  };

  // Cargar datos cuando cambia la tienda
  useEffect(() => {
    if (tiendaUsuario) {
      loadAsesoresDisponibles();
    }
  }, [tiendaUsuario]);

  // ✅ NUEVO: Obtener mensaje actual (combinando ambos hooks)
  const getCargoNombreWithCargos = (cargoId: any): string => {
    return getCargoNombre(cargoId, cargosDisponibles);
  };

  // ✅ NUEVO: Combinar errores de ambos hooks
  const combinedError = error || dataError;

  // ✅ NUEVO: Sincronizar estados de guardado
  const isLoading = loading || saving;

  return {
    codigoInput,
    cargoSeleccionado,
    empleadosAsignados,
    asesoresDisponibles,
    cargosDisponibles,
    cargosFiltrados,
    loading: isLoading,
    saving,
    error: combinedError,
    success,
    messageType,
    canSave,
    hasExistingData,
    isUpdateMode,
    empleadoEncontrado,
    setCodigoInput,
    setCargoSeleccionado,
    handleAddEmpleado: handleAddEmpleadoModified,
    handleRemoveEmpleado,
    handleClearEmpleados,
    handleSaveAsignaciones: handleSaveAsignacionesModified,
    cargarDatosExistentes: cargarDatosExistentesModified,
    handleKeyPress: handleKeyPressModified,
    codigoInputRef,
    getCargoNombre: getCargoNombreWithCargos,
    getTiendaNombre,
    validateExclusiveRole,
    hasRequiredRoles,
    clearMessages,
    buscarEmpleadoPorCodigo,
  };
};
