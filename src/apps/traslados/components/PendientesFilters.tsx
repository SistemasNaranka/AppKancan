import React from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  FormGroup,
  useTheme,
  Autocomplete,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

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
  const theme = useTheme();
  const opcionesDestino = ["Todas las bodegas", ...bodegasDestino];

  const capitalizarPalabras = (texto: string) =>
    texto
      .toLowerCase()
      .split(" ")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        borderRadius: 3,
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "stretch", sm: "center" },
        gap: { xs: 2, sm: 3 },
        mb: 1,
        flexWrap: "wrap",
        backgroundColor: theme.palette.background.paper,
        boxShadow: `0px 1px 3px ${theme.palette.primary.main}`,
      }}
    >
      {/* Filtro por Bodega Destino */}
      <Autocomplete
        disablePortal
        options={opcionesDestino}
        freeSolo={false}
        data-tour="filtro-bodega-destino"
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
              background: theme.palette.background.paper,
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
          minWidth: { xs: "100%", sm: 240 },
          maxWidth: 260,
          flexShrink: 0,
        }}
      />

      {/* Campo de búsqueda por nombre */}
      <TextField
        label="Filtrar por Traslado"
        data-tour="filtro-nombre"
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
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          },
        }}
        sx={{
          background: theme.palette.background.paper,
          borderRadius: 2,
          boxShadow: 1,
          minWidth: { xs: "100%", sm: 240 },
        }}
      />

      {/* Checkbox de Seleccionar Todo */}
      {filtradosLength > 0 && (
        <Box
          sx={{
            minWidth: { xs: "100%", sm: 230 },
            background: theme.palette.background.paper,
            borderRadius: 2,
            boxShadow: `0px 1px 2px ${theme.palette.text.primary}`,
            display: "flex",
            alignItems: "center",
            p: 1.5,
            transition: "box-shadow 0.3s ease",
          }}
          data-tour="seleccionar-todo"
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
                    color: theme.palette.text.secondary,
                  }}
                >
                  Seleccionar todo ({filtradosLength})
                </Typography>
              }
              sx={{
                margin: 0,
                justifyContent: "flex-start",
              }}
            />
          </FormGroup>
        </Box>
      )}
    </Paper>
  );
};

export default PendientesFilters;

