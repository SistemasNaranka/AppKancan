import React from "react";
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  InputAdornment,
  OutlinedInput,
  SelectChangeEvent,
} from "@mui/material";
import {
  Search as SearchIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";

interface GarantiaFilters {
  estado?: string[];
  tipo_garantia?: string[];
  fecha_inicio?: string;
  fecha_fin?: string;
  search?: string;
  tienda_id?: number;
}

interface GarantiaFiltersProps {
  filters: GarantiaFilters;
  onFiltersChange: (filters: Partial<GarantiaFilters>) => void;
  onClearFilters: () => void;
}

const ESTADO_OPTIONS = [
  { value: "pendiente", label: "Pendiente", color: "#F7B036" },
  { value: "en_revision", label: "En Revisión", color: "#3B82F6" },
  { value: "aprobada", label: "Aprobada", color: "#10B981" },
  { value: "rechazada", label: "Rechazada", color: "#EF4444" },
  { value: "completada", label: "Completada", color: "#6366F1" },
  { value: "cancelada", label: "Cancelada", color: "#9CA3AF" },
];

const TIPO_OPTIONS = [
  { value: "defecto_fabrica", label: "Defecto de Fábrica" },
  { value: "daño_producto", label: "Daño en Producto" },
  { value: "no_funciona", label: "No Funciona" },
  { value: "cambio_producto", label: "Cambio de Producto" },
  { value: "reembolso", label: "Reembolso" },
  { value: "otra", label: "Otra" },
];

export const GarantiaFiltersComponent: React.FC<GarantiaFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
}) => {
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ search: event.target.value });
  };

  const handleEstadoChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    onFiltersChange({
      estado: value.length > 0 ? value : undefined,
    });
  };

  const handleTipoChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    onFiltersChange({
      tipo_garantia: value.length > 0 ? value : undefined,
    });
  };

  const handleFechaInicioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ fecha_inicio: event.target.value || undefined });
  };

  const handleFechaFinChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ fecha_fin: event.target.value || undefined });
  };

  const hasActiveFilters = 
    filters.search ||
    (filters.estado && filters.estado.length > 0) ||
    (filters.tipo_garantia && filters.tipo_garantia.length > 0) ||
    filters.fecha_inicio ||
    filters.fecha_fin;

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        p: 2,
        borderRadius: 2,
        mb: 2,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {/* Fila de búsqueda y filtros principales */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
        {/* Búsqueda */}
        <TextField
          placeholder="Buscar por cliente, producto, factura..."
          value={filters.search || ""}
          onChange={handleSearchChange}
          size="small"
          sx={{ minWidth: 280, flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />

        {/* Filtro por estado */}
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Estado</InputLabel>
          <Select
            multiple
            value={filters.estado || []}
            onChange={handleEstadoChange}
            input={<OutlinedInput label="Estado" />}
            renderValue={(selected) => (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {selected.map((value) => {
                  const option = ESTADO_OPTIONS.find(opt => opt.value === value);
                  return <Chip key={value} label={option?.label || value} size="small" />;
                })}
              </Box>
            )}
          >
            {ESTADO_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Chip
                  label={option.label}
                  size="small"
                  sx={{ 
                    bgcolor: option.color + "20", 
                    color: option.color,
                    mr: 1 
                  }}
                />
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Filtro por tipo */}
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Tipo</InputLabel>
          <Select
            multiple
            value={filters.tipo_garantia || []}
            onChange={handleTipoChange}
            input={<OutlinedInput label="Tipo" />}
            renderValue={(selected) => (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {selected.map((value) => {
                  const option = TIPO_OPTIONS.find(opt => opt.value === value);
                  return <Chip key={value} label={option?.label || value} size="small" />;
                })}
              </Box>
            )}
          >
            {TIPO_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Botón limpiar filtros */}
        {hasActiveFilters && (
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<ClearIcon />}
            onClick={onClearFilters}
            sx={{ minWidth: 140 }}
          >
            Limpiar Filtros
          </Button>
        )}
      </Box>

      {/* Fila de filtros de fecha */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <TextField
          label="Fecha desde"
          type="date"
          value={filters.fecha_inicio || ""}
          onChange={handleFechaInicioChange}
          size="small"
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 160 }}
        />
        <TextField
          label="Fecha hasta"
          type="date"
          value={filters.fecha_fin || ""}
          onChange={handleFechaFinChange}
          size="small"
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 160 }}
        />
      </Box>
    </Box>
  );
};
