import React, { useMemo, useCallback } from "react";
import { Box, Button, Typography, Chip } from "@mui/material";
import CustomSelectionModal from "@/shared/components/selectionmodal/CustomSelectionModal";
import { useSelectionModal } from "@/shared/components/selectionmodal/useSelectionModal";

interface PromotionStoresSectionProps {
  stores: any[];
  tiendasSeleccionadas: (string | number)[];
  isLoadingStores: boolean;
  onStoresSelected: (selected: (string | number)[]) => void;
}

export const PromotionStoresSection: React.FC<PromotionStoresSectionProps> = ({
  stores,
  tiendasSeleccionadas,
  isLoadingStores,
  onStoresSelected,
}) => {
  const { open, openModal, closeModal } = useSelectionModal();

  const storeItems = useMemo(
    () =>
      stores.map((s) => ({
        id: s.id,
        label: s.nombre,
        description: s.empresa || "",
      })),
    [stores]
  );

  const selectedStoreNames = useMemo(() => {
    return stores
      .filter((s) => tiendasSeleccionadas.includes(s.id))
      .map((s) => s.nombre);
  }, [stores, tiendasSeleccionadas]);

  // 🔧 Maneja la confirmación de selección
  const handleConfirmSelection = useCallback(
    (selected: (string | number)[]) => {
      onStoresSelected(selected);
      closeModal();
    },
    [onStoresSelected, closeModal]
  );

  // 🔧 Maneja la cancelación
  const handleCancelSelection = useCallback(() => {
    closeModal();
  }, [closeModal]);

  // 🔥 SOLUCIÓN: Crear una key única basada en las tiendas seleccionadas
  // Esto fuerza al modal a re-renderizarse y leer initialSelected nuevamente
  const modalKey = useMemo(() => {
    return `modal-${tiendasSeleccionadas.join("-")}`;
  }, [tiendasSeleccionadas]);

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom fontWeight={600}>
        Tiendas Aplicables: *
      </Typography>

      <Button
        variant="outlined"
        onClick={openModal}
        disabled={isLoadingStores}
        sx={{ mb: 2 }}
      >
        {tiendasSeleccionadas.length > 0
          ? `${tiendasSeleccionadas.length} tienda(s) seleccionada(s)`
          : "Seleccionar tiendas"}
      </Button>

      {/* 🔥 CLAVE: Agregamos key={modalKey} para forzar re-render */}
      <CustomSelectionModal
        key={modalKey} // ⭐ ESTO RESUELVE EL PROBLEMA
        title="Seleccionar Tiendas"
        open={open}
        onClose={handleCancelSelection}
        onConfirm={handleConfirmSelection}
        items={storeItems}
        initialSelected={tiendasSeleccionadas}
        labelKey="label"
      />

      {selectedStoreNames.length > 0 && (
        <Box display="flex" flexWrap="wrap" gap={1} mt={2}>
          {selectedStoreNames.map((storeName) => (
            <Chip
              key={storeName}
              label={storeName}
              color="primary"
              size="small"
            />
          ))}
        </Box>
      )}
    </Box>
  );
};
