// src/apps/reservas/components/FiltrosReservas.tsx

import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Popover,
} from "@mui/material";
import { FilterList as FilterIcon } from "@mui/icons-material";
import type { FiltrosReserva } from "../types/reservas.types";
import { SALAS_DISPONIBLES, ESTADOS_FILTRO } from "../types/reservas.types";

interface FiltrosReservasProps {
  filtros: FiltrosReserva;
  onFiltrosChange: (filtros: FiltrosReserva) => void;
}

const FiltrosReservas: React.FC<FiltrosReservasProps> = ({
  filtros,
  onFiltrosChange,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const handleChange = (campo: keyof FiltrosReserva, valor: string) => {
    onFiltrosChange({
      ...filtros,
      [campo]: valor,
    });
  };

  const handleLimpiar = () => {
    onFiltrosChange({});
  };

  const tieneFiltrosActivos = () => {
    return !!(filtros.fecha || filtros.nombre_sala || filtros.estado);
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<FilterIcon />}
        onClick={handleClick}
        sx={{
          borderColor: tieneFiltrosActivos() ? "#1976d2" : "#e0e0e0",
          color: tieneFiltrosActivos() ? "#1976d2" : "#004680",
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
            value={filtros.fecha || ""}
            onChange={(e) => handleChange("fecha", e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
            size="small"
          />

          {/* Filtro por Sala */}
          <TextField
            select
            label="Sala"
            value={filtros.nombre_sala || ""}
            onChange={(e) => handleChange("nombre_sala", e.target.value)}
            fullWidth
            size="small"
          >
            <MenuItem value="">Todas las salas</MenuItem>
            {SALAS_DISPONIBLES.map((sala) => (
              <MenuItem key={sala} value={sala}>
                {sala}
              </MenuItem>
            ))}
          </TextField>

          {/* Filtro por Estado */}
          <TextField
            select
            label="Estado"
            value={filtros.estado || ""}
            onChange={(e) => handleChange("estado", e.target.value)}
            fullWidth
            size="small"
          >
            <MenuItem value="">Todos los estados</MenuItem>
            {ESTADOS_FILTRO.map((estado) => (
              <MenuItem key={estado} value={estado}>
                {estado}
              </MenuItem>
            ))}
          </TextField>

          {/* Botón limpiar */}
          {tieneFiltrosActivos() && (
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