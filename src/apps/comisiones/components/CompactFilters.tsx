import React from "react";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { Role } from "../types";
import AutocompleteSelect from "./AutocompleteSelect";
import { useFiltersData } from "../hooks/useFiltersData";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

interface CompactFiltersProps {
  selectedMonth: string;
  availableMonths: string[];
  onMonthChange: (month: string) => void;
  filterTienda: string[];
  onFilterTiendaChange: (value: string | string[]) => void;
  filterRol: string;
  onFilterRolChange: (rol: string) => void;
  filterFechaInicio: string;
  onFilterFechaInicioChange: (fecha: string) => void;
  filterFechaFin: string;
  onFilterFechaFinChange: (fecha: string) => void;
  uniqueTiendas: string[];
  onClearFilters: () => void;
}

export const CompactFilters: React.FC<CompactFiltersProps> = ({
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
  uniqueTiendas,
  onClearFilters,
}) => {
  const { tiendasOptions, loading: loadingFilters } = useFiltersData();

  // Agregar opción "Todas las tiendas" al inicio
  const tiendaOptionsWithAll = [
    { value: "all", label: "Todas" },
    ...tiendasOptions,
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={{ xs: 2, sm: 3 }}
        alignItems={{ xs: "stretch", sm: "center" }}
        sx={{
          p: 3,
          bgcolor: "background.paper",
          borderRadius: 2,
          border: 1,
          borderColor: "divider",
          boxShadow: 1,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        {/* Filtro de Mes */}
        <FormControl size="small" sx={{ minWidth: 140, flex: 1 }}>
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

        {/* Filtro de Fecha Inicio */}
        {/* <DatePicker
          label="Fecha inicio"
          value={filterFechaInicio ? dayjs(filterFechaInicio) : null}
          onChange={(date) =>
            onFilterFechaInicioChange(date ? date.format("YYYY-MM-DD") : "")
          }
          slotProps={{
            textField: {
              size: "small",
              sx: { minWidth: 140, flex: 1 },
            },
          }}
        />

      
        <DatePicker
          label="Fecha fin"
          value={filterFechaFin ? dayjs(filterFechaFin) : null}
          onChange={(date) =>
            onFilterFechaFinChange(date ? date.format("YYYY-MM-DD") : "")
          }
          slotProps={{
            textField: {
              size: "small",
              sx: { minWidth: 140, flex: 1 },
            },
          }}
        /> */}

        {/* Filtro de Tienda con Autocompletado */}
        <AutocompleteSelect
          multiple={true}
          value={filterTienda}
          onValueChange={onFilterTiendaChange}
          options={tiendasOptions}
          placeholder="Buscar tienda..."
          label="Tienda"
          loading={loadingFilters}
          size="small"
          sx={{ minWidth: 200, flex: 2 }}
        />

        {/* Filtro de Rol */}
        <FormControl size="small" sx={{ minWidth: 140, flex: 1 }}>
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

        {/* Botón Limpiar Filtros */}
        <Button
          onClick={onClearFilters}
          variant="contained"
          size="small"
          sx={{
            height: "40px",
            minWidth: "120px",
            flexShrink: 0,
          }}
        >
          Limpiar Filtros
        </Button>
      </Stack>
    </LocalizationProvider>
  );
};
