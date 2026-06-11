// Pestaña "Distribución por Rol": lista de filas editables con rol, tipo de cálculo y porcentaje.

import React from "react";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Tooltip,
  Typography,
} from "@mui/material";
import AddCircleOutline from "@mui/icons-material/AddCircleOutline";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import BadgeIcon from "@mui/icons-material/Badge";
import Percent from "@mui/icons-material/Percent";
import { StyledNumberField } from "./StyledNumberField";
import type { RoleConfigRow } from "./configurationPanel.types";

interface RoleConfigTabProps {
  roleConfigs: RoleConfigRow[];
  cargos: any[];
  loading: boolean;
  loadingCargos: boolean;
  loadingData: boolean;
  onAddRow: () => void;
  onRemoveRow: (id: string) => void;
  onRowChange: (id: string, field: keyof RoleConfigRow, value: any) => void;
}

export const RoleConfigTab: React.FC<RoleConfigTabProps> = ({
  roleConfigs,
  cargos,
  loading,
  loadingCargos,
  loadingData,
  onAddRow,
  onRemoveRow,
  onRowChange,
}) => {
  return (
    <Box>
      <Divider sx={{ mb: 3 }}>
        <Typography variant="overline" color="text.secondary" fontWeight="700">
          Configuración por Roles
        </Typography>
      </Divider>

      {loadingData || loadingCargos ? (
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
          {roleConfigs.map((row) => (
            <Grid container spacing={2} key={row.id} alignItems="center">
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Rol</InputLabel>
                  <Select
                    value={row.role}
                    label="Rol"
                    onChange={(e) => onRowChange(row.id, "role", e.target.value)}
                    startAdornment={
                      <InputAdornment position="start">
                        <BadgeIcon sx={{ fontSize: 18 }} />
                      </InputAdornment>
                    }
                    sx={{ fontSize: "1rem" }}
                  >
                    {cargos.map((c) => (
                      <MenuItem
                        key={c.id || c.name}
                        value={c.name}
                        sx={{ fontSize: "0.95rem" }}
                      >
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 7, sm: 3.5 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo de Cálculo</InputLabel>
                  <Select
                    value={row.calculation_type}
                    label="Tipo de Cálculo"
                    onChange={(e) =>
                      onRowChange(row.id, "calculation_type", e.target.value)
                    }
                    sx={{ fontSize: "1rem" }}
                  >
                    <MenuItem value="Fijo" sx={{ fontSize: "0.95rem" }}>
                      Fijo
                    </MenuItem>
                    <MenuItem value="Distributivo" sx={{ fontSize: "0.95rem" }}>
                      Distributivo
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 5, sm: 3.5 }}>
                <StyledNumberField
                  fullWidth
                  size="small"
                  label="Porcentaje"
                  type="number"
                  value={row.percentage}
                  onChange={(e) =>
                    onRowChange(row.id, "percentage", e.target.value)
                  }
                  disabled={row.calculation_type === "Distributivo"}
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
              <Grid
                size={{ xs: 12, sm: 1 }}
                sx={{ display: "flex", justifyContent: "center" }}
              >
                <Tooltip title="Eliminar este rol">
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
          ))}

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
            Agregar otro rol
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
          Los roles con cálculo <b>Distributivo</b> se ajustan automáticamente a
          0%.
        </Typography>
      </Box>
    </Box>
  );
};
