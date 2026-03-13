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
  Paper,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import Autocomplete from "@mui/material/Autocomplete";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AllInclusiveIcon from "@mui/icons-material/AllInclusive";

type Props = {
  filtroBodegaDestino: string;
  setFiltroBodegaDestino: (v: string) => void;
  filtroNombre: string;
  setFiltroNombre: (v: string) => void;
  filtroTipo: "todos" | "enviados" | "recibidos";
  setFiltroTipo: (v: "todos" | "enviados" | "recibidos") => void;
  conteos: {
    total: number;
    enviados: number;
    recibidos: number;
  };
  bodegasDestino: string[];
  filtradosLength: number;
  todosSeleccionados: boolean;
  algunSeleccionado: boolean;
  onToggleSeleccionarTodos: (seleccionar: boolean) => void;
  tienePoliticaTrasladosTiendas?: boolean;
};

const PendientesFilters: React.FC<Props> = ({
  filtroBodegaDestino,
  setFiltroBodegaDestino,
  filtroNombre,
  setFiltroNombre,
  filtroTipo,
  setFiltroTipo,
  conteos,
  bodegasDestino,
  filtradosLength,
  todosSeleccionados,
  algunSeleccionado,
  onToggleSeleccionarTodos,
  tienePoliticaTrasladosTiendas = false,
}) => {
  const opcionesDestino = ["Todas las bodegas", ...bodegasDestino];
  const theme = useTheme();
  const capitalizarPalabras = (texto: string) =>
    texto
      .toLowerCase()
      .split(" ")
      .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
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
      {/* Filtro por Tipo: Enviados / Recibidos / Todos */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
        }}
      >
        <Typography
          variant="caption"
          sx={{ fontWeight: 600, color: theme.palette.text.secondary }}
        >
          Tipo de Traslado
        </Typography>
        <ToggleButtonGroup
          value={filtroTipo}
          exclusive
          onChange={(_, newValue) => {
            if (newValue !== null) {
              setFiltroTipo(newValue);
            }
          }}
          size="small"
          sx={{
            "& .MuiToggleButton-root": {
              py: 0.5,
              px: 1.5,
              fontSize: "0.75rem",
            },
          }}
        >
          <ToggleButton value="todos" aria-label="todos">
            <AllInclusiveIcon sx={{ mr: 0.5, fontSize: 16 }} />
            Todos ({conteos.total})
          </ToggleButton>
          <ToggleButton value="enviados" aria-label="enviados">
            <ArrowForwardIcon sx={{ mr: 0.5, fontSize: 16 }} />
            Enviados ({conteos.enviados})
          </ToggleButton>
          <ToggleButton value="recibidos" aria-label="recibidos">
            <ArrowBackIcon sx={{ mr: 0.5, fontSize: 16 }} />
            Recibidos ({conteos.recibidos})
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
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
            setFiltroBodegaDestino(capitalizarPalabras(newValue)); // 👈 transformar antes de guardar
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
              {capitalizarPalabras(option)}
            </li>
          );
        }}
        isOptionEqualToValue={(option, value) => option === value}
        sx={{
          flex: 1,
          minWidth: { xs: "100%", sm: 240 },
          maxWidth: 260,
          flexShrink: 0, // ✅ Evita que se estire o reduzca por flex
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

      {/* Checkbox de Seleccionar Todo - Ocultar si tiene política TrasladosTiendas */}
      {!tienePoliticaTrasladosTiendas && filtradosLength > 0 && (
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
