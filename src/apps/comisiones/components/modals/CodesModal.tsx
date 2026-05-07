import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, Box, Alert, IconButton, useTheme, useMediaQuery } from "@mui/material";
import { EmployeeSelector } from "../modals/EmployeeSelector";
import { AssignedEmployeesList } from "../modals/AssignedEmployeesList";
import { InlineMessage } from "../modals/InlineMessage";
import { usePermissionsValidation } from "../../hooks/usePermissionsValidation";
import { useEmployeeManagement } from "../../hooks/useEmployeeManagement";
import { getFechaActual } from "../../lib/modalHelpers";
import { CodesModalHeader, MultipleStoresWarning } from "./CodesModal.parts";
import { CodesModalFooter } from "./CodesModal.footer";

interface CodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssignmentComplete?: (ventasData: any[]) => void;
  selectedMonth?: string;
  hasSavedData?: boolean;
  onShowSaveLoading?: (error?: any) => void;
  tiendaProp?: any; // NUEVO
}

export const CodesModal: React.FC<CodesModalProps> = ({
  isOpen, onClose, onAssignmentComplete, selectedMonth, hasSavedData, onShowSaveLoading,
  tiendaProp, // NUEVO
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [dataLoadTriggered, setDataLoadTriggered] = useState(false);
  const [forceReload, setForceReload] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState("");
  const [shouldAutoClose, setShouldAutoClose] = useState(false);

  const {
    hasPermission, tiendasCount, tiendaUsuario, validationCompleted,
    showMultipleStoresWarning, error: validationError, validatePermissionsAndStores, resetState,
  } = usePermissionsValidation();

  // Si se pasa tiendaProp (ej. desde el dashboard por un Admin), usar esa en lugar de la del usuario
  const tiendaActual = tiendaProp || tiendaUsuario;

  const {
    codigoInput, cargoSeleccionado, empleadosAsignados, asesoresDisponibles,
    cargosDisponibles, cargosFiltrados, loading, saving, error, success,
    canSave, hasExistingData, hasChanges, empleadoEncontrado, setCodigoInput,
    setCargoSeleccionado, handleAddEmpleado, handleRemoveEmpleado,
    handleClearEmpleados, handleSaveAsignaciones, handleKeyPress,
    codigoInputRef, getCargoNombre, getTiendaNombre, clearMessages,
    buscarEmpleadoPorCodigo, cargarDatosExistentes,
  } = useEmployeeManagement(tiendaActual, onAssignmentComplete);

  const fechaActual = getFechaActual(selectedMonth);

  // --- Efectos de Carga y Validación (Lógica Intacta) ---
  useEffect(() => {
    if (isOpen && asesoresDisponibles.length > 0 && cargosDisponibles.length > 0) {
      setDataReady(true);
    }
  }, [isOpen, asesoresDisponibles.length, cargosDisponibles.length]);

  useEffect(() => {
    if (isOpen) {
      resetState();
      validatePermissionsAndStores();
      setSaveSuccessMessage("");
      setShouldAutoClose(false);
      setDataLoadTriggered(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && validationCompleted && hasPermission && (tiendasCount === 1 || tiendaProp) && tiendaActual && dataReady && (!dataLoadTriggered || forceReload)) {
      const timer = setTimeout(() => {
        setDataLoadTriggered(true);
        setForceReload(false);
        const fecha = new Date().toISOString().split("T")[0];
        cargarDatosExistentes(fecha, selectedMonth);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, validationCompleted, hasPermission, tiendasCount, tiendaActual, dataReady, dataLoadTriggered, forceReload, tiendaProp]);

  useEffect(() => {
    if (shouldAutoClose) {
      const timer = setTimeout(() => {
        clearMessages();
        onClose();
        if (onAssignmentComplete) onAssignmentComplete([]);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [shouldAutoClose, onClose]);

  const handleSaveWithDate = async () => {
    try {
      await handleSaveAsignaciones(fechaActual);
      if (onShowSaveLoading) onShowSaveLoading();
      if (onAssignmentComplete) onAssignmentComplete([]);
      onClose();
    } catch (err) {
      if (onShowSaveLoading) onShowSaveLoading(err);
      onClose();
    }
  };

  const currentMessage = saveSuccessMessage || error || success || "";
  const currentMessageType = saveSuccessMessage ? "success" : error ? "error" : success ? "success" : "info";

  return (
    <>
      <InlineMessage message={currentMessage} type={currentMessageType} onHide={() => !saveSuccessMessage && clearMessages()} />

      <Dialog
        open={isOpen}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, maxHeight: isMobile ? "90vh" : "80vh", position: "relative" } }}
      >
        <CodesModalHeader tiendaUsuario={tiendaActual} fechaActual={fechaActual} />

        {hasSavedData && (
          <Box sx={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}>
            <IconButton onClick={onClose} size="small"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></IconButton>
          </Box>
        )}

        <DialogContent sx={{ p: { xs: 2, sm: 3 }, backgroundColor: theme.palette.grey[50], display: "flex", flexDirection: "column" }}>
          {showMultipleStoresWarning && !tiendaProp && <MultipleStoresWarning tiendasCount={tiendasCount} />}
          
          {validationCompleted && hasPermission && (tiendasCount === 1 || tiendaProp) && !showMultipleStoresWarning && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <EmployeeSelector
                codigoInput={codigoInput} cargoSeleccionado={cargoSeleccionado}
                cargosDisponibles={cargosDisponibles} cargosFiltrados={cargosFiltrados}
                loading={loading} saving={saving} codigoInputRef={codigoInputRef}
                empleadoEncontrado={empleadoEncontrado} onAddEmpleado={handleAddEmpleado}
                onCodigoInputChange={setCodigoInput} onCargoSeleccionadoChange={setCargoSeleccionado}
                onKeyDown={handleKeyPress} onBuscarEmpleado={buscarEmpleadoPorCodigo}
              />
              <AssignedEmployeesList
                empleadosAsignados={empleadosAsignados} saving={saving}
                onRemoveEmpleado={handleRemoveEmpleado} getCargoNombre={getCargoNombre} getTiendaNombre={getTiendaNombre}
              />
            </Box>
          )}
        </DialogContent>

        <CodesModalFooter
          showMultipleStoresWarning={showMultipleStoresWarning}
          saving={saving}
          hasExistingData={hasExistingData}
          hasChanges={hasChanges}
          canSave={canSave}
          empleadosAsignados={empleadosAsignados}
          hasPermission={hasPermission}
          onClose={onClose}
          onClear={handleClearEmpleados}
          onSave={handleSaveWithDate}
        />
      </Dialog>
    </>
  );
};