import React, { useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  useTheme,
  alpha,
} from "@mui/material";
import { Person, Search } from "@mui/icons-material";
import { EmployeeInfoCard } from "./EmployeeInfoCard";
import { DirectusCargo, DirectusAsesor } from "../../types/modal";

interface EmployeeSelectorProps {
  codigoInput: string;
  cargoSeleccionado: string;
  cargosDisponibles: DirectusCargo[];
  cargosFiltrados: DirectusCargo[];
  loading: boolean;
  saving: boolean;
  codigoInputRef: React.RefObject<HTMLInputElement>;
  empleadoEncontrado: DirectusAsesor | null;
  onCodigoInputChange: (value: string) => void;
  onCargoSeleccionadoChange: (value: string) => void;
  onAddEmpleado: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBuscarEmpleado: (codigo: string) => void;
  isMobile?: boolean;
}

export const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({
  codigoInput,
  cargoSeleccionado,
  cargosFiltrados,
  loading,
  saving,
  codigoInputRef,
  empleadoEncontrado,
  onCodigoInputChange,
  onCargoSeleccionadoChange,
  onAddEmpleado,
  onKeyDown,
  onBuscarEmpleado,
  isMobile = false,
}) => {
  const theme = useTheme();

  // Buscar empleado automáticamente cuando cambie el código
  useEffect(() => {
    const timer = setTimeout(() => {
      onBuscarEmpleado(codigoInput);
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timer);
  }, [codigoInput, onBuscarEmpleado]);

  // Establecer valor por defecto "asesor" al cargar
  useEffect(() => {
    if (cargosFiltrados.length > 0 && !cargoSeleccionado) {
      const asesorCargo = cargosFiltrados.find(
        (c) => c.nombre.toLowerCase() === "asesor"
      );
      if (asesorCargo) {
        onCargoSeleccionadoChange("asesor");
      } else {
        onCargoSeleccionadoChange(cargosFiltrados[0].nombre.toLowerCase());
      }
    }
  }, [cargosFiltrados, cargoSeleccionado, onCargoSeleccionadoChange]);

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderRadius: 3,
        border: `1px solid ${theme.palette.grey[200]}`,
        p: { xs: 2, sm: 2.5, md: 3 },
        boxShadow: theme.shadows[1],
      }}
    >
      {/* Título de la sección */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Search sx={{ fontSize: 18, color: theme.palette.primary.main }} />
        </Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: theme.palette.grey[900],
            fontSize: "1.125rem",
          }}
        >
          Agregar Empleado
        </Typography>
      </Box>

      {/* Formulario principal */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          gap: 2,
          alignItems: { xs: "stretch", lg: "flex-end" },
          mb: 1,
        }}
      >
        {/* Select de cargo - PRIMERO */}
        <Box sx={{ minWidth: { xs: "100%", lg: "160px" } }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 500,
              color: theme.palette.grey[600],
              mb: 0.75,
              display: "block",
            }}
          >
            Cargo del Dia
          </Typography>
          <FormControl fullWidth size={isMobile ? "small" : "medium"}>
            <Select
              value={cargoSeleccionado}
              onChange={(e) => onCargoSeleccionadoChange(e.target.value)}
              disabled={loading || saving}
              sx={{
                borderRadius: 2,
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: theme.palette.grey[300],
                  },
                  "&:hover fieldset": {
                    borderColor: theme.palette.primary.main,
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: theme.palette.primary.main,
                    borderWidth: 2,
                  },
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    borderRadius: 2,
                    mt: 0.5,
                    boxShadow: theme.shadows[8],
                  },
                },
              }}
            >
              {cargosFiltrados
                .sort((a, b) => a.id - b.id)
                .map((cargo) => (
                  <MenuItem
                    key={cargo.id}
                    value={cargo.nombre.toLowerCase()}
                    sx={{ py: 1.5 }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: theme.palette.primary.main,
                        }}
                      />
                      {cargo.nombre}
                    </Box>
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Box>

        {/* Campo de código - SEGUNDO */}
        <Box sx={{ minWidth: { xs: "100%", lg: "120px" } }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 500,
              color: theme.palette.grey[600],
              mb: 0.75,
              display: "block",
            }}
          >
            Código
          </Typography>
          <TextField
            ref={codigoInputRef}
            placeholder="0000"
            value={codigoInput}
            onChange={(e) =>
              onCodigoInputChange(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            onKeyDown={onKeyDown}
            disabled={loading || saving}
            autoComplete="off"
            fullWidth
            size={isMobile ? "small" : "medium"}
            slotProps={{
              htmlInput: {
                maxLength: 4,
                style: {
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: "1rem",
                },
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                "& fieldset": {
                  borderColor: theme.palette.grey[300],
                },
                "&:hover fieldset": {
                  borderColor: theme.palette.primary.main,
                },
                "&.Mui-focused fieldset": {
                  borderColor: theme.palette.primary.main,
                  borderWidth: 2,
                },
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: theme.palette.primary.main,
                fontWeight: 500,
              },
            }}
          />
        </Box>

        {/* Tarjeta de información del empleado - TERCERO */}
        <Box
          sx={{
            minWidth: { xs: "100%", lg: "200px" },
            flex: { xs: "none", lg: 1 },
          }}
        >
          <EmployeeInfoCard
            codigoInput={codigoInput}
            empleadoEncontrado={empleadoEncontrado}
            loading={loading}
            isMobile={isMobile}
          />
        </Box>

        {/* Botón agregar - CUARTO */}
        <Box sx={{ minWidth: { xs: "100%", lg: "120px" } }}>
          <Box
            component="button"
            onClick={onAddEmpleado}
            disabled={!codigoInput.trim() || loading || saving}
            sx={{
              width: "100%",
              height: isMobile ? 40 : 48,
              borderRadius: 2,
              border: "none",
              backgroundColor:
                !codigoInput.trim() || loading || saving
                  ? theme.palette.grey[300]
                  : theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor:
                !codigoInput.trim() || loading || saving
                  ? "not-allowed"
                  : "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              "&:hover": {
                backgroundColor:
                  !codigoInput.trim() || loading || saving
                    ? theme.palette.grey[300]
                    : theme.palette.primary.dark,
                transform:
                  !codigoInput.trim() || loading || saving
                    ? "none"
                    : "translateY(-1px)",
                boxShadow:
                  !codigoInput.trim() || loading || saving
                    ? "none"
                    : theme.shadows[4],
              },
              "&:active": {
                transform:
                  !codigoInput.trim() || loading || saving
                    ? "none"
                    : "translateY(0)",
              },
            }}
          >
            <Person sx={{ fontSize: 18 }} />
            Agregar
          </Box>
        </Box>
      </Box>

      {/* Texto explicativo */}
      <Box
        sx={{
          mt: 1,
          p: 1,
          backgroundColor: theme.palette.grey[50],
          borderRadius: 2,
          border: `1px solid ${theme.palette.grey[200]}`,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.grey[600],
            lineHeight: 1.4,
            fontSize: "0.8125rem",
          }}
        >
          Ingrese el código de 4 dígitos del empleado y seleccione el cargo
          correspondiente. El sistema validará automáticamente la información
          antes de agregarlo a la lista.
        </Typography>
      </Box>
    </Box>
  );
};
