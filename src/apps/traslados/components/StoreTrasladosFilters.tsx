import React from "react";
import {
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  IconButton,
  OutlinedInput,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import InventoryIcon from "@mui/icons-material/Inventory";
import OutboxIcon from "@mui/icons-material/Outbox";
import MoveToInboxIcon from "@mui/icons-material/MoveToInbox";
import ClearIcon from "@mui/icons-material/Clear";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/es";

dayjs.locale("es");

interface StoreTrasladosFiltersProps {
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
}

export const StoreTrasladosFilters: React.FC<StoreTrasladosFiltersProps> = ({
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
}) => {
  return (
    <Box
      sx={{
        backgroundColor: "#FFFFFF",
        borderRadius: "16px",
        p: 2,
        border: "1px solid #E2E8F0",
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 4,
        width: "100%",
        flexWrap: "wrap",
        boxShadow: "0 0 15px 0 rgba(0, 0, 0, 0.08)",
      }}
    >
      <Box
        sx={{
          flex: "0 0 auto",
          minWidth: "fit-content",
          mr: 2,
          display: "flex",
          alignItems: "flex-end",
        }}
      >
        <Box sx={{ width: "fit-content" }}>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              fontWeight: 700,
              color: "#64748B",
              mb: 0.75,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontSize: "0.7rem",
            }}
          >
            Estado de Traslado
          </Typography>
          <ToggleButtonGroup
            value={filtroTipo}
            exclusive
            onChange={(_, val) => val && setFiltroTipo(val)}
            sx={{
              width: "fit-content",
              backgroundColor: "#F8FAFC",
              p: 0.25,
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              "& .MuiToggleButtonGroup-grouped": {
                border: "1px solid transparent",
                borderRadius: "8px !important",
                textTransform: "none",
                fontWeight: 600,
                color: "#64748B",
                fontSize: "0.8rem",
                whiteSpace: "nowrap",
                mx: 0.8,
                px: 2,
                transition: "all 0.2s",
                "&.MuiToggleButton-root": {
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#FFFFFF",
                  "&:hover": {
                    backgroundColor: "#F1F5F9",
                    borderColor: "#CBD5E1",
                  },
                },
                "&.Mui-selected": {
                  backgroundColor: "primary.main",
                  color: "#FFFFFF",
                  borderColor: "primary.main",
                  boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.4)",
                  "&:hover": {
                    backgroundColor: "primary.dark",
                  },
                },
              },
            }}
          >
            <ToggleButton value="todos">
              <InventoryIcon sx={{ fontSize: 20, mr: 0.8 }} />
              Todos ({conteos.total})
            </ToggleButton>
            <ToggleButton value="enviados">
              <OutboxIcon sx={{ fontSize: 20, mr: 0.8 }} />
              Enviados ({conteos.enviados})
            </ToggleButton>
            <ToggleButton value="recibidos">
              <MoveToInboxIcon sx={{ fontSize: 20, mr: 0.8 }} />
              Por Recibir ({conteos.recibidos})
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* BODEGA DESTINO */}
      <Box sx={{ width: "240px" }}>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            fontWeight: 700,
            color: "#64748B",
            mb: 0.75,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontSize: "0.7rem",
          }}
        >
          Filtrar por Bodega
        </Typography>
        <FormControl fullWidth size="small">
          <Select
            value={filtroBodegaDestino || "all"}
            onChange={(e) =>
              setFiltroBodegaDestino(
                e.target.value === "all" ? "" : e.target.value,
              )
            }
            displayEmpty
            input={<OutlinedInput />}
            endAdornment={
              filtroBodegaDestino ? (
                <InputAdornment position="end" sx={{ mr: 1 }}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFiltroBodegaDestino("");
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <ClearIcon sx={{ fontSize: "18px" }} />
                  </IconButton>
                </InputAdornment>
              ) : null
            }
            sx={{
              backgroundColor: "#FFFFFF",
              borderRadius: "10px",
              fontSize: "0.95rem",
              "& .MuiSelect-select": {
                py: 1.25,
                pr: "1px !important",
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#CBD5E1",
                borderWidth: "1.2px",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "primary.main",
                borderWidth: "1.5px",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "primary.main",
                borderWidth: "2px",
              },
              "& .MuiSelect-icon": {
                right: 2, // Flecha al ras
              },
            }}
          >
            <MenuItem value="all">Seleccionar Bodega</MenuItem>
            {bodegasDestino.map((b) => (
              <MenuItem key={b} value={b}>
                {b}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* FECHA */}
      <Box sx={{ width: "180px" }}>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            fontWeight: 700,
            color: "#64748B",
            mb: 0.75,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontSize: "0.7rem",
          }}
        >
          Fecha
        </Typography>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
          <DatePicker
            value={filtroFecha ? dayjs(filtroFecha) : null}
            onChange={(val: any) =>
              setFiltroFecha(
                val && dayjs(val).isValid()
                  ? dayjs(val).format("YYYY-MM-DD")
                  : null,
              )
            }
            slotProps={{
              textField: {
                size: "small",
                fullWidth: true,
                placeholder: "dd/mm/aaaa",
                InputProps: {
                  endAdornment: filtroFecha ? (
                    <InputAdornment position="end" sx={{ mr: -1 }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFiltroFecha(null);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                },
                sx: {
                  backgroundColor: "#FFFFFF",
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                    fontSize: "0.95rem",
                    "& .MuiOutlinedInput-input": {
                      py: 1.25,
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#CBD5E1",
                      borderWidth: "1.2px",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "primary.main",
                      borderWidth: "1.5px",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "primary.main",
                      borderWidth: "2px",
                    },
                  },
                },
              },
            }}
          />
        </LocalizationProvider>
      </Box>

      {/* BUSCAR */}
      <Box sx={{ width: "280px" }}>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            fontWeight: 700,
            color: "#64748B",
            mb: 0.75,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontSize: "0.7rem",
          }}
        >
          Buscar
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Filtrar por Traslado"
          value={filtroNombre}
          onChange={(e) => setFiltroNombre(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#64748B", fontSize: 18 }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              backgroundColor: "#FFFFFF",
              borderRadius: "10px",
              fontSize: "0.95rem",
              "& .MuiOutlinedInput-input": {
                py: 1.25,
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#CBD5E1",
                borderWidth: "1.2px",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "primary.main",
                borderWidth: "1.5px",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "primary.main",
                borderWidth: "2px",
              },
            },
          }}
        />
      </Box>

      {/* LEYENDA DE COLORES */}
      <Box
        sx={{
          ml: "auto",
          display: "flex",
          alignItems: "center",
          gap: 3,
          pb: 1, // Alineación visual con los inputs
          pr: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 14,
              height: 14,
              borderRadius: "4px",
              backgroundColor: "#2563EB",
              boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
            }}
          />
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, color: "#64748B", fontSize: "0.75rem" }}
          >
            Enviados
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 14,
              height: 14,
              borderRadius: "4px",
              backgroundColor: "#F59E0B",
              boxShadow: "0 2px 4px rgba(245, 158, 11, 0.2)",
            }}
          />
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, color: "#64748B", fontSize: "0.75rem" }}
          >
            Por Recibir
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default StoreTrasladosFilters;
