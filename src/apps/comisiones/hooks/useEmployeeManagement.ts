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
  empleadoEncontrado: any | null;

  // Handlers
  setCodigoInput: (value: string) => void;
  setCargoSeleccionado: (value: string) => void;
  handleAddEmpleado: () => Promise<void>;
  handleRemoveEmpleado: (asesorId: number) => Promise<void>;
  handleClearEmpleados: () => void;
  handleSaveAsignaciones: (fechaActual: string) => Promise<void>;
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
  onAssignmentComplete?: (ventasData: any[]) => void
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
    getCurrentMessage,
  } = useEmployeeData([]);

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
    setCodigoInput,
    setCargoSeleccionado: setCargoSeleccionadoInOperations,
    handleAddEmpleado,
    handleRemoveEmpleado,
    handleClearEmpleados,
    handleSaveAsignaciones,
    handleKeyPress,
    codigoInputRef,
    getCargoNombre,
    getTiendaNombre,
    validateExclusiveRole,
    hasRequiredRoles,
    clearMessages,
  } = useEmployeeOperations(tiendaUsuario, onAssignmentComplete);

  // Sincronizar cargo seleccionado entre hooks
  const setCargoSeleccionado = (value: string) => {
    setCargoSeleccionadoInData(value);
    setCargoSeleccionadoInOperations(value);
  };

  // Modificar handleAddEmpleado para incluir datos necesarios
  const handleAddEmpleadoModified = async () => {
    await handleAddEmpleado(asesoresDisponibles, cargosDisponibles);
  };

  // Modificar handleSaveAsignaciones para incluir datos necesarios
  const handleSaveAsignacionesModified = async (fechaActual: string) => {
    await handleSaveAsignaciones(fechaActual, cargosDisponibles);
  };

  // Modificar handleKeyPress para incluir la lógica
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

  // Obtener mensaje actual
  const getCargoNombreWithCargos = (cargoId: any): string => {
    return getCargoNombre(cargoId, cargosDisponibles);
  };

  return {
    codigoInput,
    cargoSeleccionado,
    empleadosAsignados,
    asesoresDisponibles,
    cargosDisponibles,
    cargosFiltrados,
    loading: loading || saving,
    saving,
    error: error || dataError,
    success,
    messageType,
    canSave,
    empleadoEncontrado,
    setCodigoInput,
    setCargoSeleccionado,
    handleAddEmpleado: handleAddEmpleadoModified,
    handleRemoveEmpleado,
    handleClearEmpleados,
    handleSaveAsignaciones: handleSaveAsignacionesModified,
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
