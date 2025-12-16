import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogActions,
  Box,
  Alert,
} from "@mui/material";
import {
  CodesModalHeader,
  MultipleStoresWarning,
  EmployeeSelector,
  AssignedEmployeesList,
  InlineMessage,
  usePermissionsValidation,
  useEmployeeManagement,
  getFechaActual,
} from "./modal";

interface CodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssignmentComplete?: (ventasData: any[]) => void;
  selectedMonth?: string; // Mes seleccionado en formato "MMM YYYY"
}

export const CodesModal: React.FC<CodesModalProps> = ({
  isOpen,
  onClose,
  onAssignmentComplete,
  selectedMonth,
}) => {
  const navigate = useNavigate();

  // Hooks personalizados para la lógica de negocio
  const {
    hasPermission,
    tiendasCount,
    tiendaUsuario,
    validationCompleted,
    showMultipleStoresWarning,
    error: validationError,
    validatePermissionsAndStores,
    handleCloseAndRedirect,
    resetState,
  } = usePermissionsValidation();

  const {
    codigoInput,
    cargoSeleccionado,
    empleadosAsignados,
    asesoresDisponibles,
    cargosDisponibles,
    cargosFiltrados,
    loading,
    saving,
    error,
    success,
    messageType,
    canSave,
    empleadoEncontrado,
    setCodigoInput,
    setCargoSeleccionado,
    handleAddEmpleado,
    handleRemoveEmpleado,
    handleSaveAsignaciones,
    handleKeyPress,
    codigoInputRef,
    getCargoNombre,
    getTiendaNombre,
    clearMessages,
    buscarEmpleadoPorCodigo,
  } = useEmployeeManagement(tiendaUsuario, onAssignmentComplete);

  // Obtener fecha actual
  const fechaActual = getFechaActual(selectedMonth);

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      resetState();
      validatePermissionsAndStores();
    }
  }, [isOpen]);

  // Cargar empleados cuando la validación es exitosa
  useEffect(() => {
    if (validationCompleted && hasPermission && tiendasCount === 1) {
      // La lógica de carga de empleados se maneja dentro del hook useEmployeeManagement
      // cuando cambia la tiendaUsuario
    }
  }, [validationCompleted, hasPermission, tiendasCount, tiendaUsuario]);

  const handleSaveWithDate = () => {
    handleSaveAsignaciones(fechaActual);
  };

  // Función para manejar el cierre del modal
  const handleModalClose = () => {
    if (showMultipleStoresWarning) {
      // En caso de múltiples tiendas, cerrar y navegar al home
      handleCloseAndRedirect(onClose, navigate);
    } else {
      // Cerrar normalmente
      onClose();
    }
  };

  // Obtener mensaje actual para mostrar
  const currentMessage = error || success || "";
  const currentMessageType = error ? "error" : success ? "success" : "info";

  return (
    <>
      {/* Mensaje fijo en la parte superior */}
      <InlineMessage
        message={currentMessage}
        type={currentMessageType}
        duration={5000}
        onHide={clearMessages}
      />

      <Dialog
        open={isOpen}
        onClose={handleModalClose}
        maxWidth="md"
        fullWidth
        disableEscapeKeyDown={empleadosAsignados.length > 0}
      >
        <CodesModalHeader
          tiendaUsuario={tiendaUsuario}
          fechaActual={fechaActual}
        />

        <DialogContent sx={{ position: "relative" }}>
          <DialogContentText sx={{ mb: 3 }}>
            Seleccione los empleados que trabajarán hoy. El sistema calculará
            automáticamente sus presupuestos basados en los porcentajes
            mensuales y el presupuesto diario de la tienda.
          </DialogContentText>

          {/* Aviso para múltiples tiendas */}
          {showMultipleStoresWarning && (
            <MultipleStoresWarning tiendasCount={tiendasCount} />
          )}

          {/* Mensaje de validación de permisos */}
          {!validationCompleted && !showMultipleStoresWarning && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Validando permisos y tiendas asignadas...
            </Alert>
          )}

          {/* Mensaje de error de validación */}
          {validationError && !showMultipleStoresWarning && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {validationError}
            </Alert>
          )}

          {/* Mostrar contenido solo si tiene permisos y una sola tienda */}
          {validationCompleted &&
            hasPermission &&
            tiendasCount === 1 &&
            !showMultipleStoresWarning && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {/* Input para agregar empleado */}
                <EmployeeSelector
                  codigoInput={codigoInput}
                  cargoSeleccionado={cargoSeleccionado}
                  cargosDisponibles={cargosDisponibles}
                  cargosFiltrados={cargosFiltrados}
                  loading={loading}
                  saving={saving}
                  codigoInputRef={codigoInputRef}
                  empleadoEncontrado={empleadoEncontrado}
                  onCodigoInputChange={(value) => {
                    setCodigoInput(value);
                    // Limpiar mensajes cuando el usuario empieza a escribir
                    if (error || success) {
                      clearMessages();
                    }
                  }}
                  onCargoSeleccionadoChange={setCargoSeleccionado}
                  onAddEmpleado={handleAddEmpleado}
                  onKeyPress={handleKeyPress}
                  onBuscarEmpleado={buscarEmpleadoPorCodigo}
                />

                {/* Lista de empleados asignados */}
                <AssignedEmployeesList
                  empleadosAsignados={empleadosAsignados}
                  saving={saving}
                  onRemoveEmpleado={handleRemoveEmpleado}
                  getCargoNombre={getCargoNombre}
                  getTiendaNombre={getTiendaNombre}
                />
              </Box>
            )}
        </DialogContent>

        <DialogActions>
          {showMultipleStoresWarning ? (
            <Button
              onClick={handleModalClose}
              variant="contained"
              color="warning"
            >
              Cerrar y Ir al Inicio
            </Button>
          ) : (
            <>
              <Button
                onClick={onClose}
                variant="outlined"
                sx={{ mr: 1 }}
                disabled={saving}
              >
                {empleadosAsignados.length === 0 ? "Cerrar" : "Cancelar"}
              </Button>
              <Button
                onClick={handleSaveWithDate}
                variant="contained"
                disabled={
                  empleadosAsignados.length === 0 ||
                  saving ||
                  !hasPermission ||
                  !canSave
                }
                color={!canSave ? "warning" : "primary"}
                title={
                  !canSave
                    ? "Debe asignar al menos un gerente o coadministrador"
                    : ""
                }
              >
                {saving
                  ? "Guardando..."
                  : `Guardar Asignación (${empleadosAsignados.length} empleados)`}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};
