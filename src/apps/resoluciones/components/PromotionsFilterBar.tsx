import React, { useCallback, useMemo } from "react";
import { Box, Chip, Typography, Button } from "@mui/material";
import { usePromotionsFilter } from "../hooks/usePromotionsFilter";
import { promotionColors } from "../data/mockPromotionsColors";
import DescuentoFilter from "./DescuentoFilter";
import SelectionModal, { SelectionItem } from "@/shared/components/selectionmodal/SelectionModal";
import { useSelectionModal } from "@/shared/components/selectionmodal/useSelectionModal";
import { mockPromotions } from "../data/mockPromotions";

const allPromotionTypes: Record<"temporal" | "fija", string[]> = {
  temporal: ["Black Friday", "Navidad", "2x1", "Halloween"],
  fija: ["Liquidación", "Descuento"],
};

const PromotionsFilterBar: React.FC = () => {
  const {
    tipos: selected,
    setTipos,
    duracion,
    setDuracion,
    tiendas,
    setTiendas,
  } = usePromotionsFilter();

  const tiendaModal = useSelectionModal();

  // 🏬 Tiendas únicas obtenidas del mock
  const tiendasDisponibles: SelectionItem[] = useMemo(() => {
    const allStores = mockPromotions.flatMap((p) => p.tiendas);
    const uniqueStores = [...new Set(allStores)];
    return uniqueStores.map((t) => ({ id: t, label: t }));
  }, []);

  // 🧠 Tipos disponibles según duración
  const availableTipos = useMemo(() => {
    if (!duracion) return Object.keys(promotionColors);
    return allPromotionTypes[duracion];
  }, [duracion]);

  const handleToggleTipo = useCallback(
    (tipo: string) => {
      setTipos(
        selected.includes(tipo)
          ? selected.filter((t) => t !== tipo)
          : [...selected, tipo]
      );
    },
    [selected, setTipos]
  );

  const handleSelectDuracion = useCallback(
    (d: "temporal" | "fija") => {
      setDuracion(d);
      setTipos([]); // reset tipos al cambiar duración
    },
    [setDuracion, setTipos]
  );

  // 🎯 Callback al confirmar tiendas seleccionadas
  const handleConfirmTiendas = useCallback(
    (selectedIds: (string | number)[]) => {
      setTiendas(selectedIds);
    },
    [setTiendas]
  );

  return (
    <Box sx={{ mb: 3 }}>
      {/* 🔹 Filtro de duración */}
      <Typography variant="subtitle2" gutterBottom>
        Filtrar por duración:
      </Typography>
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        {["temporal", "fija"].map((d) => (
          <Chip
            key={d}
            label={d.charAt(0).toUpperCase() + d.slice(1)}
            onClick={() => handleSelectDuracion(d as "temporal" | "fija")}
            color={duracion === d ? "primary" : "default"}
            sx={{ cursor: "pointer" }}
          />
        ))}
      </Box>

      {/* 🔹 Filtro por tipo */}
      <Typography variant="subtitle2" gutterBottom>
        Filtrar por tipo de promoción:
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
        {availableTipos.map((tipo) => (
          <Chip
            key={tipo}
            label={tipo}
            onClick={() => handleToggleTipo(tipo)}
            variant={selected.includes(tipo) ? "filled" : "outlined"}
            sx={{
              bgcolor: selected.includes(tipo)
                ? promotionColors[tipo]
                : "transparent",
              color: selected.includes(tipo)
                ? "#fff"
                : promotionColors[tipo],
              borderColor: promotionColors[tipo],
              cursor: "pointer",
              fontWeight: 500,
            }}
          />
        ))}
      </Box>

      {/* 🔹 Filtro por tiendas */}
      <Typography variant="subtitle2" gutterBottom>
        Filtrar por tiendas:
      </Typography>
      <Button
        variant="outlined"
        onClick={tiendaModal.openModal}
        sx={{ mb: 2 }}
      >
        Seleccionar tiendas ({tiendas.length})
      </Button>

      <SelectionModal
        open={tiendaModal.open}
        onClose={tiendaModal.closeModal}
        onConfirm={handleConfirmTiendas}
        items={tiendasDisponibles}
        mode="select"
        title="Selecciona tiendas"
        initialSelected={tiendas}
        modalHeight={500}
        maxColumns={3}
      />

      <DescuentoFilter />
    </Box>
  );
};

export default React.memo(PromotionsFilterBar);
