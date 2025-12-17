import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Alert,
  IconButton,
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
  hasSavedData?: boolean; // Indica si hay datos guardados para mostrar botón X
  onShowSaveLoading?: (error?: any) => void; // Función para ejecutar pantalla de carga (con error si falla)
}

export const CodesModal: React.FC<CodesModalProps> = ({
  isOpen,
  onClose,
  onAssignmentComplete,
  selectedMonth,
  hasSavedData,
  onShowSaveLoading,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
    hasExistingData,
    isUpdateMode,
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
    cargarDatosExistentes,
  } = useEmployeeManagement(tiendaUsuario, onAssignmentComplete);

  // Obtener fecha actual
  const fechaActual = getFechaActual(selectedMonth);

  // 🚀 CONTROL: Evitar ejecuciones múltiples de useEffect (MOVIDO ANTES DE LOS USEEFFECT)
  const [dataLoadTriggered, setDataLoadTriggered] = useState(false);

  // NUEVO: Función para recargar datos existentes manualmente
  const recargarDatosExistentes = () => {
    if (
      validationCompleted &&
      hasPermission &&
      tiendasCount === 1 &&
      tiendaUsuario
    ) {
      const fechaActual = new Date().toISOString().split("T")[0];
      console.log("Recargando datos existentes manualmente...");
      cargarDatosExistentes(fechaActual, selectedMonth);
    }
  };

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      console.log("Modal abierto, inicializando...");
      resetState();
      validatePermissionsAndStores();
      // Resetear estados de guardado y cierre automático
      setSaveSuccessMessage("");
      setShouldAutoClose(false);
    }
  }, [isOpen]);

  // NUEVO: Recargar datos si el modal se abre y no hay empleados cargados (CON CONTROL)
  useEffect(() => {
    if (
      isOpen &&
      validationCompleted &&
      hasPermission &&
      tiendasCount === 1 &&
      tiendaUsuario &&
      !dataLoadTriggered
    ) {
      const fechaActual = new Date().toISOString().split("T")[0];

      // Si ya hay empleados asignados pero no se han cargado datos, forzar recarga
      if (empleadosAsignados.length === 0) {
        console.log(
          "No hay empleados cargados, verificando si debería haber datos..."
        );
        // Delay para asegurar que la validación esté completa
        const timer = setTimeout(() => {
          setDataLoadTriggered(true); // Marcar como ejecutado
          recargarDatosExistentes();
        }, 500);

        return () => clearTimeout(timer);
      }
    }
  }, [
    isOpen,
    validationCompleted,
    hasPermission,
    tiendasCount,
    tiendaUsuario,
    empleadosAsignados.length,
    dataLoadTriggered,
  ]);

  // NUEVO: Cargar datos existentes cuando la validación se complete (CON CONTROL ANTI-BUCLE)
  useEffect(() => {
    if (
      validationCompleted &&
      hasPermission &&
      tiendasCount === 1 &&
      tiendaUsuario &&
      !dataLoadTriggered
    ) {
      const fechaActual = new Date().toISOString().split("T")[0];

      console.log("Validación completa, verificando carga de datos:", {
        validationCompleted,
        hasPermission,
        tiendasCount,
        tiendaUsuario: tiendaUsuario?.id,
        selectedMonth,
        dataLoadTriggered,
      });

      // Solo cargar si es el día actual y es el mes seleccionado
      if (selectedMonth) {
        const [mesNombre, anio] = selectedMonth.split(" ");
        const fechaActualObj = new Date();
        const mesActual = fechaActualObj.toLocaleDateString("es-ES", {
          month: "short",
          year: "numeric",
        });

        console.log("Verificando mes:", { mesActual, selectedMonth });

        if (mesActual.toLowerCase() === selectedMonth.toLowerCase()) {
          // Es el mes actual, cargar datos existentes (comparación case-insensitive)
          console.log("Cargando datos existentes...");
          setDataLoadTriggered(true); // Marcar como ejecutado
          cargarDatosExistentes(fechaActual, selectedMonth);
        } else {
          console.log("No es el mes actual, no se cargan datos existentes");
          setDataLoadTriggered(true); // Marcar como ejecutado aunque no cargue
        }
      } else {
        console.log("No hay selectedMonth, no se cargan datos existentes");
        setDataLoadTriggered(true); // Marcar como ejecutado aunque no cargue
      }
    }
  }, [
    validationCompleted,
    hasPermission,
    tiendasCount,
    tiendaUsuario,
    selectedMonth,
    dataLoadTriggered,
    // NO incluir cargarDatosExistentes para evitar bucles infinitos
  ]);

  // RESET del flag cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setDataLoadTriggered(false);
    }
  }, [isOpen]);

  // Cargar empleados cuando la validación es exitosa
  useEffect(() => {
    if (validationCompleted && hasPermission && tiendasCount === 1) {
      // La lógica de carga de empleados se maneja dentro del hook useEmployeeManagement
      // cuando cambia la tiendaUsuario
    }
  }, [validationCompleted, hasPermission, tiendasCount, tiendaUsuario]);

  // 🚀 NUEVO: Estado para mensaje de guardado exitoso
  const [saveSuccessMessage, setSaveSuccessMessage] = useState("");

  // 🚀 NUEVO: Estado específico para cierre automático
  const [shouldAutoClose, setShouldAutoClose] = useState(false);

  // Este useEffect ya no es necesario ya que el cierre se activa directamente desde handleSaveWithDate
  // Se mantiene por si acaso hay otros lugares que activen el guardado
  useEffect(() => {
    if (success && success.includes("correctamente") && !shouldAutoClose) {
      console.log(
        "✅ Guardado exitoso (vía mensaje) - marcando para cierre automático"
      );
      setShouldAutoClose(true);
    }
  }, [success, shouldAutoClose]);

  // Ejecutar el cierre automático
  useEffect(() => {
    if (shouldAutoClose) {
      console.log("🚀 Ejecutando cierre automático del modal");

      // Mostrar mensaje de éxito por 1.5 segundos y luego cerrar
      const timer = setTimeout(() => {
        console.log("❌ Cerrando modal...");

        // Limpiar mensajes
        clearMessages();

        // Cerrar el modal
        onClose();

        // Refrescar datos en segundo plano (después de cerrar)
        setTimeout(() => {
          if (onAssignmentComplete) {
            console.log("🔄 Actualizando datos...");
            onAssignmentComplete([]);
          }
          // Resetear estados para futuros guardados
          setSaveSuccessMessage("");
          setShouldAutoClose(false);
        }, 200);
      }, 1500); // 1.5 segundos es suficiente para ver el mensaje

      return () => {
        clearTimeout(timer);
      };
    }
  }, [shouldAutoClose, onClose, clearMessages, onAssignmentComplete]);

  const handleSaveWithDate = async () => {
    try {
      await handleSaveAsignaciones(fechaActual);
      // Si llegamos aquí, el guardado fue exitoso
      console.log(
        "✅ Guardado exitoso - ejecutando pantalla de carga inmediatamente"
      );
      // Ejecutar pantalla de carga directamente (sin timing issues)
      if (onShowSaveLoading) {
        onShowSaveLoading(); // Sin error = guardado exitoso
      }
      // Cerrar modal
      onClose();
    } catch (error) {
      // Si hay error, ejecutar pantalla de carga con error
      console.log(
        "❌ Error en guardado - ejecutando pantalla de carga con error:",
        error
      );
      if (onShowSaveLoading) {
        onShowSaveLoading(error); // Con error = mostrar error en pantalla
      }
      // Cerrar modal
      onClose();
    }
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
  const currentMessage = saveSuccessMessage || error || success || "";
  const currentMessageType = saveSuccessMessage
    ? "success"
    : error
    ? "error"
    : success
    ? "success"
    : "info";

  return (
    <>
      {/* Mensaje fijo en la parte superior */}
      <InlineMessage
        message={currentMessage}
        type={currentMessageType}
        onHide={() => {
          // No limpiar el mensaje de guardado exitoso hasta que se cierre el modal
          if (!saveSuccessMessage) {
            clearMessages();
          }
        }}
      />

      <Dialog
        open={isOpen}
        onClose={handleModalClose}
        maxWidth="lg"
        fullWidth
        disableEscapeKeyDown={empleadosAsignados.length > 0 && !hasSavedData}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[24],
            maxHeight: isMobile ? "90vh" : "80vh",
            position: "relative",
          },
        }}
      >
        <CodesModalHeader
          tiendaUsuario={tiendaUsuario}
          fechaActual={fechaActual}
          isMobile={isMobile}
        />

        {/* Botón X para cerrar (solo cuando hay datos guardados) */}
        {hasSavedData && (
          <Box
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              zIndex: 1,
            }}
          >
            <IconButton
              onClick={handleModalClose}
              size="small"
              sx={{
                color: theme.palette.grey[600],
                "&:hover": {
                  backgroundColor: theme.palette.grey[200],
                },
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </IconButton>
          </Box>
        )}

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
                border: `1px solid ${theme.palette.info.light}`,
                backgroundColor: theme.palette.info.light,
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
                border: `1px solid ${theme.palette.error.light}`,
                backgroundColor: theme.palette.error.light,
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
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
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
                    // Limpiar mensajes cuando el usuario empieza a escribir (pero no el mensaje de guardado exitoso)
                    if ((error || success) && !saveSuccessMessage) {
                      clearMessages();
                    }
                  }}
                  onCargoSeleccionadoChange={setCargoSeleccionado}
                  onAddEmpleado={handleAddEmpleado}
                  onKeyDown={handleKeyPress}
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
            px: { xs: 1, sm: 3 },
            py: { xs: 1, sm: 2 },
            backgroundColor: theme.palette.grey[100],
            borderTop: `1px solid ${theme.palette.grey[200]}`,
          }}
        >
          {showMultipleStoresWarning ? (
            <Box
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
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
                  border: "none",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  "&:hover": {
                    backgroundColor: theme.palette.warning.dark,
                    transform: "translateY(-1px)",
                    boxShadow: theme.shadows[4],
                  },
                  "&:active": {
                    transform: "translateY(0)",
                  },
                }}
              >
                Cerrar y Ir al Inicio
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                width: "100%",
                display: "flex",
                gap: 2,
                justifyContent: "flex-end",
                flexWrap: "wrap",
              }}
            >
              <Box
                component="button"
                onClick={handleClearEmpleados}
                sx={{
                  px: 1,
                  py: 1.25,
                  borderRadius: 2,
                  backgroundColor: "transparent",
                  color: theme.palette.text.secondary,
                  border: `1px solid ${theme.palette.grey[300]}`,
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  cursor:
                    empleadosAsignados.length > 0 ? "pointer" : "not-allowed",
                  transition: "all 0.2s",
                  minWidth: 100,
                  "&:hover":
                    empleadosAsignados.length > 0
                      ? {
                          backgroundColor: theme.palette.grey[100],
                          borderColor: theme.palette.grey[400],
                        }
                      : {},
                  "&:disabled": {
                    opacity: 0.6,
                    cursor: "not-allowed",
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
                  backgroundColor: hasExistingData
                    ? theme.palette.grey[500]
                    : canSave
                    ? theme.palette.primary.main
                    : theme.palette.warning.main,
                  color: theme.palette.primary.contrastText,
                  border: "none",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  cursor: hasExistingData
                    ? "not-allowed"
                    : canSave
                    ? "pointer"
                    : "not-allowed",
                  transition: "all 0.2s",
                  minWidth: 180,
                  "&:hover": hasExistingData
                    ? {}
                    : canSave
                    ? {
                        backgroundColor: theme.palette.primary.dark,
                        transform: "translateY(-1px)",
                        boxShadow: theme.shadows[4],
                      }
                    : {},
                  "&:active": hasExistingData
                    ? {}
                    : canSave
                    ? {
                        transform: "translateY(0)",
                      }
                    : {},
                  "&:disabled": {
                    opacity: 0.6,
                    cursor: "not-allowed",
                  },
                }}
                disabled={
                  empleadosAsignados.length === 0 ||
                  saving ||
                  !hasPermission ||
                  !canSave ||
                  hasExistingData
                }
                title={
                  hasExistingData
                    ? "Ya existe una asignación para hoy. Use el botón X para cerrar."
                    : !canSave
                    ? "Debe asignar al menos un gerente o coadministrador"
                    : ""
                }
              >
                {saving
                  ? "Guardando..."
                  : hasExistingData
                  ? `Asignación Existente (${empleadosAsignados.length} empleados)`
                  : `Guardar Asignación (${empleadosAsignados.length} empleados)`}
              </Box>
            </Box>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};
