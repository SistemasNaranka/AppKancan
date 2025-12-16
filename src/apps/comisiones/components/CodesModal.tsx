import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Alert,
  useTheme,
  useMediaQuery,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
    handleClearEmpleados,
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
        onHide={clearMessages}
      />

      <Dialog
        open={isOpen}
        onClose={handleModalClose}
        maxWidth="lg"
        fullWidth
        disableEscapeKeyDown={empleadosAsignados.length > 0}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[24],
            maxHeight: isMobile ? '90vh' : '80vh',
          }
        }}
      >
        <CodesModalHeader
          tiendaUsuario={tiendaUsuario}
          fechaActual={fechaActual}
          isMobile={isMobile}
        />

        <DialogContent 
          sx={{ 
            position: "relative",
            p: { xs: 2, sm: 3 },
            backgroundColor: theme.palette.grey[50],
          }}
        >

          {/* Aviso para múltiples tiendas */}
          {showMultipleStoresWarning && (
            <MultipleStoresWarning tiendasCount={tiendasCount} />
          )}

          {/* Mensaje de validación de permisos */}
          {!validationCompleted && !showMultipleStoresWarning && (
            <Alert 
              severity="info" 
              sx={{ 
                mb: 3,
                borderRadius: 2,
                border: `1px solid ${theme.palette.info[200]}`,
                backgroundColor: theme.palette.info[50],
              }}
            >
              Validando permisos y tiendas asignadas...
            </Alert>
          )}

          {/* Mensaje de error de validación */}
          {validationError && !showMultipleStoresWarning && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: 2,
                border: `1px solid ${theme.palette.error[200]}`,
                backgroundColor: theme.palette.error[50],
              }}
            >
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
                  isMobile={isMobile}
                />

                {/* Lista de empleados asignados */}
                <AssignedEmployeesList
                  empleadosAsignados={empleadosAsignados}
                  saving={saving}
                  onRemoveEmpleado={handleRemoveEmpleado}
                  getCargoNombre={getCargoNombre}
                  getTiendaNombre={getTiendaNombre}
                  isMobile={isMobile}
                />
              </Box>
            )}
        </DialogContent>

        <DialogActions
          sx={{
            px: { xs: 2, sm: 3 },
            py: { xs: 2, sm: 2.5 },
            backgroundColor: theme.palette.grey[100],
            borderTop: `1px solid ${theme.palette.grey[200]}`,
          }}
        >
          {showMultipleStoresWarning ? (
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Box
                component="button"
                onClick={handleModalClose}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  backgroundColor: theme.palette.warning.main,
                  color: theme.palette.warning.contrastText,
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: theme.palette.warning.dark,
                    transform: 'translateY(-1px)',
                    boxShadow: theme.shadows[4],
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                }}
              >
                Cerrar y Ir al Inicio
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                gap: 2,
                justifyContent: 'flex-end',
                flexWrap: 'wrap',
              }}
            >
              <Box
                component="button"
                onClick={handleClearEmpleados}
                sx={{
                  px: 3,
                  py: 1.25,
                  borderRadius: 2,
                  backgroundColor: 'transparent',
                  color: theme.palette.text.secondary,
                  border: `1px solid ${theme.palette.grey[300]}`,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: empleadosAsignados.length > 0 ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  minWidth: 100,
                  '&:hover': empleadosAsignados.length > 0 ? {
                    backgroundColor: theme.palette.grey[100],
                    borderColor: theme.palette.grey[400],
                  } : {},
                  '&:disabled': {
                    opacity: 0.6,
                    cursor: 'not-allowed',
                  },
                }}
                disabled={empleadosAsignados.length === 0 || saving}
              >
                Limpiar
              </Box>
              <Box
                component="button"
                onClick={handleSaveWithDate}
                sx={{
                  px: 4,
                  py: 1.25,
                  borderRadius: 2,
                  backgroundColor: canSave ? theme.palette.primary.main : theme.palette.warning.main,
                  color: theme.palette.primary.contrastText,
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: canSave ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  minWidth: 180,
                  '&:hover': canSave ? {
                    backgroundColor: theme.palette.primary.dark,
                    transform: 'translateY(-1px)',
                    boxShadow: theme.shadows[4],
                  } : {},
                  '&:active': canSave ? {
                    transform: 'translateY(0)',
                  } : {},
                  '&:disabled': {
                    opacity: 0.6,
                    cursor: 'not-allowed',
                  },
                }}
                disabled={
                  empleadosAsignados.length === 0 ||
                  saving ||
                  !hasPermission ||
                  !canSave
                }
                title={
                  !canSave
                    ? "Debe asignar al menos un gerente o coadministrador"
                    : ""
                }
              >
                {saving
                  ? "Guardando..."
                  : `Guardar Asignación (${empleadosAsignados.length} empleados)`}
              </Box>
            </Box>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};
