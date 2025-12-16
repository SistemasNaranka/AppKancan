import React, { useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
} from "@mui/material";
import { Person, CheckCircle, Warning } from "@mui/icons-material";
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
  onKeyPress: (e: React.KeyboardEvent) => void;
  onBuscarEmpleado: (codigo: string) => void;
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
  onKeyPress,
  onBuscarEmpleado,
}) => {
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

  const hasEmployeeInfo = codigoInput.trim() && empleadoEncontrado;
  const hasNoEmployee = codigoInput.trim() && !empleadoEncontrado;

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Agregar Empleado por Código
      </Typography>

      {/* Primera línea: Controles principales */}
      <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-end", mb: 1.5 }}>
        {/* Campo de código */}
        <TextField
          ref={codigoInputRef}
          label="Código"
          placeholder="0000"
          value={codigoInput}
          onChange={(e) =>
            onCodigoInputChange(e.target.value.replace(/\D/g, "").slice(0, 4))
          }
          onKeyPress={onKeyPress}
          disabled={loading || saving}
          autoComplete="off"
          size="small"
          inputProps={{
            maxLength: 4,
            style: {
              textAlign: "center",
              fontWeight: "bold",
              fontSize: "0.95rem",
            },
          }}
          sx={{
            width: 120,
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: "#e0e0e0",
              },
              "&:hover fieldset": {
                borderColor: "#bdbdbd",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#1976d2",
                borderWidth: 1.5,
              },
            },
            "& .MuiInputLabel-root.Mui-focused": {
              color: "#1976d2",
            },
          }}
        />

        {/* Select de cargo */}
        <FormControl size="small" sx={{ width: 160 }}>
          <InputLabel>Cargo</InputLabel>
          <Select
            value={cargoSeleccionado}
            onChange={(e) => onCargoSeleccionadoChange(e.target.value)}
            label="Cargo"
            disabled={loading || saving}
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "#e0e0e0",
                },
                "&:hover fieldset": {
                  borderColor: "#bdbdbd",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#1976d2",
                  borderWidth: 1.5,
                },
              },
            }}
          >
            {cargosFiltrados.map((cargo) => (
              <MenuItem key={cargo.id} value={cargo.nombre.toLowerCase()}>
                {cargo.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Botón agregar */}
        <Button
          onClick={onAddEmpleado}
          variant="contained"
          disabled={!codigoInput.trim() || loading || saving}
          size="small"
          sx={{
            minWidth: 120,
            height: 40,
            textTransform: "none",
            fontWeight: 500,
          }}
          startIcon={<Person sx={{ fontSize: 18 }} />}
        >
          Agregar
        </Button>

        {/* Panel de información del empleado (mismo nivel) */}
        {(hasEmployeeInfo || hasNoEmployee) && (
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              alignItems: "center",
              px: 1.5,
              py: 0.75,
              backgroundColor: hasEmployeeInfo ? "#f1f8e9" : "#fff3e0",
              border: `1px solid ${hasEmployeeInfo ? "#c8e6c9" : "#ffcc02"}`,
              borderRadius: 1,
              minHeight: 40,
            }}
          >
            {hasEmployeeInfo ? (
              <>
                <CheckCircle
                  fontSize="small"
                  sx={{ color: "#4caf50", mr: 1 }}
                />
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <Typography
                    variant="caption"
                    fontWeight={500}
                    color="#2e7d32"
                    noWrap
                  >
                    {empleadoEncontrado.nombre ||
                      `Empleado ${empleadoEncontrado.id}`}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.5, mt: 0.25 }}>
                    <Chip
                      label={`ID: ${empleadoEncontrado.id}`}
                      size="small"
                      color="success"
                      variant="outlined"
                      sx={{
                        height: 16,
                        fontSize: "0.65rem",
                        "& .MuiChip-label": { px: 0.5 },
                      }}
                    />
                    <Chip
                      label={
                        typeof empleadoEncontrado.tienda_id === "object"
                          ? empleadoEncontrado.tienda_id.nombre
                          : empleadoEncontrado.tienda_id
                      }
                      size="small"
                      color="success"
                      variant="outlined"
                      sx={{
                        height: 16,
                        fontSize: "0.65rem",
                        "& .MuiChip-label": { px: 0.5 },
                      }}
                    />
                  </Box>
                </Box>
              </>
            ) : (
              <>
                <Warning fontSize="small" sx={{ color: "#ff9800", mr: 1 }} />
                <Typography variant="caption" color="#e65100" noWrap>
                  Código {codigoInput} no encontrado
                </Typography>
              </>
            )}
          </Box>
        )}
      </Box>

      {/* Texto explicativo compacto */}
      <Typography variant="caption" color="text.secondary">
        Ingrese el código de 4 dígitos y seleccione el cargo
      </Typography>
    </Box>
  );
};
