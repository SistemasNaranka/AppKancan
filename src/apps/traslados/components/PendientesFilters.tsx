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
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import SearchIcon from "@mui/icons-material/Search";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SyncAltIcon from "@mui/icons-material/SyncAlt";

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
  tienePoliticaTrasladosTiendas?: boolean;
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
  tienePoliticaTrasladosTiendas = false,
}) => {
  const opcionesDestino = bodegasDestino;

  const capitalizarPalabras = (texto: string) =>
    texto
      .toLowerCase()
      .split(" ")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");

  const azulTexto = "#3B5BDB";
  const azulFondo = "#EEF2FF";
  const verdeTexto = "#059669";
  const verdeFondo = "#ECFDF5";
  const verdeHover = "#D1FAE5";
  const azulHover = "#E0E7FF";
  const grisLabel = "#9CA3AF";
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
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0, width: "100%" }}>
        {/* ── Chip "Pendientes: N" ── */}
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              border: `1.5px solid ${azulTexto}`,
              borderRadius: "10px",
              px: 1.5,
              py: 0.6,
              color: azulTexto,
              backgroundColor: azulFondo,
            }}
          >
            <AccessTimeIcon sx={{ fontSize: 16, color: azulTexto }} />
            <Typography
            sx={{ fontWeight: 600, fontSize: "0.9rem", color: azulTexto, letterSpacing: 0 }}
          >
            Pendientes: {filtradosLength}
          </Typography>
        </Box>
      </Box>

      {/* ── Panel de filtros: 100% ancho ── */}
      <Paper
        elevation={0}
        sx={{
          px: 3,
          py: 2.5,
          borderRadius: "16px",
          border: `1px solid ${grisBorde}`,
          backgroundColor: "#FFFFFF",
          boxShadow: "0 2px 12px 0 rgba(0,0,0,0.06)",
          width: "100%",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "row",
          gap: 2.5,
          alignItems: "flex-end",
        }}
      >
        {/* Fila 1: Tipo de Traslado + Bodega Destino + Fecha */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "flex-start" },
            gap: { xs: 2, sm: 3 },
            width: "100%",
          }}
        >
          {/* Tipo de Traslado */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, flexShrink: 0 }}>
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: "0.65rem",
                letterSpacing: "0.08em",
                color: grisLabel,
                textTransform: "uppercase",
              }}
            >
              Tipo de Traslado
            </Typography>
            <Box
              sx={{
                display: "flex",
                border: `1px solid ${grisBorde}`,
                borderRadius: "8px",
                overflow: "hidden",
                width: "fit-content",
              }}
            >
              {botones.map((btn, idx) => {
                const isSelected = filtroTipo === btn.value;
                const bordeColor = isSelected ? btn.color : grisBorde;
                return (
                  <Box
                    key={btn.value}
                    onClick={() => setFiltroTipo(btn.value)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      px: 1.6,
                      py: 0.7,
                      cursor: "pointer",
                      backgroundColor: isSelected ? btn.fondo : "#FFFFFF",
                      color: isSelected ? btn.color : grisTexto,
                      fontWeight: isSelected ? 600 : 400,
                      fontSize: "0.82rem",
                      borderRight: idx < botones.length - 1 ? `1px solid ${bordeColor}` : "none",
                      borderLeft: idx === 0 ? `1px solid ${bordeColor}` : "none",
                      borderTop: `1px solid ${bordeColor}`,
                      borderBottom: `1px solid ${bordeColor}`,
                      transition: "all 0.15s ease",
                      userSelect: "none",
                      whiteSpace: "nowrap",
                      "&:hover": {
                        backgroundColor: isSelected ? btn.hover : btn.fondo,
                        color: btn.color,
                      },
                    }}
                  >
                    {btn.icon}
                    {btn.label} ({btn.count})
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* Bodega Destino */}
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 1, flexShrink: 0 }}
            data-tour="filtro-bodega-destino"
          >
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: "0.65rem",
                letterSpacing: "0.08em",
                color: grisLabel,
                textTransform: "uppercase",
              }}
            >
              Bodega Destino
            </Typography>
            <FormControl size="small">
              <Select
                value={filtroBodegaDestino === "" ? "__todas__" : filtroBodegaDestino}
                onChange={(e) => {
                  const val = e.target.value;
                  setFiltroBodegaDestino(val === "__todas__" ? "" : capitalizarPalabras(val));
                }}
                displayEmpty
                sx={{
                  minWidth: 200,
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  backgroundColor: "#FFFFFF",
                  color: filtroBodegaDestino === "" ? grisTexto : "#111827",
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: grisBorde },
                  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#D1D5DB" },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: azulTexto,
                    borderWidth: "1px",
                  },
                }}
              >
                <MenuItem value="__todas__" sx={{ fontSize: "0.85rem", color: grisTexto }}>
                  Seleccionar Bodega
                </MenuItem>
                {opcionesDestino.map((opcion) => (
                  <MenuItem key={opcion} value={opcion} sx={{ fontSize: "0.85rem" }}>
                    {capitalizarPalabras(opcion)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Fecha */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, flexShrink: 0 }}>
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: "0.65rem",
                letterSpacing: "0.08em",
                color: grisLabel,
                textTransform: "uppercase",
              }}
            >
              Fecha
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <DatePicker
                value={filtroFecha ? dayjs(filtroFecha) : null}
                onChange={(newValue) => {
                  setFiltroFecha(newValue ? dayjs(newValue as Dayjs).format("YYYY-MM-DD") : null);
                }}
                slotProps={{
                  textField: {
                    size: "small",
                    placeholder: "Filtrar por fecha",
                    sx: {
                      width: 160,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        fontSize: "0.85rem",
                        backgroundColor: "#FFFFFF",
                        "& fieldset": { borderColor: grisBorde },
                        "&:hover fieldset": { borderColor: "#D1D5DB" },
                        "&.Mui-focused fieldset": { borderColor: azulTexto, borderWidth: "1px" },
                      },
                    },
                  },
                }}
              />
              {/* Botón Limpiar Fecha */}
              {filtroFecha && (
                <Typography
                  onClick={() => setFiltroFecha(null)}
                  sx={{
                    cursor: "pointer",
                    color: "#DC2626",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  Limpiar
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* Fila 2: Buscar (full width) + Seleccionar todo */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "flex-end" },
            gap: { xs: 2, sm: 3 },
            width: "100%",
          }}
        >
          {/* Buscar — ocupa todo el espacio restante */}
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 1, flex: 1, minWidth: 0 }}
            data-tour="filtro-nombre"
          >
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: "0.65rem",
                letterSpacing: "0.08em",
                color: grisLabel,
                textTransform: "uppercase",
              }}
            >
              Buscar
            </Typography>
            <TextField
              placeholder="Filtrar por Traslado"
              size="small"
              value={filtroNombre}
              onChange={(e) => {
                const valor = e.target.value;
                if (/^\d*$/.test(valor) && valor.length <= 12) {
                  setFiltroNombre(valor);
                }
              }}
              fullWidth
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 17, color: "#9CA3AF" }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  backgroundColor: "#FFFFFF",
                  "& fieldset": { borderColor: grisBorde },
                  "&:hover fieldset": { borderColor: "#D1D5DB" },
                  "&.Mui-focused fieldset": { borderColor: azulTexto, borderWidth: "1px" },
                },
                "& input::placeholder": { color: "#9CA3AF", opacity: 1 },
              }}
            />
          </Box>

          {/* Seleccionar todo */}
          {!tienePoliticaTrasladosTiendas && filtradosLength > 0 && (
            <Box
              data-tour="seleccionar-todo"
              sx={{ display: "flex", alignItems: "flex-end", pb: 0.2, flexShrink: 0 }}
            >
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={todosSeleccionados}
                      indeterminate={!todosSeleccionados && algunSeleccionado}
                      onChange={(e) => onToggleSeleccionarTodos(e.target.checked)}
                      color="primary"
                      size="small"
                      sx={{ p: 0.5, mr: 0.5 }}
                    />
                  }
                  label={
                    <Typography sx={{ fontWeight: 600, fontSize: "0.82rem", color: grisTexto }}>
                      Seleccionar todo ({filtradosLength})
                    </Typography>
                  }
                  sx={{ margin: 0 }}
                />
              </FormGroup>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
    </LocalizationProvider>
  );
};

export default PendientesFilters;