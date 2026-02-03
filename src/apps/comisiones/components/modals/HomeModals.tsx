import React from "react";
import { CodesModal } from "./CodesModal";
import { NoDataModal } from "./NoDataModal";
import { EditStoreModalSimplified } from "./EditStoreModalSimplified";
import { EditStoreBudgetModal } from "./EditStoreBudgetModal";

interface HomeModalsProps {
  // Modal states
  showCodesModal: boolean;
  showEditStoreModal: boolean;
  showEditStoreBudgetModal: boolean;
  showNoDataModal: boolean;
  modalTitle: string;
  modalMessage: string;
  selectedMonth: string;
  hasSavedData?: boolean;

  // Modal actions
  onCloseCodesModal: () => void;
  onCloseEditStoreModal: () => void;
  onCloseEditStoreBudgetModal: () => void;
  onCloseNoDataModal: () => void;
  onAssignmentComplete?: (ventasData: any) => void;
  onShowSaveLoading?: (error?: any) => void;
  onSaveComplete?: () => Promise<void>;
}

export const HomeModals: React.FC<HomeModalsProps> = ({
  showCodesModal,
  showEditStoreModal,
  showEditStoreBudgetModal,
  showNoDataModal,
  modalTitle,
  modalMessage,
  selectedMonth,
  hasSavedData,
  onCloseCodesModal,
  onCloseEditStoreModal,
  onCloseEditStoreBudgetModal,
  onCloseNoDataModal,
  onAssignmentComplete,
  onShowSaveLoading,
  onSaveComplete,
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
        onSaveComplete={onSaveComplete}
      />

      {/* Edit Store Budget Modal - PARA USUARIOS CON POLÍTICA DE TIENDA */}
      <EditStoreBudgetModal
        isOpen={showEditStoreBudgetModal}
        onClose={() => {
          // Limpiar estado antes de cerrar para evitar cargas innecesarias
          onCloseEditStoreBudgetModal();
        }}
        selectedMonth={selectedMonth}
        onSaveComplete={onSaveComplete}
      />
    </>
  );
};
