import React from "react";
import { ConfigurationPanel } from "./ConfigurationPanel";
import { CodesModal } from "./CodesModal";
import { NoDataModal } from "./NoDataModal";
import { EditStoreModalSimplified } from "./EditStoreModalSimplified";

interface HomeModalsProps {
  // Modal states
  showCodesModal: boolean;
  showEditStoreModal: boolean;
  showNoDataModal: boolean;
  modalTitle: string;
  modalMessage: string;
  selectedMonth: string;
  hasSavedData?: boolean;

  // Modal actions
  onCloseCodesModal: () => void;
  onCloseEditStoreModal: () => void;
  onCloseNoDataModal: () => void;
  onAssignmentComplete?: (ventasData: any) => void;
  onShowSaveLoading?: (error?: any) => void;
}

export const HomeModals: React.FC<HomeModalsProps> = ({
  showCodesModal,
  showEditStoreModal,
  showNoDataModal,
  modalTitle,
  modalMessage,
  selectedMonth,
  hasSavedData,
  onCloseCodesModal,
  onCloseEditStoreModal,
  onCloseNoDataModal,
  onAssignmentComplete,
  onShowSaveLoading,
}) => {
  const handleAssignmentComplete = (ventasData: any) => {
    if (onAssignmentComplete) {
      onAssignmentComplete(ventasData);
    }
  };

  return (
    <>
      {/* Codes Modal */}
      <CodesModal
        isOpen={showCodesModal}
        onClose={() => {
          onCloseCodesModal();
        }}
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

      {/* Edit Store Modal - SIMPLIFICADO */}
      <EditStoreModalSimplified
        isOpen={showEditStoreModal}
        onClose={() => {
          // Limpiar estado antes de cerrar para evitar cargas innecesarias
          onCloseEditStoreModal();
        }}
        selectedMonth={selectedMonth}
      />
    </>
  );
};
