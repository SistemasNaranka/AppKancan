import {
  Box,
  TextField,
  Autocomplete,
  IconButton,
  Tooltip,
} from "@mui/material";
import RefreshIcon from '@mui/icons-material/Refresh';
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { FiltrosVentas, Zona, Ciudad, Agrupacion, LineaVenta } from "../types";

interface FiltrosVentasProps {
  filtros: FiltrosVentas;
  zonas: Zona[];
  ciudades: Ciudad[];
  tiendas: { id: number; nombre: string }[];
  asesores: string[];
  agrupaciones: Agrupacion[];
  lineasVenta: LineaVenta[];
  ciudadesFiltradas?: string[];
  tiendasFiltradas?: { id: number; nombre: string }[];
  asesoresFiltrados?: string[];
  onActualizarFiltros: (filtros: Partial<FiltrosVentas>) => void;
  onLimpiarFiltros: () => void;
}

export function FiltrosVentasComponent({
  filtros,
  zonas,
  ciudades,
  tiendas,
  asesores,
  agrupaciones,
  lineasVenta,
  ciudadesFiltradas,
  tiendasFiltradas,
  asesoresFiltrados,
  onActualizarFiltros,
  onLimpiarFiltros,
}: FiltrosVentasProps) {
  // Opciones a usar: filtradas si están disponibles, si no las completas
  const opcionesCiudades = ciudadesFiltradas || ciudades.map((c) => c.nombre);
  const opcionesTiendas = tiendasFiltradas || tiendas;
  const opcionesAsesores = asesoresFiltrados || asesores;

  // Cuando cambia la zona, limpiar ciudad, bodega y asesor dependientes
  const handleZonaChange = (value: string | null) => {
    onActualizarFiltros({
      zona: value || undefined,
      ciudad: undefined,
      bodega: undefined,
      asesor: undefined,
    });
  };

  // Cuando cambia la ciudad, limpiar bodega y asesor dependientes
  const handleCiudadChange = (value: string | null) => {
    onActualizarFiltros({
      ciudad: value || undefined,
      bodega: undefined,
      asesor: undefined,
    });
  };
  const handleTiendaChange = (value: string | null) => {
    onActualizarFiltros({
      bodega: value || undefined, // Usamos el nombre directamente
      asesor: undefined, // Limpiar asesor dependiente
    });
  };

  const filtrosActivos = [
    filtros.zona,
    filtros.ciudad,
    filtros.bodega,
    filtros.asesor,
    filtros.linea_venta,
    filtros.agrupacion,
  ].filter(Boolean).length;

  // Convertir fechas a Dayjs para el DatePicker
  const fechaDesdeValue = filtros.fecha_desde
    ? dayjs(filtros.fecha_desde)
    : null;
  const fechaHastaValue = filtros.fecha_hasta
    ? dayjs(filtros.fecha_hasta)
    : null;

  // Manejador para cambio de fecha desde
  const handleFechaDesdeChange = (newValue: any) => {
    const newFechaDesde = newValue ? newValue.format("YYYY-MM-DD") : "";

    // Validar que fecha desde no sea mayor que fecha hasta
    if (filtros.fecha_hasta && newFechaDesde > filtros.fecha_hasta) {
      // Si la nueva fecha desde es mayor que fecha hasta, ajustar fecha hasta
      onActualizarFiltros({
        fecha_desde: newFechaDesde,
        fecha_hasta: newFechaDesde,
      });
    } else {
      onActualizarFiltros({ fecha_desde: newFechaDesde });
    }
  };

  // Manejador para cambio de fecha hasta
  const handleFechaHastaChange = (newValue: any) => {
    const newFechaHasta = newValue ? newValue.format("YYYY-MM-DD") : "";

    // Validar que fecha hasta no sea menor que fecha desde
    if (filtros.fecha_desde && newFechaHasta < filtros.fecha_desde) {
      // Si la nueva fecha hasta es menor que fecha desde, ajustar fecha desde
      onActualizarFiltros({
        fecha_desde: newFechaHasta,
        fecha_hasta: newFechaHasta,
      });
    } else {
      onActualizarFiltros({ fecha_hasta: newFechaHasta });
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          alignItems: "center",
          p: 2,
          bgcolor: "background.paper",
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
          mb: 2,
        }}
      >
        {/* Fechas con DatePicker de Material UI */}
        <DatePicker
          label="Desde"
          value={fechaDesdeValue}
          onChange={handleFechaDesdeChange}
          maxDate={fechaHastaValue || undefined}
          slotProps={{
            textField: {
              size: "small",
              sx: { flex: "1 1 140px", minWidth: 140 },
            },
          }}
        />
        <DatePicker
          label="Hasta"
          value={fechaHastaValue}
          onChange={handleFechaHastaChange}
          minDate={fechaDesdeValue || undefined}
          slotProps={{
            textField: {
              size: "small",
              sx: { flex: "1 1 140px", minWidth: 140 },
            },
          }}
        />

        {/* Filtros contextuales */}
        <Autocomplete
          value={filtros.zona || null}
          onChange={(_, value) => handleZonaChange(value)}
          options={zonas.map((z) => z.nombre)}
          size="small"
          clearOnEscape
          autoHighlight
          noOptionsText="Sin resultados"
          sx={{ flex: "1 1 120px", minWidth: 120 }}
          renderInput={(params) => <TextField {...params} label="Zona" />}
        />
        <Autocomplete
          value={filtros.ciudad || null}
          onChange={(_, value) => handleCiudadChange(value)}
          options={opcionesCiudades}
          size="small"
          clearOnEscape
          autoHighlight
          noOptionsText="Sin resultados"
          sx={{ flex: "1 1 130px", minWidth: 130 }}
          renderInput={(params) => <TextField {...params} label="Ciudad" />}
        />
        <Autocomplete
          value={filtros.bodega || null}
          onChange={(_, value) => handleTiendaChange(value)}
          options={opcionesTiendas.map((t) => t.nombre)}
          size="small"
          clearOnEscape
          autoHighlight
          noOptionsText="Sin resultados"
          sx={{ flex: "1 1 150px", minWidth: 150 }}
          renderInput={(params) => <TextField {...params} label="Tienda" />}
        />
        <Autocomplete
          value={filtros.asesor || null}
          onChange={(_, value) =>
            onActualizarFiltros({ asesor: value || undefined })
          }
          options={opcionesAsesores}
          size="small"
          clearOnEscape
          autoHighlight
          noOptionsText="Sin resultados"
          sx={{ flex: "1 1 150px", minWidth: 150 }}
          renderInput={(params) => <TextField {...params} label="Asesor" />}
        />
        <Autocomplete
          value={filtros.linea_venta || null}
          onChange={(_, value) =>
            onActualizarFiltros({
              linea_venta: (value || undefined) as LineaVenta | undefined,
            })
          }
          options={lineasVenta}
          size="small"
          clearOnEscape
          autoHighlight
          noOptionsText="Sin resultados"
          sx={{ flex: "1 1 140px", minWidth: 140 }}
          renderInput={(params) => (
            <TextField {...params} label="Línea Venta" />
          )}
        />
        <Autocomplete
          value={filtros.agrupacion || null}
          onChange={(_, value) =>
            onActualizarFiltros({
              agrupacion: (value || undefined) as Agrupacion | undefined,
            })
          }
          options={agrupaciones}
          size="small"
          clearOnEscape
          autoHighlight
          noOptionsText="Sin resultados"
          sx={{ flex: "1 1 140px", minWidth: 140 }}
          renderInput={(params) => <TextField {...params} label="Agrupación" />}
        />

        {/* Limpiar filtros */}
        {filtrosActivos > 0 && (
          <Tooltip
            title={`Limpiar ${filtrosActivos} filtro${filtrosActivos > 1 ? "s" : ""}`}
          >
            <IconButton
              size="small"
              onClick={onLimpiarFiltros}
              sx={{
                bgcolor: "error.light",
                color: "white",
                "&:hover": { bgcolor: "error.main" },
                flexShrink: 0,
              }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </LocalizationProvider>
  );
}

export default FiltrosVentasComponent;
