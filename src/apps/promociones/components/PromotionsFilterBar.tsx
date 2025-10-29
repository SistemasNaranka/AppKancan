import React, { useCallback, useMemo } from "react";
import {
  Box,
  Chip,
  Typography,
  Button,
  FormControlLabel,
  Checkbox,
  Divider,
  Paper,
  Stack,
  CircularProgress,
  Select, MenuItem, InputLabel, FormControl,  ListItemText,OutlinedInput
} from "@mui/material";
import usePromotionsFilter from "../hooks/usePromotionsFilter";
import DescuentoFilter from "./DescuentoFilter";
import { useSelectionModal } from "@/shared/components/selectionmodal/useSelectionModal";
import { obtenerTiendas, obtenerTiposPromocion } from "../api/directus/read";
import { useQuery } from "@tanstack/react-query";
import CustomSelectionModal, { SelectionItem } from "@/shared/components/selectionmodal/CustomSelectionModal";

const PromotionsFilterBar: React.FC = () => {
  const {
    tipos: selected,
    setTipos,
    duracion,
    setDuracion,
    tiendas,
    setTiendas,
    soloVigentes,
    setSoloVigentes,
  } = usePromotionsFilter();

  // Query para obtener tiendas
  const { data: stores = [], isLoading: isLoadingStores } = useQuery({
    queryKey: ["prom_tiendas"],
    queryFn: obtenerTiendas,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });

  // Query para obtener tipos de promoción desde Directus
  const { data: tiposPromocion = [], isLoading: isLoadingTipos } = useQuery({
    queryKey: ["tipos_promocion"],
    queryFn: obtenerTiposPromocion,
    staleTime: 1000 * 60 * 60, // 1 hora
  });

  const tiendaModal = useSelectionModal();

  // Mapear tiendas para el modal
  const tiendasDisponibles: SelectionItem[] = useMemo(() => {
    return stores.map((store) => ({
      id: store.id,
      label: store.nombre,
      description: store.empresa || "",
    }));
  }, [stores]);

  // Filtrar tipos disponibles según duración seleccionada
  const availableTipos = useMemo(() => {
    if (!duracion) return tiposPromocion;
    return tiposPromocion.filter((tipo) => tipo.duracion === duracion);
  }, [duracion, tiposPromocion]);

  // Crear mapa de colores desde los tipos de promoción
  const tipoColorsMap = useMemo(() => {
    const map: Record<string, string> = {};
    tiposPromocion.forEach((tipo) => {
      map[tipo.nombre] = tipo.color || "#000000ff";
    });
    return map;
  }, [tiposPromocion]);

  // Duración por defecto
    React.useEffect(() => {
      if (!duracion) setDuracion("temporal");
    }, [duracion, setDuracion]);

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
    (d: "temporal" | "fija" | null) => {
      setDuracion(d);
      // Limpiar tipos seleccionados cuando cambio de duración
      setTipos([]);
    },
    [setDuracion, setTipos]
  );

  const handleConfirmTiendas = useCallback(
    (selectedIds: (string | number)[]) => {
      setTiendas(selectedIds);
    },
    [setTiendas]
  );

  const isLoading = isLoadingStores || isLoadingTipos;

  return (
    <Paper
    elevation={2}
    sx={{
      p: 3,
      borderRadius: 3,
      backgroundColor: (theme) =>
        theme.palette.mode === "dark" ? "background.paper" : "#fafafa",
      display: "flex",
      flexDirection: "column",
      gap: 3,
    }}
  >
    {/* 🔹 Título general */}
      <Stack direction="row" alignItems="center" spacing={1}>
      <Typography variant="h6" fontWeight={700}>
        Filtros
      </Typography>
      <Divider flexItem sx={{ flexGrow: 1 }} />
  </Stack>

    {isLoading ? (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress size={24} />
      </Box>
    ) : (
      <>
        {/* 🔹 Solo vigentes */}
        <Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={soloVigentes}
                onChange={(e) => setSoloVigentes(e.target.checked)}
                sx={{
                  color: "primary.main",
                  "&.Mui-checked": { color: "primary.main" },
                }}
              />
            }
            label={<Typography fontWeight={500}>Solo vigentes</Typography>}
          />
        </Box>

        <Divider />

          {/* 🔹 Duración */}
          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Duración
            </Typography>
            <Stack direction="row" spacing={1}>

              <Chip
                label="Temporal"
                onClick={() => handleSelectDuracion("temporal")}
                color={duracion === "temporal" ? "primary" : "default"}
                sx={{
                  cursor: "pointer",
                  fontWeight: 500,
                  px: 1,
                  borderRadius: "8px",
                }}
              />
              <Chip
                label="Fija"
                onClick={() => handleSelectDuracion("fija")}
                color={duracion === "fija" ? "primary" : "default"}
                sx={{
                  cursor: "pointer",
                  fontWeight: 500,
                  px: 1,
                  borderRadius: "8px",
                }}
              />
            </Stack>
          </Box>

          {/* 🔹 Tipo de promoción - Dinámico desde Directus */}
          {/* 🔹 Tipo de promoción - Dinámico desde Directus */}
<Box>
  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
    Tipo de promoción
    {duracion && ` (${duracion === "temporal" ? "Temporales" : "Fijas"})`}
  </Typography>

  {availableTipos.length === 0 ? (
    <Typography variant="body2" color="text.secondary" fontStyle="italic">
      {duracion
        ? `No hay tipos de promociones ${
            duracion === "temporal" ? "temporales" : "fijas"
          } disponibles`
        : "Cargando tipos de promoción..."}
    </Typography>
  ) : (
    <>
      {/* 🔸 Acciones arriba del Select */}
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <Button
          size="small"
          variant="outlined"
          color="primary"
          onClick={() => setTipos(availableTipos.map((t) => t.nombre))}
          disabled={selected.length === availableTipos.length}
          sx={{
            textTransform: "none",
            borderRadius: "8px",
            fontWeight: 500,
          }}
        >
          Seleccionar todos
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="error"
          onClick={() => setTipos([])}
          disabled={selected.length === 0}
          sx={{
            textTransform: "none",
            borderRadius: "8px",
            fontWeight: 500,
          }}
        >
          Deseleccionar todos
        </Button>
      </Stack>

      <FormControl fullWidth sx={{ maxWidth: 500 }}>
        <InputLabel id="select-tipos-label">Seleccionar tipos</InputLabel>
        <Select
          labelId="select-tipos-label"
          id="select-tipos"
          multiple
          value={selected}
          onChange={(event) => {
            const value = event.target.value;
            setTipos(typeof value === "string" ? value.split(",") : value);
          }}
          input={
            <OutlinedInput id="select-multiple-chip" label="Seleccionar tipos" />
          }
          renderValue={(selected) => (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 0.5,
                maxHeight: 80,
                overflow: "auto",
              }}
            >
              {selected.map((nombre) => {
                const tipo = availableTipos.find((t) => t.nombre === nombre);
                const color = tipo?.color || "#9e9e9e";
                return (
                  <Chip
                    key={nombre}
                    label={nombre}
                    sx={{
                      bgcolor: color,
                      color: "#fff",
                      fontWeight: 500,
                      borderRadius: "8px",
                    }}
                  />
                );
              })}
            </Box>
          )}
          MenuProps={{
            PaperProps: {
              style: {
                maxHeight: 48 * 8 + 8,
                width: 320,
              },
            },
          }}
        >
          {availableTipos.map((tipo) => (
            <MenuItem key={tipo.id} value={tipo.nombre}>
              <Box
                display="flex"
                alignItems="center"
                gap={1}
                sx={{ width: "100%" }}
              >
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    bgcolor: tipo.color || "#9e9e9e",
                    flexShrink: 0,
                  }}
                />
                <ListItemText
                  primary={tipo.nombre}
                  sx={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                />
                {selected.includes(tipo.nombre) && (
                  <Typography
                    variant="body2"
                    color="primary"
                    fontWeight={600}
                  >
                    ✓
                  </Typography>
                )}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  )}
</Box>


          {/* 🔹 Tiendas */}
          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Tiendas
            </Typography>
            <Button
              variant="outlined"
              onClick={tiendaModal.openModal}
              disabled={isLoadingStores}
              sx={{
                textTransform: "none",
                fontWeight: 500,
                borderRadius: "8px",
              }}
            >
              {isLoadingStores 
                ? "Cargando..." 
                : `Seleccionar tiendas (${tiendas.length})`}
            </Button>
          </Box>

          <Divider />

          {/* 🔹 Descuento */}
          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Descuento máximo
            </Typography>
            <DescuentoFilter />
          </Box>

          {/* Modal de tiendas */}
          <CustomSelectionModal
            open={tiendaModal.open}
            onClose={tiendaModal.closeModal}
            onConfirm={handleConfirmTiendas}
            items={tiendasDisponibles}
            mode="select"
            title="Selecciona tiendas"
            initialSelected={tiendas}
            maxColumns={3}
          />
        </>
      )}
    </Paper>
  );
};

export default React.memo(PromotionsFilterBar);