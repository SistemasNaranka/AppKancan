import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Popover,
} from "@mui/material";
import FilterIcon from '@mui/icons-material/FilterList';
import type { ReservationFilters } from "../types/reservas.types";
import { AVAILABLE_ROOMS, FILTER_STATUSES } from "../types/reservas.types";

interface FiltrosReservasProps {
  filters: ReservationFilters;
  onFiltersChange: (filters: ReservationFilters) => void;
}

const FiltrosReservas: React.FC<FiltrosReservasProps> = ({
  filters,
  onFiltersChange,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const handleChange = (campo: keyof ReservationFilters, valor: string) => {
    onFiltersChange({
      ...filters,
      [campo]: valor,
    });
  };

  const handleLimpiar = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = () => {
    return !!(filters.date || filters.room_name || filters.status);
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<FilterIcon />}
        onClick={handleClick}
        sx={{
          borderColor: hasActiveFilters() ? "#1976d2" : "#e0e0e0",
          color: hasActiveFilters() ? "#1976d2" : "#004680",
          backgroundColor: "#fff",
          textTransform: "none",
          fontWeight: 600,
          minWidth: 100,
          "&:hover": {
            borderColor: "#1976d29a",
            backgroundColor: "rgba(97, 163, 230, 0.04)",
          },
        }}
      >
        Filtros
      </Button>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            mt: 1,
            p: 2,
            minWidth: 320,
            borderRadius: 2,
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Filtro por Fecha */}
          <TextField
            type="date"
            label="Fecha"
            value={filters.date || ""}
            onChange={(e) => handleChange("date", e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
            size="small"
          />

          {/* Filtro por Sala */}
          <TextField
            select
            label="Sala"
            value={filters.room_name || ""}
            onChange={(e) => handleChange("room_name", e.target.value)}
            fullWidth
            size="small"
          >
            <MenuItem value="">Todas las salas</MenuItem>
            {AVAILABLE_ROOMS.map((sala) => (
              <MenuItem key={sala} value={sala}>
                {sala}
              </MenuItem>
            ))}
          </TextField>

          {/* Filtro por Estado */}
          <TextField
            select
            label="Estado"
            value={filters.status || ""}
            onChange={(e) => handleChange("status", e.target.value)}
            fullWidth
            size="small"
          >
            <MenuItem value="">Todos los estados</MenuItem>
            {FILTER_STATUSES.map((estado) => (
              <MenuItem key={estado} value={estado}>
                {estado}
              </MenuItem>
            ))}
          </TextField>

          {/* Botón limpiar */}
          {hasActiveFilters() && (
            <Button
              variant="text"
              onClick={handleLimpiar}
              sx={{ textTransform: "none", alignSelf: "flex-end" }}
            >
              Limpiar filtros
            </Button>
          )}
        </Box>
      </Popover>
    </>
  );
};

export default FiltrosReservas;