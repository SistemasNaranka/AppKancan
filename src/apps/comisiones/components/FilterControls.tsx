import React from "react";
import { Role } from "../types";
import { Filter as FilterIcon, CalendarToday } from "@mui/icons-material";
import Button from "@mui/material/Button";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import AutocompleteSelect from "./AutocompleteSelect";
import { useFiltersData } from "../hooks/useFiltersData";
import { getCurrentMonth } from "../lib/calculations";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

interface FilterControlsProps {
  /** Mes seleccionado actualmente */
  selectedMonth: string;
  /** Lista de meses disponibles */
  availableMonths: string[];
  /** Callback para cambiar el mes */
  onMonthChange: (month: string) => void;
  /** Filtro de tienda actualmente aplicado (ID de tienda) */
  filterTienda: string;
  /** Callback para cambiar filtro de tienda */
  onFilterTiendaChange: (tienda: string) => void;
  /** Filtro de rol actualmente aplicado */
  filterRol: Role | "";
  /** Callback para cambiar filtro de rol */
  onFilterRolChange: (rol: Role | "") => void;
  /** Filtro de fecha seleccionado */
  filterFecha: string;
  /** Callback para cambiar filtro de fecha */
  onFilterFechaChange: (fecha: string) => void;
  /** Lista única de tiendas para el dropdown (legacy, se reemplazará por BD) */
  uniqueTiendas: string[];
  /** Total de tiendas disponibles */
  totalTiendas: number;
}

/**
 * Componente especializado para el manejo de filtros de la aplicación.
 * Centraliza toda la lógica de filtrado en un componente dedicado.
 * Carga datos desde la base de datos y proporciona autocompletado para tiendas.
 */
export const FilterControls: React.FC<FilterControlsProps> = ({
  selectedMonth,
  availableMonths,
  onMonthChange,
  filterTienda,
  onFilterTiendaChange,
  filterRol,
  onFilterRolChange,
  filterFecha,
  onFilterFechaChange,
  uniqueTiendas,
  totalTiendas,
}) => {
  const [showFilters, setShowFilters] = React.useState(false);
  const {
    tiendasOptions,
    cargosOptions,
    loading: loadingFilters,
  } = useFiltersData();

  /**
   * Limpia todos los filtros y vuelve al mes actual
   */
  const clearFilters = () => {
    // Resetear mes al mes actual
    const currentMonth = getCurrentMonth();
    if (availableMonths.includes(currentMonth)) {
      onMonthChange(currentMonth);
    }
    // Resetear filtros
    onFilterTiendaChange("");
    onFilterRolChange("");
    onFilterFechaChange("");
  };

  // Si no hay datos, no mostrar controles de filtro
  if (totalTiendas === 0) {
    return null;
  }

  // Encontrar la tienda seleccionada para mostrar su nombre
  const selectedTienda = tiendasOptions.find(
    (option) => option.value === filterTienda
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Card sx={{ mb: 3 }}>
        <CardHeader>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h6">Filtros</Typography>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outlined"
              size="small"
              startIcon={<FilterIcon />}
            >
              {showFilters ? "Ocultar" : "Mostrar"} Filtros
            </Button>
          </div>
        </CardHeader>

        {showFilters && (
          <CardContent>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={3}
              useFlexGap
              flexWrap="wrap"
            >
              {/* Filtro de Mes */}
              <FormControl sx={{ minWidth: 200 }}>
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

              {/* Filtro de Tienda con Autocompletado */}
              <AutocompleteSelect
                value={filterTienda}
                onValueChange={onFilterTiendaChange}
                options={[
                  { value: "", label: "Todas las tiendas" },
                  ...tiendasOptions,
                ]}
                placeholder="Buscar tienda..."
                label="Tienda"
                loading={loadingFilters}
                sx={{ minWidth: 250 }}
              />

              {/* Filtro de Rol */}
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={filterRol}
                  onChange={(e) =>
                    onFilterRolChange(e.target.value as Role | "")
                  }
                  label="Rol"
                >
                  <MenuItem value="">Todos los roles</MenuItem>
                  <MenuItem value="gerente">Gerente</MenuItem>
                  <MenuItem value="asesor">Asesor</MenuItem>
                  <MenuItem value="cajero">Cajero</MenuItem>
                  <MenuItem value="logistico">Logístico</MenuItem>
                </Select>
              </FormControl>

              {/* Filtro de Fecha */}
              <DatePicker
                label="Fecha"
                value={filterFecha ? dayjs(filterFecha) : null}
                onChange={(date) =>
                  onFilterFechaChange(date ? date.format("YYYY-MM-DD") : "")
                }
                sx={{ minWidth: 200 }}
              />

              {/* Botón Limpiar Filtros */}
              <Button
                onClick={clearFilters}
                variant="outlined"
                sx={{ alignSelf: "flex-end", height: "56px" }}
              >
                Limpiar Filtros
              </Button>
            </Stack>
          </CardContent>
        )}
      </Card>
    </LocalizationProvider>
  );
};
