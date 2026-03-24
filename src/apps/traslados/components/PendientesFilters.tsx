import React from "react";
import {
  Box,
  TextField,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Typography,
  Paper,
  useTheme,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import SearchIcon from "@mui/icons-material/Search";
import Autocomplete from "@mui/material/Autocomplete";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

type Props = {
  filtroBodegaDestino: string;
  setFiltroBodegaDestino: (v: string) => void;
  filtroNombre: string;
  setFiltroNombre: (v: string) => void;
  filtroTipo: "todos" | "enviados" | "recibidos";
  setFiltroTipo: (v: "todos" | "enviados" | "recibidos") => void;
  filtroFecha: string | null;
  setFiltroFecha: (v: string | null) => void;
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
};

const PendientesFilters: React.FC<Props> = ({
  filtroBodegaDestino,
  setFiltroBodegaDestino,
  filtroNombre,
  setFiltroNombre,
  filtroTipo,
  setFiltroTipo,
  filtroFecha,
  setFiltroFecha,
  conteos,
  bodegasDestino,
  filtradosLength,
  todosSeleccionados,
  algunSeleccionado,
  onToggleSeleccionarTodos,
}) => {
  const theme = useTheme();
  const opcionesDestino = bodegasDestino;

  const capitalizarPalabras = (texto: string) =>
    texto
      .toLowerCase()
      .split(" ")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");

  const azulTexto = "#3B5BDB";
  const azulFondo = "#EEF2FF";
  const azulHover = "#E0E7FF";
  const verdeTexto = "#059669";
  const verdeFondo = "#ECFDF5";
  const verdeHover = "#D1FAE5";
  const grisBorde = "#E5E7EB";
  const grisTexto = "#6B7280";

  type TipoFiltro = "todos" | "enviados" | "recibidos";

  const botones: {
    value: TipoFiltro;
    label: string;
    count: number;
    icon: React.ReactNode;
    color: string;
    fondo: string;
    hover: string;
  }[] = [
    {
      value: "todos",
      label: "Todos",
      count: conteos.total,
      icon: <SyncAltIcon sx={{ fontSize: 13, mr: 0.5 }} />,
      color: azulTexto,
      fondo: azulFondo,
      hover: azulHover,
    },
    {
      value: "enviados",
      label: "Enviados",
      count: conteos.enviados,
      icon: <ArrowForwardIcon sx={{ fontSize: 13, mr: 0.5 }} />,
      color: azulTexto,
      fondo: azulFondo,
      hover: azulHover,
    },
    {
      value: "recibidos",
      label: "Recibidos",
      count: conteos.recibidos,
      icon: <ArrowBackIcon sx={{ fontSize: 13, mr: 0.5 }} />,
      color: verdeTexto,
      fondo: verdeFondo,
      hover: verdeHover,
    },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Paper
        elevation={3}
        sx={{
          p: 2.5,
          borderRadius: 3,
          display: "flex",
          flexDirection: "column",
          gap: 3,
          mb: 2,
          backgroundColor: theme.palette.background.paper,
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        }}
      >
        {/* Fila 1: Botones de Tipo + Fecha */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            gap: 3,
          }}
        >
          {/* Botones de Tipo */}
          <Box
            sx={{
              display: "flex",
              border: `1px solid ${grisBorde}`,
              borderRadius: "10px",
              overflow: "hidden",
              width: "fit-content",
            }}
          >
            {botones.map((btn, idx) => {
              const isSelected = filtroTipo === btn.value;
              const activeColor = isSelected ? btn.color : grisBorde;

              return (
                <Box
                  key={btn.value}
                  onClick={() => setFiltroTipo(btn.value)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    px: 2,
                    py: 1,
                    cursor: "pointer",
                    backgroundColor: isSelected ? btn.fondo : "#FFFFFF",
                    color: isSelected ? btn.color : grisTexto,
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: "0.85rem",
                    borderRight:
                      idx < botones.length - 1 ? `1px solid ${grisBorde}` : "none",
                    borderTop: `1px solid ${isSelected ? activeColor : "transparent"}`,
                    borderBottom: `1px solid ${isSelected ? activeColor : "transparent"}`,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: isSelected ? btn.hover : "#F9FAFB",
                    },
                  }}
                >
                  {btn.icon}
                  {btn.label} ({btn.count})
                </Box>
              );
            })}
          </Box>

          {/* Fecha */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <DatePicker
              label="Filtrar por Fecha"
              value={filtroFecha ? dayjs(filtroFecha) : null}
              onChange={(newValue) => {
                setFiltroFecha(
                  newValue ? dayjs(newValue as Dayjs).format("YYYY-MM-DD") : null,
                );
              }}
              slotProps={{
                textField: {
                  size: "small",
                  sx: { width: 180 },
                },
              }}
            />
            {filtroFecha && (
              <Typography
                variant="caption"
                onClick={() => setFiltroFecha(null)}
                sx={{
                  color: "error.main",
                  cursor: "pointer",
                  fontWeight: 600,
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Limpiar
              </Typography>
            )}
          </Box>
        </Box>

        {/* Fila 2: Bodega + Búsqueda + Seleccionar Todo */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          {/* Filtro por Bodega Destino */}
          <Autocomplete
            disablePortal
            options={opcionesDestino}
            value={filtroBodegaDestino === "" ? null : filtroBodegaDestino}
            onChange={(_, newValue) => {
              if (newValue === "Todas las bodegas" || newValue === null) {
                setFiltroBodegaDestino("");
              } else {
                setFiltroBodegaDestino(capitalizarPalabras(newValue));
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Bodega Destino"
                size="small"
                sx={{ width: 260 }}
              />
            )}
            isOptionEqualToValue={(option, value) => option === value}
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
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ flex: 1, minWidth: 240 }}
          />

          {/* Checkbox de Seleccionar Todo */}
          {filtradosLength > 0 && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                px: 2,
                py: 1,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                backgroundColor: theme.palette.action.hover,
              }}
            >
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={todosSeleccionados}
                      indeterminate={!todosSeleccionados && algunSeleccionado}
                      onChange={(e) => onToggleSeleccionarTodos(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Cargados ({filtradosLength})
                    </Typography>
                  }
                  sx={{ m: 0 }}
                />
              </FormGroup>
            </Box>
          )}
        </Box>
      </Paper>
    </LocalizationProvider>
  );
};

export default PendientesFilters;

