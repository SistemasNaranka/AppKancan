import React from "react";
import {
  Box,
  TextField,
  InputAdornment,
  Checkbox,
  useTheme,
  FormControlLabel,
  FormGroup,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import Autocomplete from "@mui/material/Autocomplete";

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
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

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
        freeSolo={false}
        value={filtroBodegaDestino === "" ? null : filtroBodegaDestino}
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
              {option}
            </li>
          );
        }}
        isOptionEqualToValue={(option, value) => option === value}
        sx={{
          flex: 1,
          minWidth: { xs: "100%", sm: 280 },
          maxWidth: "100%",
        }}
        slotProps={{
          paper: {
            sx: {
              maxWidth: "100%",
              "& .MuiAutocomplete-listbox": {
                maxWidth: "100%",
                "& li": {
                  maxWidth: "100%",
                },
              },
            },
          },
        }}
      />
      {/* Campo de búsqueda por nombre */}
      <TextField
        label="Filtrar por Traslado"
        size="small"
        value={filtroNombre}
        onChange={(e) => {
          const valor = e.target.value;

          if (/^\d*$/.test(valor) && valor.length <= 12) {
            setFiltroNombre(valor);
          }
        }}
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
        <Box
          sx={{
            minWidth: { xs: "100%", sm: 240 },
            background: theme.palette.background.paper,
            borderRadius: 2,
            boxShadow: 1,
            display: "flex",
            alignItems: "center",
            p: 1.5,
            transition: "box-shadow 0.3s ease",
          }}
        >
          <FormGroup
            sx={{
              display: "flex",
              alignItems: "center",
              width: "100%",
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={todosSeleccionados}
                  indeterminate={!todosSeleccionados && algunSeleccionado}
                  onChange={(e) => onToggleSeleccionarTodos(e.target.checked)}
                  color="primary"
                  size="medium"
                  sx={{
                    "&.MuiCheckbox-root": {
                      padding: 0,
                      marginRight: 1,
                    },
                  }}
                />
              }
              label={
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                  }}
                >
                  Seleccionar todo ({filtradosLength})
                </Typography>
              }
              sx={{
                margin: 0,
                justifyContent: "flex-start",
                "& .MuiFormControlLabel-label": {
                  marginLeft: 0.5,
                },
              }}
            />
          </FormGroup>
        </Box>
      )}
    </Box>
  );
};

export default PendientesFilters;
