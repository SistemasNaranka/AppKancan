import React, { useMemo } from "react";
import { Button, Chip } from "@mui/material";
import CustomSelectionModal from "@/shared/components/selectionmodal/CustomSelectionModal";
import { useSelectionModal } from "@/shared/components/selectionmodal/useSelectionModal";

interface StoreFilterModalProps {
  availableStores: string[];
  selectedStores: string[];
  onStoresSelected: (selected: string[]) => void;
  isLoading?: boolean;
  showButton?: boolean;
  open?: boolean;
  onClose?: () => void;
}

export const StoreFilterModal: React.FC<StoreFilterModalProps> = ({
  availableStores,
  selectedStores,
  onStoresSelected,
  isLoading = false,
  showButton = true,
  open: controlledOpen,
  onClose: controlledOnClose,
}) => {
  const { open: hookOpen, openModal, closeModal } = useSelectionModal();
  const isControlled = controlledOpen !== undefined;
  const modalOpen = isControlled ? controlledOpen : hookOpen;
  const handleClose = controlledOnClose || closeModal;

  // Convertir las tiendas disponibles al formato esperado por el modal
  const storeItems = useMemo(
    () =>
      availableStores.map((storeName) => ({
        id: storeName,
        label: storeName,
        description: "", // Las tiendas no tienen empresa en este contexto
      })),
    [availableStores]
  );

  // Maneja la confirmación de selección
  const handleConfirmSelection = (selected: (string | number)[]) => {
    onStoresSelected(selected as string[]);
    handleClose();
  };

  // Maneja la cancelación
  const handleCancelSelection = () => {
    handleClose();
  };

  // Crear una key única basada en las tiendas seleccionadas para forzar re-render
  const modalKey = useMemo(() => {
    return `modal-${selectedStores.join("-")}`;
  }, [selectedStores]);

  // Texto del título del modal
  const getModalTitle = () => {
    if (selectedStores.length === 0) {
      return "Seleccionar Tiendas";
    }
    return `Seleccionar Tiendas (${selectedStores.length} seleccionada${
      selectedStores.length !== 1 ? "s" : ""
    })`;
  };

  return (
    <>
      {showButton && (
        <Button
          variant="outlined"
          onClick={openModal}
          disabled={isLoading}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            minWidth: { xs: 80, sm: 100 },
            px: { xs: 2, sm: 3 },
            py: 1.5,
            height: 40,
            borderRadius: 1,
            border: 1,
            borderColor: "divider",
            backgroundColor: "background.paper",
            flex: { xs: "1 1 auto", sm: "0 0 auto" },
            "&:hover": {
              backgroundColor: "action.hover",
              borderColor: "primary.main",
            },
            "&.MuiButton-outlined": {
              border: "1px solid",
              borderColor: "divider",
            },
          }}
          startIcon={
            selectedStores.length > 0 && (
              <Chip
                label={selectedStores.length}
                size="medium"
                color="primary"
                sx={{
                  height: 20,
                  minWidth: 20,
                  "& .MuiChip-label": {
                    fontSize: "1rem", // ← SOLO cambia esto para reducir la letra
                    px: 0.5,
                  },
                }}
              />
            )
          }
        >
          Tiendas
        </Button>
      )}

      {/* Modal de selección de tiendas */}
      <CustomSelectionModal
        key={modalKey}
        title={getModalTitle()}
        open={modalOpen}
        onClose={handleCancelSelection}
        onConfirm={handleConfirmSelection}
        items={storeItems}
        initialSelected={selectedStores}
        labelKey="label"
        maxColumns={4}
      />
    </>
  );
};
