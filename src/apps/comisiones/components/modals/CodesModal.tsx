import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Alert,
  IconButton,
  useTheme,
  useMediaQuery,
  DialogTitle,
  Typography,
} from "@mui/material";
import Work from '@mui/icons-material/Work';
import Warning from '@mui/icons-material/Warning';
import { EmployeeSelector } from "../modals/EmployeeSelector";
import { AssignedEmployeesList } from "../modals/AssignedEmployeesList";
import { InlineMessage } from "../modals/InlineMessage";
import { usePermissionsValidation } from "../../hooks/usePermissionsValidation";
import { useEmployeeManagement } from "../../hooks/useEmployeeManagement";
import { getFechaActual } from "../../lib/modalHelpers";
import { DirectusTienda } from "../../types";

// Header del modal de códigos
interface CodesModalHeaderProps {
  tiendaUsuario: DirectusTienda | null;
  fechaActual: string;
}

const CodesModalHeader: React.FC<CodesModalHeaderProps> = ({
  tiendaUsuario,
  fechaActual,
}) => {
  return (
    <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Work />
      Asignar Asesores {tiendaUsuario?.nombre || "Tienda"} - {fechaActual}
    </DialogTitle>
  );
};

// Aviso para múltiples tiendas
interface MultipleStoresWarningProps {
  tiendasCount: number;
}

