import React, { useState } from "react";
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Typography,
  Box,
  Chip,
  IconButton,
} from "@mui/material";
import {
  Description as DescriptionIcon,
  Business as BusinessIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { opcionesEstadoProyecto } from "../lib/calculos";

interface ProjectFormData {
  nombre: string;
  areaBeneficiada: string;
  descripcion: string;
  encargados: string;
  fechaInicio: string;
  fechaEstimada: string;
  fechaEntrega: string;
  estado: string;
  tipoProyecto: string;
}

interface ProjectFormProps {
  data: ProjectFormData;
  onChange: (field: keyof ProjectFormData, value: string) => void;
  onAddEncargado?: (nombre: string) => void;
  onRemoveEncargado?: (index: number) => void;
  encargadosList?: string[];
}

/**
 * Formulario de Datos del Proyecto
 * Diseño limpio y espacioso para mejor UX
 */
export function ProjectForm({
  data,
  onChange,
  encargadosList = [],
  onAddEncargado,
  onRemoveEncargado,
}: ProjectFormProps) {
  const [nuevoEncargado, setNuevoEncargado] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && nuevoEncargado.trim()) {
      e.preventDefault();
      onAddEncargado?.(nuevoEncargado.trim());
      setNuevoEncargado("");
    }
  };

  const handleAddClick = () => {
    if (nuevoEncargado.trim()) {
      onAddEncargado?.(nuevoEncargado.trim());
      setNuevoEncargado("");
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Paper
        elevation={2}
        sx={{
          p: 3,
          borderRadius: 2,
          height: "100%",
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <DescriptionIcon sx={{ color: "primary.main", fontSize: 24 }} />
          <Typography variant="h6" fontWeight="600">
            Datos del Proyecto
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* Nombre del Proyecto */}
          <TextField
            label="Nombre del Proyecto"
            value={data.nombre}
            onChange={(e) => onChange("nombre", e.target.value)}
            required
            fullWidth
            size="medium"
            placeholder="Ej: Comparación de Archivos"
          />

          {/* Área Beneficiada */}
          <TextField
            label="Área Beneficiada"
            value={data.areaBeneficiada}
            onChange={(e) => onChange("areaBeneficiada", e.target.value)}
            required
            fullWidth
            size="medium"
            placeholder="Contabilidad, Ventas..."
            slotProps={{
              input: {
                startAdornment: (
                  <BusinessIcon sx={{ mr: 1, color: "text.secondary" }} />
                ),
              },
            }}
          />

          {/* Estado y Tipo en fila */}
          <Box sx={{ display: "flex", gap: 2 }}>
            <FormControl fullWidth size="medium">
              <InputLabel>Estado</InputLabel>
              <Select
                value={data.estado}
                label="Estado"
                onChange={(e) => onChange("estado", e.target.value)}
              >
                {opcionesEstadoProyecto.map((op) => (
                  <MenuItem key={op.value} value={op.value}>
                    {op.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="medium">
              <InputLabel>Tipo de Proyecto</InputLabel>
              <Select
                value={data.tipoProyecto}
                label="Tipo de Proyecto"
                onChange={(e) => onChange("tipoProyecto", e.target.value)}
              >
                <MenuItem value="mejora">Mejora</MenuItem>
                <MenuItem value="nuevo">Nueva Creación</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Fechas en fila */}
          <Box sx={{ display: "flex", gap: 2 }}>
            <DatePicker
              label="Fecha Inicio"
              value={data.fechaInicio ? dayjs(data.fechaInicio) : null}
              onChange={(newValue) =>
                onChange(
                  "fechaInicio",
                  newValue ? dayjs(newValue).format("YYYY-MM-DD") : "",
                )
              }
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  size: "medium",
                },
              }}
            />

            <DatePicker
              label="Fecha Estimada"
              value={data.fechaEstimada ? dayjs(data.fechaEstimada) : null}
              onChange={(newValue) =>
                onChange(
                  "fechaEstimada",
                  newValue ? dayjs(newValue).format("YYYY-MM-DD") : "",
                )
              }
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  size: "medium",
                },
              }}
            />

            <DatePicker
              label="Fecha de Entrega Real"
              value={data.fechaEntrega ? dayjs(data.fechaEntrega) : null}
              onChange={(newValue) =>
                onChange(
                  "fechaEntrega",
                  newValue ? dayjs(newValue).format("YYYY-MM-DD") : "",
                )
              }
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: "medium",
                },
              }}
            />
          </Box>

          {/* Encargados con chips */}
          <Box>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <TextField
                label="Encargados"
                value={nuevoEncargado}
                onChange={(e) => setNuevoEncargado(e.target.value)}
                onKeyDown={handleKeyDown}
                fullWidth
                size="medium"
                placeholder="Escribe un nombre y presiona Enter"
              />
              <IconButton
                color="primary"
                onClick={handleAddClick}
                disabled={!nuevoEncargado.trim()}
                sx={{
                  bgcolor: "primary.main",
                  color: "white",
                  width: 44,
                  height: 44,
                  "&:hover": { bgcolor: "primary.dark" },
                  "&:disabled": { bgcolor: "grey.300" },
                }}
              >
                <AddIcon />
              </IconButton>
            </Box>
            {encargadosList.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1.5 }}>
                {encargadosList.map((nombre, index) => (
                  <Chip
                    key={index}
                    label={nombre}
                    onDelete={() => onRemoveEncargado?.(index)}
                    color="primary"
                    variant="outlined"
                    size="medium"
                  />
                ))}
              </Box>
            )}
          </Box>

          {/* Descripción */}
          <TextField
            label="Descripción"
            value={data.descripcion}
            onChange={(e) => onChange("descripcion", e.target.value)}
            fullWidth
            size="medium"
            multiline
            rows={3}
            placeholder="Objetivos del proyecto..."
          />
        </Box>
      </Paper>
    </LocalizationProvider>
  );
}
