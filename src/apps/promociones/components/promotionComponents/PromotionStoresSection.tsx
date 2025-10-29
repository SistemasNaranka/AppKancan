import React, { useMemo } from "react";
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

      <CustomSelectionModal
        title="Seleccionar Tiendas"
        open={open}
        onClose={closeModal}
        onConfirm={onStoresSelected}
        items={storeItems}
        initialSelected={tiendasSeleccionadas}
        labelKey="label"
      />

      {selectedStoreNames.length > 0 && (
        <Box display="flex" flexWrap="wrap" gap={1}>
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
