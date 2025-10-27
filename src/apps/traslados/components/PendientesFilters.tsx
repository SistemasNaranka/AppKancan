import React from "react";
import {
  Box,
  TextField,
  InputAdornment,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import Autocomplete from "@mui/material/Autocomplete";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";

type Props = {
  filtroBodegaDestino: string;
  setFiltroBodegaDestino: (v: string) => void;
  filtroNombre: string;
  setFiltroNombre: (v: string) => void;
  bodegasDestino: string[];
  filtradosLength: number;
  todosSeleccionados: boolean;
  algunSeleccionado: boolean;
  onToggleSeleccionarTodos: (seleccionar: boolean) => void;
};

const PendientesFilters: React.FC<Props> = ({
  filtroBodegaDestino,
  setFiltroBodegaDestino,
  filtroNombre,
  setFiltroNombre,
  bodegasDestino,
  filtradosLength,
  todosSeleccionados,
  algunSeleccionado,
  onToggleSeleccionarTodos,
}) => {
  const opcionesDestino = ["Todas las bodegas", ...bodegasDestino];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "stretch", sm: "center" },
        gap: { xs: 2, sm: 3 },
        mb: 2,
        flexWrap: "wrap",
      }}
    >
      {/* Filtro por Bodega Destino */}
      <Autocomplete
        disablePortal
        options={opcionesDestino}
        value={filtroBodegaDestino === "" ? "" : filtroBodegaDestino}
        onChange={(_, newValue) => {
          if (newValue === "Todas las bodegas" || newValue === null) {
            setFiltroBodegaDestino("");
          } else {
            setFiltroBodegaDestino(newValue);
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Bodega Destino"
            size="small"
            sx={{
              minWidth: { xs: "100%", sm: 240 },
              background: "#fff",
              borderRadius: 2,
              boxShadow: 1,
            }}
          />
        )}
        renderOption={(props, option) => {
          const { key, ...rest } = props;
          return (
            <li
              key={key}
              {...rest}
              style={{ display: "flex", alignItems: "center" }}
            >
              <LocalShippingIcon
                sx={{ mr: 1, fontSize: 18, color: "success.main" }}
              />
              {option}
            </li>
          );
        }}
        isOptionEqualToValue={(option, value) => option === value}
        clearIcon={null}
        sx={{ width: { xs: "100%", sm: 240 } }}
      />

      {/* Campo de búsqueda por nombre */}
      <TextField
        label="Filtrar por Traslado"
        size="small"
        value={filtroNombre}
        onChange={(e) => setFiltroNombre(e.target.value)}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
        sx={{
          background: "#fff",
          borderRadius: 2,
          boxShadow: 1,
          minWidth: { xs: "100%", sm: 240 },
        }}
      />

      {/* Checkbox de Seleccionar Todo */}
      {filtradosLength > 0 && (
        <FormControlLabel
          control={
            <Checkbox
              checked={todosSeleccionados}
              indeterminate={!todosSeleccionados && algunSeleccionado}
              onChange={(e) => onToggleSeleccionarTodos(e.target.checked)}
              color="primary"
            />
          }
          label="Seleccionar todo"
          sx={{
            ml: { xs: 0, sm: 1 },
            userSelect: "none",
            "& .MuiFormControlLabel-label": {
              fontSize: "0.9rem",
              fontWeight: "bold",
            },
          }}
        />
      )}
    </Box>
  );
};

export default PendientesFilters;