const MultipleStoresWarning: React.FC<MultipleStoresWarningProps> = ({
  tiendasCount,
}) => {
  return (
    <Alert severity="warning" icon={<Warning />} sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Múltiples Tiendas Asignadas
      </Typography>
      <Typography variant="body2">
        Tienes {tiendasCount} tiendas asignadas. Para usar esta función,
        necesitas tener asignada únicamente una tienda. Por favor, contacta al a
        soporte o sistemas para resolver esta situación.
      </Typography>
    </Alert>
  );
};

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
    canSave,
    hasExistingData,
    hasChanges, // 🔧 NUEVO: Dirty check
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
  const [forceReload, setForceReload] = useState(false);
  const [dataReady, setDataReady] = useState(false); // Nuevo estado para controlar cuando los datos base están listos

  // NUEVO: Función para recargar datos existentes manualmente
  const recargarDatosExistentes = () => {
    if (
      validationCompleted &&
      hasPermission &&
      tiendasCount === 1 &&
      tiendaUsuario
    ) {
      const fechaActual = new Date().toISOString().split("T")[0];
      cargarDatosExistentes(fechaActual, selectedMonth);
    }
  };

  // NUEVO: Función para forzar recarga cuando el modal se abre después de guardar
  const forzarRecargaDatos = () => {
    if (
      isOpen &&
      validationCompleted &&
      hasPermission &&
      tiendasCount === 1 &&
      tiendaUsuario &&
      dataReady // Solo cargar cuando los datos base estén listos
    ) {
      const fechaActual = new Date().toISOString().split("T")[0];
      setDataLoadTriggered(false); // Resetear flag para permitir recarga
      setForceReload(true);
      cargarDatosExistentes(fechaActual, selectedMonth);
    }
  };

  // ✅ NUEVO: Verificar cuando los datos base (asesores y cargos) están listos
  useEffect(() => {
    if (
      isOpen &&
      asesoresDisponibles.length > 0 &&
      cargosDisponibles.length > 0
    ) {
      setDataReady(true);
    }
  }, [isOpen, asesoresDisponibles.length, cargosDisponibles.length]);

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      resetState();
      validatePermissionsAndStores();
      // Resetear estados de guardado y cierre automático
      setSaveSuccessMessage("");
      setShouldAutoClose(false);
      // Forzar recarga inmediata cuando el modal se abre
      setDataLoadTriggered(false);
      setForceReload(false);
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
      dataReady && // Solo cuando los datos base estén listos
      (!dataLoadTriggered || forceReload)
    ) {
      // Siempre cargar datos existentes cuando el modal se abre
      const timer = setTimeout(() => {
        setDataLoadTriggered(true); // Marcar como ejecutado
        setForceReload(false); // Resetear flag de fuerza
        recargarDatosExistentes();
      }, 100); // Delay mínimo ya que los datos ya están listos

      return () => clearTimeout(timer);
    }
  }, [
    isOpen,
    validationCompleted,
    hasPermission,
    tiendasCount,
    tiendaUsuario,
    dataReady,
    dataLoadTriggered,
    forceReload,
  ]);

  // NUEVO: Cargar datos existentes cuando la validación se complete (CON CONTROL ANTI-BUCLE)
  useEffect(() => {
    if (
      isOpen &&
      validationCompleted &&
      hasPermission &&
      tiendasCount === 1 &&
      tiendaUsuario &&
      dataReady && // Solo cuando los datos base estén listos
      (!dataLoadTriggered || forceReload)
    ) {
      const fechaActual = new Date().toISOString().split("T")[0];

      // Siempre cargar datos existentes cuando la validación esté completa
      const timer = setTimeout(() => {
        setDataLoadTriggered(true); // Marcar como ejecutado
        setForceReload(false); // Resetear flag de fuerza
        cargarDatosExistentes(fechaActual, selectedMonth);
      }, 50); // Delay mínimo ya que los datos ya están listos

      return () => clearTimeout(timer);
    }
  }, [
    isOpen,
    validationCompleted,
    hasPermission,
    tiendasCount,
    tiendaUsuario,
    selectedMonth,
    dataReady,
    dataLoadTriggered,
    forceReload,
  ]);

  // RESET de flags cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setDataLoadTriggered(false);
      setForceReload(false);
      setDataReady(false); // Resetear estado de datos listos
    }
  }, [isOpen]);

  // NUEVO: Forzar recarga cuando se detecta que se guardaron datos
  useEffect(() => {
    if (hasSavedData && isOpen) {
      // Si hay datos guardados, forzar recarga después de un breve delay
      const timer = setTimeout(() => {
        forzarRecargaDatos();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [hasSavedData, isOpen]);

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
      setShouldAutoClose(true);
    }
  }, [success, shouldAutoClose]);

  // Ejecutar el cierre automático
  useEffect(() => {
    if (shouldAutoClose) {
      // Mostrar mensaje de éxito por 1.5 segundos y luego cerrar
      const timer = setTimeout(() => {
        // Limpiar mensajes
        clearMessages();

        // Cerrar el modal
        onClose();

        // Refrescar datos en segundo plano (después de cerrar)
        setTimeout(() => {
          if (onAssignmentComplete) {
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

      // Ejecutar pantalla de carga directamente (sin timing issues)
      if (onShowSaveLoading) {
        onShowSaveLoading(); // Sin error = guardado exitoso
      }

      // 🔧 CORRECCIÓN: Llamar a onAssignmentComplete ANTES de cerrar para refrescar datos
      if (onAssignmentComplete) {
        onAssignmentComplete([]);
      }

      // Cerrar el modal
      onClose();
    } catch (error) {
      // Si hay error, ejecutar pantalla de carga con error
      if (onShowSaveLoading) {
        onShowSaveLoading(error); // Con error = mostrar error en pantalla
      }
      // Cerrar modal
      onClose();
    }
  };

  // Función para manejar el cierre del modal
  const handleModalClose = (e?: React.MouseEvent | React.KeyboardEvent) => {
    // Prevenir navegación no deseada
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // ✅ MEJORA: Solo cerrar el modal, sin redirigir
    // El usuario permanece en la vista de Comisiones
    onClose();

    // ✅ OPCIONAL: Si realmente hay múltiples tiendas, solo mostrar advertencia en consola
    if (showMultipleStoresWarning) {
      console.warn("Usuario tiene múltiples tiendas asignadas");
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

  // 🚀 NUEVO: Determinar texto y color del botón dinámicamente
  const getButtonConfig = () => {
    if (saving) {
      return {
        text: "Guardando...",
        bgColor: theme.palette.grey[500],
        cursor: "not-allowed",
        hover: {},
        active: {},
        disabled: true,
        reason: "",
      };
    }

    // 🚀 MEJORA: Si hay datos existentes, verificar cambios primero
    if (hasExistingData) {
      // Si no hay cambios, deshabilitar botón
      if (!hasChanges) {
        return {
          text: `Actualizar Asignación (${empleadosAsignados.length} empleados)`,
          bgColor: theme.palette.grey[400],
          cursor: "not-allowed",
          hover: {},
          active: {},
          disabled: true,
          reason: "Sin cambios - No hay modificaciones",
        };
      }

      // Hay cambios, verificar combinación de roles
      if (!canSave) {
        return {
          text: `Actualizar Asignación (${empleadosAsignados.length} empleados)`,
          bgColor: theme.palette.warning.main,
          cursor: "not-allowed",
          hover: {},
          active: {},
          disabled: true,
          reason: "Requiere: Asesor + Gerente/Coadministrador",
        };
      }

      // Hay cambios y cumple validación
      return {
        text: `Actualizar Asignación (${empleadosAsignados.length} empleados)`,
        bgColor: theme.palette.primary.main,
        cursor: "pointer",
        hover: {
          backgroundColor: theme.palette.primary.dark,
          transform: "translateY(-1px)",
          boxShadow: theme.shadows[4],
        },
        active: {
          transform: "translateY(0)",
        },
        disabled: false,
        reason: "",
      };
    }

    // Modo creación - sin datos existentes
    if (empleadosAsignados.length === 0) {
      return {
        text: "Guardar Asignación",
        bgColor: theme.palette.warning.main,
        cursor: "not-allowed",
        hover: {},
        active: {},
        disabled: true,
        reason: "Agregue empleados primero",
      };
    }

    if (!canSave) {
      return {
        text: `Guardar Asignación (${empleadosAsignados.length} empleados)`,
        bgColor: theme.palette.warning.main,
        cursor: "not-allowed",
        hover: {},
        active: {},
        disabled: true,
        reason: "Requiere: Asesor + Gerente/Coadministrador",
      };
    }

    return {
      text: `Guardar Asignación (${empleadosAsignados.length} empleados)`,
      bgColor: theme.palette.primary.main,
      cursor: "pointer",
      hover: {
        backgroundColor: theme.palette.primary.dark,
        transform: "translateY(-1px)",
        boxShadow: theme.shadows[4],
      },
      active: {
        transform: "translateY(0)",
      },
      disabled: false,
      reason: "",
    };
  };

  const buttonConfig = getButtonConfig();

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
        onClose={(e: React.SyntheticEvent) => {
          // Prevenir navegación no deseada
          e?.preventDefault();
          e?.stopPropagation();
          handleModalClose(e as React.MouseEvent | React.KeyboardEvent);
        }}
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
              onClick={(e) => {
                // Prevenir navegación no deseada
                e?.preventDefault();
                e?.stopPropagation();
                handleModalClose(e);
              }}
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
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
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
                  backgroundColor: buttonConfig.bgColor,
                  color: theme.palette.primary.contrastText,
                  border: "none",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  cursor: buttonConfig.cursor,
                  transition: "all 0.2s",
                  minWidth: 180,
                  "&:hover": buttonConfig.hover,
                  "&:active": buttonConfig.active,
                  "&:disabled": {
                    opacity: 0.6,
                    cursor: "not-allowed",
                  },
                }}
                disabled={buttonConfig.disabled || !hasPermission}
                title={
                  buttonConfig.reason ||
                  (!canSave
                    ? "Debe asignar al menos un gerente o coadministrador y 1 asesor"
                    : "")
                }
              >
                {buttonConfig.text}
              </Box>
            </Box>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};
