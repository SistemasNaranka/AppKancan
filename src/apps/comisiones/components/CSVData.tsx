import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Stack,
  Portal,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from "@mui/material";
import { Summarize, ListAlt, People } from "@mui/icons-material";
import { MesResumen } from "../types";

interface CSVDataProps {
  open: boolean;
  onClose: () => void;
  onSelectType: (type: "General" | "Detallada", roles?: string[]) => void;
  mesResumen: MesResumen | null;
}

const CSVData: React.FC<CSVDataProps> = ({
  open,
  onClose,
  onSelectType,
  mesResumen,
}) => {
  const [selectedType, setSelectedType] = useState<
    "General" | "Detallada" | null
  >(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const availableRoles = mesResumen
    ? [
        ...new Set(
          mesResumen.tiendas.flatMap((t) => t.empleados.map((e) => e.rol))
        ),
      ]
    : [];

  useEffect(() => {
    if (open) {
      setSelectedType(null);
      setSelectedRoles([]);
    }
  }, [open]);

  if (!open) return null;

  return (
    <Portal>
      <Box
        onClick={onClose}
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
        }}
      >
        <Box
          onClick={(e) => e.stopPropagation()}
          sx={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "32px",
            minWidth: "400px",
            maxWidth: "500px",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              marginBottom: "24px",
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            Selecciona el tipo de exportación
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
              mb: 3,
            }}
          >
            <Card
              sx={{
                flex: 1,
                cursor: "pointer",
                transition: "all 0.3s ease-in-out",
                border: "2px solid",
                borderColor:
                  selectedType === "General" ? "primary.main" : "#1976d2",
                bgcolor: selectedType === "General" ? "#fff3e0" : "grey.50",
                minHeight: 180,
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 12px 30px rgba(0,0,0,0.2)",
                  borderColor: "#1565c0",
                  bgcolor: "primary.100",
                },
              }}
              onClick={() => {
                setSelectedType("General");
                onSelectType("General");
              }}
            >
              <CardContent sx={{ textAlign: "center", py: 3 }}>
                <Summarize
                  sx={{ fontSize: 48, color: "primary.main", mb: 1 }}
                />
                <Typography variant="h6" gutterBottom>
                  General
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Resumen por tienda con presupuesto, ventas, cumplimiento y
                  comisiones totales.
                </Typography>
              </CardContent>
            </Card>

            <Card
              sx={{
                flex: 1,
                cursor: "pointer",
                transition: "all 0.3s ease-in-out",
                border: "2px solid",
                borderColor:
                  selectedType === "Detallada" ? "primary.main" : "#1976d2",
                bgcolor: selectedType === "Detallada" ? "#e3f2fd" : "grey.50",
                minHeight: 180,
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 12px 30px rgba(0,0,0,0.2)",
                  borderColor: "#1565c0",
                  bgcolor: "primary.100",
                },
              }}
              onClick={() => setSelectedType("Detallada")}
            >
              <CardContent sx={{ textAlign: "center", py: 3 }}>
                <ListAlt sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
                <Typography variant="h6" gutterBottom>
                  Detallada
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Detalle por empleado incluyendo documento, nombre, rol,
                  presupuesto, ventas, cumplimiento y comisión.
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {selectedType === "Detallada" && (
            <Box sx={{ mb: 3, zIndex: 10000 }}>
              <Typography
                variant="h6"
                sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
              >
                <People color="primary" />
                Seleccionar Cargos
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => {
                    if (selectedRoles.length === availableRoles.length) {
                      setSelectedRoles([]);
                    } else {
                      setSelectedRoles(availableRoles);
                    }
                  }}
                  sx={{ textTransform: "none" }}
                >
                  {selectedRoles.length === availableRoles.length
                    ? "Deseleccionar Todos"
                    : "Seleccionar Todos"}
                </Button>
              </Box>
              <FormControl fullWidth variant="filled" sx={{ zIndex: 10000 }}>
                <InputLabel>Cargos</InputLabel>
                <Select
                  multiple
                  value={selectedRoles}
                  onChange={(e) => setSelectedRoles(e.target.value as string[])}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip
                          key={value}
                          label={value}
                          size="small"
                          color="primary"
                          variant="filled"
                        />
                      ))}
                    </Box>
                  )}
                  MenuProps={{
                    sx: { zIndex: 10001 },
                    PaperProps: {
                      sx: {
                        borderRadius: 2,
                        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                      },
                    },
                  }}
                  sx={{
                    borderRadius: 2,
                    backgroundColor: "grey.50",
                    "&:hover": {
                      backgroundColor: "grey.100",
                    },
                    "&.Mui-focused": {
                      backgroundColor: "grey.100",
                    },
                  }}
                >
                  {availableRoles.map((role) => (
                    <MenuItem
                      key={role}
                      value={role}
                      sx={{
                        "&:hover": {
                          backgroundColor: "primary.main",
                          color: "white",
                        },
                        "&.Mui-selected": {
                          backgroundColor: "#64b5f6",
                          color: "white",
                          "&:hover": {
                            backgroundColor: "primary.main",
                          },
                        },
                      }}
                    >
                      {role}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mt: 3,
                  gap: 2,
                }}
              >
                <Button
                  variant="outlined"
                  onClick={() => setSelectedType(null)}
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    "&:hover": {
                      backgroundColor: "grey.100",
                    },
                  }}
                >
                  Atrás
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    if (selectedRoles.length > 0) {
                      onSelectType("Detallada", selectedRoles);
                    }
                  }}
                  disabled={selectedRoles.length === 0}
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    backgroundColor: "primary.main",
                    "&:hover": {
                      backgroundColor: "primary.dark",
                    },
                    "&:disabled": {
                      backgroundColor: "grey.300",
                    },
                  }}
                >
                  Continuar
                </Button>
              </Box>
            </Box>
          )}

          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Button variant="outlined" onClick={onClose} size="large">
              Cancelar
            </Button>
          </Box>
        </Box>
      </Box>
    </Portal>
  );
};

export default CSVData;
