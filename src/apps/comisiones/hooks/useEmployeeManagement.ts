import { useEffect } from "react";
import { DirectusTienda } from "../types/modal";
import { useEmployeeData } from "./useEmployeeData";
import { useEmployeeOperations } from "./useEmployeeOperations";

interface UseEmployeeManagementReturn {
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
  hasChanges: boolean;
  empleadoEncontrado: any | null;

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

  codigoInputRef: React.RefObject<HTMLInputElement>;

  getCargoNombre: (cargoId: any) => string;
  getTiendaNombre: (tiendaId: any) => string;
  validateExclusiveRole: (role: string, asesor: any) => string | null;
  hasRequiredRoles: () => boolean;
  clearMessages: () => void;
  buscarEmpleadoPorCodigo: (codigo: string) => void;
}

export const useEmployeeManagement = (
  tiendaUsuario: DirectusTienda | null,
  onAssignmentComplete?: (ventasData: any[]) => void,
): UseEmployeeManagementReturn => {
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
    hasChanges,
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

  const setCargoSeleccionado = (value: string) => {
    setCargoSeleccionadoInData(value);
    setCargoSeleccionadoInOperations(value);
  };

  const handleAddEmpleadoModified = async () => {
    await handleAddEmpleado(asesoresDisponibles, cargosDisponibles, empleadoEncontrado);
  };

  const handleSaveAsignacionesModified = async (fechaActual: string) => {
    await handleSaveAsignaciones(fechaActual, cargosDisponibles);
  };

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

  const handleKeyPressModified = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddEmpleadoModified();
    }
  };

  useEffect(() => {
    if (tiendaUsuario) {
      loadAsesoresDisponibles();
    }
  }, [tiendaUsuario]);

  useEffect(() => {
    buscarEmpleadoPorCodigo(codigoInput);
  }, [codigoInput, buscarEmpleadoPorCodigo]);



  const getCargoNombreWithCargos = (cargoId: any): string => {
    return getCargoNombre(cargoId, cargosDisponibles);
  };

  const combinedError = error || dataError;

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
    hasChanges,
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
