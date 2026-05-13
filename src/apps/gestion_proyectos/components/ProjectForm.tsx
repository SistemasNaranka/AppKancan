// src/apps/gestion_proyectos/components/ProjectForm.tsx
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
  Autocomplete,
} from "@mui/material";
import DescriptionIcon from '@mui/icons-material/Description';
import BusinessIcon from '@mui/icons-material/Business';
import AddIcon from '@mui/icons-material/Add';
import ContabilidadIcon from '@mui/icons-material/AccountBalance';
import RRHHIcon from '@mui/icons-material/People';
import LogisticaIcon from '@mui/icons-material/LocalShipping';
import DisenoIcon from '@mui/icons-material/DesignServices';
import SistemasIcon from '@mui/icons-material/Computer';
import MercadeoIcon from '@mui/icons-material/Campaign';
import StoreIcon from '@mui/icons-material/Store';
import AdministrativaIcon from '@mui/icons-material/AdminPanelSettings';
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { OPTIONS_STATUS } from "../types";

// Predefined options for benefited area
const AREAS_PREDEFINIDAS = [
  "Contabilidad",
  "Recursos Humanos",
  "Logística",
  "Diseño",
  "Sistemas",
  "Mercadeo",
  "Comercial",
  "Administrativa",
];

// Icon mapping per area
const ICONOS_AREA: Record<string, React.ElementType> = {
  "Contabilidad": ContabilidadIcon,
  "Recursos Humanos": RRHHIcon,
  "Logística": LogisticaIcon,
  "Diseño": DisenoIcon,
  "Sistemas": SistemasIcon,
  "Mercadeo": MercadeoIcon,
  "Comercial": StoreIcon,
  "Administrativa": AdministrativaIcon,
};

interface ProjectFormData {
  name: string;
  benefitedArea: string;
  description: string;
  assignees: string;
  startDate: string;
  estimatedDate: string;
  deliveryDate: string;
  status: string;
  projectType: string;
}

interface ProjectFormProps {
  data: ProjectFormData;
  onChange: (field: keyof ProjectFormData, value: string) => void;
  onAddAssignee?: (name: string) => void;
  onRemoveAssignee?: (index: number) => void;
  assigneesList?: string[];
}

/**
 * Project Data Form
 * Clean and spacious design for better UX
 */
export function ProjectForm({
  data,
  onChange,
  assigneesList = [],
  onAddAssignee,
  onRemoveAssignee,
}: ProjectFormProps) {
  const [newAssignee, setNewAssignee] = useState("");

  const handleAreaChange = (_event: React.SyntheticEvent, value: string | null) => {
    const newValue = value || "";
    onChange("benefitedArea", newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newAssignee.trim()) {
      e.preventDefault();
      onAddAssignee?.(newAssignee.trim());
      setNewAssignee("");
    }
  };

  const handleAddClick = () => {
    if (newAssignee.trim()) {
      onAddAssignee?.(newAssignee.trim());
      setNewAssignee("");
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
          <DescriptionIcon sx={{ color: "#004680", fontSize: 24 }} />
          <Typography variant="h6" fontWeight="600">
            Datos del Proyecto
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* Project Name */}
          <TextField
            label="Nombre del Proyecto"
            value={data.name}
            onChange={(e) => onChange("name", e.target.value)}
            required
            fullWidth
            size="medium"
            placeholder="Ej: Comparación de Archivos"
          />

          {/* Benefited Area with Autocomplete */}
          <Autocomplete
            freeSolo
            options={AREAS_PREDEFINIDAS}
            value={data.benefitedArea || ""}
            onChange={handleAreaChange}
            onInputChange={(_event, value, reason) => {
              if (reason === "input") {
                onChange("benefitedArea", value);
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Área Beneficiada"
                required
                fullWidth
                size="medium"
                placeholder="Selecciona o escribe un área"
                slotProps={{
                  input: {
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <BusinessIcon sx={{ mr: 1, color: "text.secondary" }} />
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  },
                }}
              />
            )}
            renderOption={(props, option) => {
              const { key, ...restProps } = props;
              const Icono = ICONOS_AREA[option] || BusinessIcon;
              return (
                <Box component="li" key={key} {...restProps} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Icono sx={{ fontSize: 18, color: "text.secondary" }} />
                  {option}
                </Box>
              );
            }}
          />

          {/* Status and Type in a row */}
          <Box sx={{ display: "flex", gap: 2 }}>
            <FormControl fullWidth size="medium">
              <InputLabel>Estado</InputLabel>
              <Select
                value={data.status}
                label="Estado"
                onChange={(e) => onChange("status", e.target.value)}
              >
                {OPTIONS_STATUS.map((op) => (
                  <MenuItem key={op.value} value={op.value}>
                    {op.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="medium">
              <InputLabel>Tipo de Proyecto</InputLabel>
              <Select
                value={data.projectType}
                label="Tipo de Proyecto"
                onChange={(e) => onChange("projectType", e.target.value)}
              >
                <MenuItem value="mejora">Actualización</MenuItem>
                <MenuItem value="nuevo">Proyecto Nuevo</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Dates in a row */}
          <Box sx={{ display: "flex", gap: 2 }}>
            <DatePicker
              label="Fecha Inicio"
              value={data.startDate ? dayjs(data.startDate) : null}
              onChange={(newValue) =>
                onChange(
                  "startDate",
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
              value={data.estimatedDate ? dayjs(data.estimatedDate) : null}
              onChange={(newValue) =>
                onChange(
                  "estimatedDate",
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
              label="Fecha Entrega"
              value={data.deliveryDate ? dayjs(data.deliveryDate) : null}
              onChange={(newValue) =>
                onChange(
                  "deliveryDate",
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

          {/* Assignees with chips */}
          <Box>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <TextField
                label="Encargados"
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)}
                onKeyDown={handleKeyDown}
                fullWidth
                size="medium"
                placeholder="Escribe un nombre y presiona Enter"
              />
              <IconButton
                color="primary"
                onClick={handleAddClick}
                disabled={!newAssignee.trim()}
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
            {assigneesList.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1.5 }}>
                {assigneesList.map((name, index) => (
                  <Chip
                    key={index}
                    label={name}
                    onDelete={() => onRemoveAssignee?.(index)}
                    color="primary"
                    variant="outlined"
                    size="medium"
                  />
                ))}
              </Box>
            )}
          </Box>

          {/* Description */}
          <TextField
            label="Descripción"
            value={data.description}
            onChange={(e) => onChange("description", e.target.value)}
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
