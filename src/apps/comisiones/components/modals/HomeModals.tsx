import React from "react";
import { CodesModal } from "./CodesModal";
import { NoDataModal } from "./NoDataModal";
import { EditStoreModalSimplified } from "./EditStoreModalSimplified";
import { EditStoreBudgetModal } from "./EditStoreBudgetModal";

interface HomeModalsProps {
  showCodesModal: boolean;
  showEditStoreModal: boolean;
  showEditStoreBudgetModal: boolean;
  showNoDataModal: boolean;
  modalTitle: string;
  modalMessage: string;
  selectedMonth: string;
  hasSavedData?: boolean;
  tiendaSeleccionada?: any;

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
  tiendaSeleccionada,
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

  const handleSaveCompleteWrapper = async () => {
    
    if (onShowSaveLoading) {
      await onShowSaveLoading(undefined);
    } else if (onSaveComplete) {
      await onSaveComplete();
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
        tiendaProp={tiendaSeleccionada}
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
          onCloseEditStoreModal();
        }}
        selectedMonth={selectedMonth}
        tiendaProp={tiendaSeleccionada}
        onSaveComplete={handleSaveCompleteWrapper}
      />

      {/* Edit Store Budget Modal - PARA USUARIOS CON POLÍTICA DE TIENDA */}
      <EditStoreBudgetModal
        isOpen={showEditStoreBudgetModal}
        onClose={() => {
          onCloseEditStoreBudgetModal();
        }}
        selectedMonth={selectedMonth}
        tiendaProp={tiendaSeleccionada}
        onSaveComplete={handleSaveCompleteWrapper}
      />
    </>
  );
};
