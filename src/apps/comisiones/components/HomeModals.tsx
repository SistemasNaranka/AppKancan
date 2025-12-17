import React from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { useCommission } from "../contexts/CommissionContext";
import { ConfigurationPanel } from "./ConfigurationPanel";
import { CodesModal } from "./CodesModal";
import { NoDataModal } from "./NoDataModal";

interface HomeModalsProps {
  // Modal states
  showConfigModal: boolean;
  showCodesModal: boolean;
  showNoDataModal: boolean;
  modalTitle: string;
  modalMessage: string;
  selectedMonth: string;
  hasSavedData?: boolean;

  // Modal actions
  onCloseConfigModal: () => void;
  onCloseCodesModal: () => void;
  onCloseNoDataModal: () => void;
  onAssignmentComplete?: (ventasData: any) => void;
  onShowSaveLoading?: (error?: any) => void;
}

export const HomeModals: React.FC<HomeModalsProps> = ({
  showConfigModal,
  showCodesModal,
  showNoDataModal,
  modalTitle,
  modalMessage,
  selectedMonth,
  hasSavedData,
  onCloseConfigModal,
  onCloseCodesModal,
  onCloseNoDataModal,
  onAssignmentComplete,
  onShowSaveLoading,
}) => {
  const { state } = useCommission();

  const handleAssignmentComplete = (ventasData: any) => {
    if (onAssignmentComplete) {
      onAssignmentComplete(ventasData);
    }
  };

  return (
    <>
      {/* Configuration Modal */}
      <Dialog
        open={showConfigModal}
        onClose={onCloseConfigModal}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Configuración de Comisiones</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Configure los presupuestos y parámetros de comisiones para el mes
            seleccionado.
          </DialogContentText>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            {/* Panel de Configuración */}
            {state.budgets.length > 0 && (
              <div
                style={{
                  padding: "24px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    marginBottom: "16px",
                  }}
                >
                  Configuración Avanzada
                </h2>
                <ConfigurationPanel mes={selectedMonth} />
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseConfigModal}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Codes Modal */}
      <CodesModal
        isOpen={showCodesModal}
        onClose={onCloseCodesModal}
        selectedMonth={selectedMonth}
        hasSavedData={hasSavedData}
        onShowSaveLoading={onShowSaveLoading}
        onAssignmentComplete={handleAssignmentComplete}
      />

      {/* No Data Modal */}
      <NoDataModal
        open={showNoDataModal}
        onClose={onCloseNoDataModal}
        tiendaNombre="todas las tiendas"
        mesSeleccionado={selectedMonth}
        title={modalTitle}
        message={modalMessage}
      />
    </>
  );
};
