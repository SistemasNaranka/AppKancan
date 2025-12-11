import React, { useState } from "react";
import {
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Collapse,
} from "@mui/material";
import {
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Stack from "@mui/material/Stack";
import AutocompleteSelect from "./AutocompleteSelect";
import { useFiltersData } from "../hooks/useFiltersData";
import { useIsMobile } from "../hooks/useMobile";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { Role } from "../types";

interface MobileAccordionFiltersProps {
  selectedMonth: string;
  availableMonths: string[];
  onMonthChange: (month: string) => void;
  filterTienda: string[];
  onFilterTiendaChange: (value: string | string[]) => void;
  filterRol: Role | "all";
  onFilterRolChange: (rol: Role | "all") => void;
  filterFechaInicio: string;
  onFilterFechaInicioChange: (fecha: string) => void;
  filterFechaFin: string;
  onFilterFechaFinChange: (fecha: string) => void;
  onClearFilters: () => void;
}

export const MobileAccordionFilters: React.FC<MobileAccordionFiltersProps> = ({
  selectedMonth,
  availableMonths,
  onMonthChange,
  filterTienda,
  onFilterTiendaChange,
  filterRol,
  onFilterRolChange,
  filterFechaInicio,
  onFilterFechaInicioChange,
  filterFechaFin,
  onFilterFechaFinChange,
  onClearFilters,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useIsMobile();
  const { tiendasOptions, loading: loadingFilters } = useFiltersData();

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleClearAndCollapse = () => {
    onClearFilters();
    setIsExpanded(false);
  };

  // En desktop, mostrar el diseño compacto siempre visible
  if (!isMobile) {
    return (
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Card
          sx={{
            mb: 2,
            borderRadius: 1.5,
            border: 1,
            borderColor: "divider",
            boxShadow: 0,
          }}
        >
          <CardContent
            sx={{
              p: 1.5, // 🔥 Menos padding
              "&:last-child": { p: 1.5 },
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                mb: 1,
                fontWeight: 600,
                fontSize: "0.95rem", // 🔥 Título más pequeño
              }}
            >
              Filtros
            </Typography>

            {/* GRID COMPACTO */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "140px 1fr 110px", // 🔥 Más compacto
                gap: 1.5,
                alignItems: "center",
              }}
            >
              {/* Mes */}
              <FormControl size="small" sx={{ width: "100%" }}>
                <InputLabel>Mes</InputLabel>
                <Select
                  value={selectedMonth}
                  onChange={(e) => onMonthChange(e.target.value)}
                  label="Mes"
                >
                  {availableMonths.map((month) => (
                    <MenuItem key={month} value={month}>
                      {month}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Tienda */}
              <AutocompleteSelect
                multiple
                value={filterTienda}
                onValueChange={onFilterTiendaChange}
                options={tiendasOptions}
                placeholder="Buscar tienda..."
                label="Tienda"
                loading={loadingFilters}
                size="small"
                sx={{ width: "100%" }}
              />

              {/* Limpiar */}
              <Button
                onClick={onClearFilters}
                variant="outlined"
                startIcon={<ClearIcon />}
                size="small"
                sx={{
                  minWidth: "100%",
                  py: 0.6, // 🔥 Más compacto
                  textTransform: "none",
                  fontSize: "0.85rem",
                }}
              >
                Limpiar
              </Button>
            </Box>
          </CardContent>
        </Card>
      </LocalizationProvider>
    );
  }

  // En móvil, mostrar el diseño compacto
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      {/* Contenedor compacto para móvil */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          backgroundColor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
          mb: 1,
        }}
      >
        {/* Botón principal compacto */}
        <Button
          onClick={handleToggle}
          fullWidth
          variant="outlined"
          startIcon={<FilterIcon sx={{ fontSize: 16 }} />}
          endIcon={
            <ExpandMoreIcon
              sx={{
                fontSize: 16,
                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            />
          }
          sx={{
            borderRadius: 0,
            py: 1,
            px: 2,
            fontSize: "0.875rem",
            fontWeight: 500,
            textTransform: "none",
            justifyContent: "space-between",
            minHeight: 48,
            color: "text.primary",
            borderColor: "divider",
            backgroundColor: "background.paper",
            "&:hover": {
              backgroundColor: "action.hover",
              borderColor: "primary.main",
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <span>{isExpanded ? "Ocultar filtros" : "Mostrar filtros"}</span>
            {(filterTienda.length > 0 ||
              filterRol !== "all" ||
              filterFechaInicio ||
              filterFechaFin) && (
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "primary.main",
                }}
              />
            )}
          </Box>
        </Button>

        {/* Panel de filtros desplegable - más compacto */}
        <Collapse in={isExpanded} timeout={200}>
          <Box
            sx={{
              backgroundColor: "background.default",
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box sx={{ p: 2 }}>
              <Stack spacing={2}>
                {/* Filtros en 2 columnas para optimizar espacio */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 2,
                  }}
                >
                  {/* Filtro de Mes */}
                  <FormControl size="small">
                    <InputLabel>Mes</InputLabel>
                    <Select
                      value={selectedMonth}
                      onChange={(e) => onMonthChange(e.target.value)}
                      label="Mes"
                    >
                      {availableMonths.map((month) => (
                        <MenuItem key={month} value={month}>
                          {month}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Filtro de Rol */}
                  <FormControl size="small">
                    <InputLabel>Rol</InputLabel>
                    <Select
                      value={filterRol || "all"}
                      onChange={(e) => onFilterRolChange(e.target.value)}
                      label="Rol"
                    >
                      <MenuItem value="all">Todos</MenuItem>
                      <MenuItem value="gerente">Gerente</MenuItem>
                      <MenuItem value="asesor">Asesor</MenuItem>
                      <MenuItem value="cajero">Cajero</MenuItem>
                      <MenuItem value="logistico">Logístico</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Fechas en 2 columnas */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 2,
                  }}
                >
                  <DatePicker
                    label="Inicio"
                    value={filterFechaInicio ? dayjs(filterFechaInicio) : null}
                    onChange={(date) =>
                      onFilterFechaInicioChange(
                        date ? date.format("YYYY-MM-DD") : ""
                      )
                    }
                    slotProps={{
                      textField: {
                        size: "small",
                        fullWidth: true,
                      },
                    }}
                  />

                  <DatePicker
                    label="Fin"
                    value={filterFechaFin ? dayjs(filterFechaFin) : null}
                    onChange={(date) =>
                      onFilterFechaFinChange(
                        date ? date.format("YYYY-MM-DD") : ""
                      )
                    }
                    slotProps={{
                      textField: {
                        size: "small",
                        fullWidth: true,
                      },
                    }}
                  />
                </Box>

                {/* Tienda - ancho completo */}
                <AutocompleteSelect
                  multiple={true}
                  value={filterTienda}
                  onValueChange={onFilterTiendaChange}
                  options={tiendasOptions}
                  placeholder="Buscar tienda..."
                  label="Tienda"
                  loading={loadingFilters}
                  size="small"
                  sx={{ width: "100%" }}
                />

                {/* Botón Limpiar */}
                <Button
                  onClick={handleClearAndCollapse}
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  size="small"
                  sx={{
                    py: 1,
                    borderRadius: 1,
                    textTransform: "none",
                    fontWeight: 500,
                  }}
                >
                  Limpiar filtros
                </Button>
              </Stack>
            </Box>
          </Box>
        </Collapse>
      </Box>
    </LocalizationProvider>
  );
};
