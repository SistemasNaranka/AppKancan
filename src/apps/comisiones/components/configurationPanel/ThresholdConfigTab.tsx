// Pestaña "Umbrales de Cumplimiento": filas editables con cumplimiento mínimo, comisión, color y nombre.

import React from "react";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Tooltip,
  Typography,
} from "@mui/material";
import AddCircleOutline from "@mui/icons-material/AddCircleOutline";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import Percent from "@mui/icons-material/Percent";
import { StyledNumberField } from "./StyledNumberField";
import { ColorPickerSelect } from "./ColorPickerSelect";
import type { ThresholdRow } from "./configurationPanel.types";

interface ThresholdConfigTabProps {
  thresholdRows: ThresholdRow[];
  loading: boolean;
  loadingData: boolean;
  onAddRow: () => void;
  onRemoveRow: (id: string) => void;
  onRowChange: (id: string, field: keyof ThresholdRow, value: string) => void;
}

export const ThresholdConfigTab: React.FC<ThresholdConfigTabProps> = ({
  thresholdRows,
  loading,
  loadingData,
  onAddRow,
  onRemoveRow,
  onRowChange,
}) => {
  return (
    <Box>
      <Divider sx={{ mb: 3 }}>
        <Typography variant="overline" color="text.secondary" fontWeight="700">
          Niveles de Cumplimiento
        </Typography>
      </Divider>

      {loadingData ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            py: 6,
            gap: 2,
          }}
        >
          <CircularProgress size={32} thickness={4} />
          <Typography variant="body2" color="text.secondary">
            Cargando información...
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {thresholdRows.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
              <Typography variant="body1" gutterBottom>
                No hay umbrales configurados
              </Typography>
              <Typography variant="body2">
                Agrega al menos un umbral para guardar la configuración
              </Typography>
            </Box>
          ) : (
            thresholdRows.map((row) => (
              <Grid container spacing={2} key={row.id} alignItems="center">
                <Grid size={{ xs: 12, sm: 3 }}>
                  <StyledNumberField
                    fullWidth
                    size="small"
                    label="Cumplimiento Mínimo (%)"
                    type="number"
                    value={row.min_compliance}
                    onChange={(e) =>
                      onRowChange(row.id, "min_compliance", e.target.value)
                    }
                    slotProps={{
                      input: {
                        sx: { fontWeight: "600", fontSize: "1rem" },
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <StyledNumberField
                    fullWidth
                    size="small"
                    label="Comisión (%)"
                    type="number"
                    value={row.pct_commission}
                    onChange={(e) =>
                      onRowChange(row.id, "pct_commission", e.target.value)
                    }
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <Percent sx={{ fontSize: 16 }} />
                          </InputAdornment>
                        ),
                        sx: { fontWeight: "600", fontSize: "1rem" },
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 2 }}>
                  <ColorPickerSelect
                    value={row.color}
                    onChange={(color) => onRowChange(row.id, "color", color)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <StyledNumberField
                    fullWidth
                    size="small"
                    label="Nombre"
                    value={row.name}
                    onChange={(e) =>
                      onRowChange(row.id, "name", e.target.value)
                    }
                    placeholder="Ej: Muy Regular, Regular, Buena..."
                    slotProps={{
                      input: { sx: { fontSize: "1rem" } },
                    }}
                  />
                </Grid>
                <Grid
                  size={{ xs: 12, sm: 1 }}
                  sx={{ display: "flex", justifyContent: "center" }}
                >
                  <Tooltip title="Eliminar este umbral">
                    <IconButton
                      onClick={() => onRemoveRow(row.id)}
                      color="error"
                      size="small"
                    >
                      <DeleteOutline />
                    </IconButton>
                  </Tooltip>
                </Grid>
              </Grid>
            ))
          )}

          <Button
            startIcon={<AddCircleOutline />}
            onClick={onAddRow}
            sx={{
              alignSelf: "flex-start",
              mt: 1,
              textTransform: "none",
              fontWeight: "700",
              color: "#004b8d",
              fontSize: "0.95rem",
            }}
            disabled={loading}
          >
            Agregar otro umbral
          </Button>
        </Box>
      )}

      <Box
        sx={{
          p: 4,
          pt: 0,
          display: "flex",
          alignItems: "center",
          gap: 1,
          color: "text.secondary",
          px: 4,
        }}
      >
        <InfoOutlined fontSize="small" />
        <Typography variant="caption" sx={{ fontSize: "0.9rem" }}>
          Los umbrales se aplican en orden descendente. El primer umbral cuyo
          cumplimiento mínimo sea menor o igual al cumplimiento del empleado
          será el utilizado para calcular su comisión.
        </Typography>
      </Box>
    </Box>
  );
};
