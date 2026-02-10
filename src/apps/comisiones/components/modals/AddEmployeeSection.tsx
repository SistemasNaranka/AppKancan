import React from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import { Person, Search, CheckCircle } from "@mui/icons-material";

interface AddEmployeeSectionProps {
  cargoSeleccionado: number | "";
  codigoEmpleado: string;
  empleadoEncontrado: any;
  cargos: any[];
  onCargoChange: (cargo: number) => void;
  onCodigoChange: (codigo: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onAgregar: () => void;
}

export const AddEmployeeSection: React.FC<AddEmployeeSectionProps> = ({
  cargoSeleccionado,
  codigoEmpleado,
  empleadoEncontrado,
  cargos,
  onCargoChange,
  onCodigoChange,
  onKeyPress,
  onAgregar,
}) => {
  return (
    <Box
      sx={{
        p: 2.5,
        mb: 2.5,
        border: "1px solid #e0e0e0",
        borderRadius: 2,
        bgcolor: "#fafafa",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Search sx={{ color: "primary.main" }} />
        <Typography variant="h6" fontWeight="600">
          Agregar Empleado
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "flex-end",
        }}
      >
        {/* Cargo del Día */}
        <Box
          sx={{
            flex: {
              xs: "1 1 100%",
              sm: "1 1 calc(50% - 8px)",
              md: "2",
            },
          }}
        >
          <Typography
            variant="caption"
            sx={{
              mb: 0.5,
              fontWeight: 600,
              color: "text.secondary",
              display: "block",
            }}
          >
            Cargo del Día
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={cargoSeleccionado}
              onChange={(e) => onCargoChange(e.target.value as number)}
              displayEmpty
              sx={{
                bgcolor: "white",
                borderRadius: 2,
                "& .MuiSelect-select": {
                  py: 1,
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderWidth: 2,
                  borderColor: "grey.300",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "primary.main",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderWidth: 2,
                  borderColor: "primary.main",
                },
              }}
            >
              <MenuItem value="" disabled sx={{ display: 'none' }}>
                <em>Seleccionar cargo</em>
              </MenuItem>
              {cargos.map((cargo) => (
                <MenuItem key={cargo.id} value={cargo.id}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        bgcolor: "primary.main",
                      }}
                    />
                    {cargo.nombre}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Código */}
        <Box
          sx={{
            flex: {
              xs: "1 1 100%",
              sm: "1 1 calc(50% - 8px)",
              md: "1.5",
            },
          }}
        >
          <Typography
            variant="caption"
            sx={{
              mb: 0.5,
              fontWeight: 600,
              color: "text.secondary",
              display: "block",
            }}
          >
            Código
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="..."
            value={codigoEmpleado}
            onChange={(e) => onCodigoChange(e.target.value.slice(0, 4))}
            onKeyDown={onKeyPress}
            type="number"
            inputProps={{ maxLength: 4 }}
            sx={{
              bgcolor: "white",
              "& .MuiInputBase-input": {
                py: 1,
                textAlign: "center",
                fontWeight: 600,
                "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button": {
                  WebkitAppearance: "none",
                  margin: 0,
                },
                "&[type=number]": {
                  MozAppearance: "textfield",
                },
              },
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                "& fieldset": {
                  borderColor: "grey.300",
                  borderWidth: 2,
                },
                "&:hover fieldset": {
                  borderColor: "primary.main",
                },
                "&.Mui-focused fieldset": {
                  borderWidth: 2,
                },
              },
            }}
          />
        </Box>

        {/* Empleado Encontrado y Botón */}
        <Box
          sx={{
            flex: { xs: "1 1 100%", md: "4" },
            display: "flex",
            gap: 2,
            alignItems: "flex-end",
            flexWrap: { xs: "wrap", sm: "nowrap" },
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {empleadoEncontrado ? (
              <Box
                sx={{
                  px: 2,
                  py: 1,
                  bgcolor: "#e8f5e9",
                  border: "1px solid",
                  borderColor: "#66bb6a",
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  height: "40px",
                }}
              >
                <CheckCircle sx={{ color: "#2e7d32", fontSize: 20 }} />
                <Typography
                  variant="body2"
                  fontWeight="700"
                  color="#1b5e20"
                  noWrap
                  sx={{ fontSize: "0.9rem" }}
                >
                  {empleadoEncontrado.nombre}
                </Typography>
                <Box
                  sx={{
                    bgcolor: "rgba(46, 125, 50, 0.1)",
                    borderRadius: 1.5,
                    px: 0.8,
                    py: 0.2,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <Typography
                    variant="caption"
                    fontWeight="600"
                    color="#2e7d32"
                    sx={{ fontSize: "0.7rem" }}
                  >
                    Cod. {empleadoEncontrado.id}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box
                sx={{
                  px: 2,
                  py: 1,
                  height: "40px",
                  border: "1px dashed #e0e0e0",
                  borderRadius: 2,
                  bgcolor: "#fafafa",
                }}
              />
            )}
          </Box>

          <Box sx={{ minWidth: "120px" }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              startIcon={<Person />}
              onClick={onAgregar}
              disabled={!empleadoEncontrado || !cargoSeleccionado}
              sx={{
                py: 1,
                fontSize: "0.85rem",
                fontWeight: 700,
                borderRadius: 2,
                textTransform: "none",
                bgcolor: "primary.dark",
                height: "40px",
                boxShadow: "none",
                whiteSpace: "nowrap",
                "&:hover": {
                  bgcolor: "primary.main",
                  boxShadow: 2,
                },
              }}
            >
              Agregar
            </Button>
          </Box>
        </Box>
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          mt: 1,
          display: "block",
          fontStyle: "normal",
          textAlign: "left",
          pl: 1,
          fontSize: "0.75rem",
        }}
      >
        Ingrese el código de 4 dígitos del empleado y seleccione el cargo
        correspondiente. El sistema validará automáticamente la información
        antes de agregarlo a la lista.
      </Typography>
    </Box>
  );
};
