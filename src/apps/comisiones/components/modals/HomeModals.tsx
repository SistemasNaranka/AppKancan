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
    console.log("🔔 [HomeModals] handleAssignmentComplete called with:", ventasData);
    if (onAssignmentComplete) {
      onAssignmentComplete(ventasData);
    }
  };

  // 🚀 NUEVO: Wrapper para onSaveComplete que maneja el flujo de guardado de forma unificada
  // Esto asegura que tanto CodesModal como EditStoreModalSimplified/EditStoreBudgetModal 
  // pasen por el mismo flujo de loading y actualización del contador
  const handleSaveCompleteWrapper = async () => {
    console.log("🔔 [HomeModals] handleSaveCompleteWrapper INICIADO");
    
    if (onShowSaveLoading) {
      // Llamar a handleCodesModalSave sin error = guardado exitoso
      // Esto muestra la pantalla de loading, espera, muestra éxito, y actualiza el contador
      await onShowSaveLoading(undefined);
      console.log("🔔 [HomeModals] handleSaveCompleteWrapper - onShowSaveLoading completado");
    } else if (onSaveComplete) {
      // Fallback: llamar directamente si onShowSaveLoading no existe
      console.log("🔔 [HomeModals] handleSaveCompleteWrapper - calling onSaveComplete directly");
      await onSaveComplete();
    }
  };

  return (
    <>
      {/* Codes Modal */}
      <CodesModal
        isOpen={showCodesModal}
        onClose={() => {
          console.log("🔔 [HomeModals] CodesModal onClose");
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
          console.log("🔔 [HomeModals] EditStoreModalSimplified onClose");
          onCloseEditStoreModal();
        }}
        selectedMonth={selectedMonth}
        onSaveComplete={handleSaveCompleteWrapper}
      />

      {/* Edit Store Budget Modal - PARA USUARIOS CON POLÍTICA DE TIENDA */}
      <EditStoreBudgetModal
        isOpen={showEditStoreBudgetModal}
        onClose={() => {
          // Limpiar estado antes de cerrar para evitar cargas innecesarias
          console.log("🔔 [HomeModals] EditStoreBudgetModal onClose");
          onCloseEditStoreBudgetModal();
        }}
        selectedMonth={selectedMonth}
        onSaveComplete={handleSaveCompleteWrapper}
      />
    </>
  );
};
