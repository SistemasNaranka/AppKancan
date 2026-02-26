/**
 * Componente de filtros para el Informe de Ventas
 *
 * Filtros contextuales en una sola fila horizontal:
 * - Cada filtro muestra solo opciones válidas basadas en los filtros anteriores
 * - Orden: Zona -> Ciudad -> Tienda -> Asesor -> Línea Venta -> Agrupación
 */

import {
  Box,
  TextField,
  Autocomplete,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Refresh as RefreshIcon } from "@mui/icons-material";
import { FiltrosVentas, Zona, Ciudad, Agrupacion, LineaVenta } from "../types";

interface FiltrosVentasProps {
  filtros: FiltrosVentas;
  zonas: Zona[];
  ciudades: Ciudad[];
  tiendas: { id: number; nombre: string }[];
  asesores: string[];
  agrupaciones: Agrupacion[];
  lineasVenta: LineaVenta[];
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
  onActualizarFiltros,
  onLimpiarFiltros,
}: FiltrosVentasProps) {
  const filtrosActivos = [
    filtros.zona,
    filtros.ciudad,
    filtros.bodega,
    filtros.asesor,
    filtros.linea_venta,
    filtros.agrupacion,
  ].filter(Boolean).length;

  return (
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
      {/* Fechas */}
      <TextField
        label="Desde"
        type="date"
        value={filtros.fecha_desde}
        onChange={(e) => onActualizarFiltros({ fecha_desde: e.target.value })}
        size="small"
        InputLabelProps={{ shrink: true }}
        sx={{ flex: "1 1 120px", minWidth: 120 }}
      />
      <TextField
        label="Hasta"
        type="date"
        value={filtros.fecha_hasta}
        onChange={(e) => onActualizarFiltros({ fecha_hasta: e.target.value })}
        size="small"
        InputLabelProps={{ shrink: true }}
        sx={{ flex: "1 1 120px", minWidth: 120 }}
      />

      {/* Filtros contextuales */}
      <Autocomplete
        value={filtros.zona || null}
        onChange={(_, value) =>
          onActualizarFiltros({ zona: value || undefined })
        }
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
        onChange={(_, value) =>
          onActualizarFiltros({ ciudad: value || undefined })
        }
        options={ciudades.map((c) => c.nombre)}
        size="small"
        clearOnEscape
        autoHighlight
        noOptionsText="Sin resultados"
        sx={{ flex: "1 1 130px", minWidth: 130 }}
        renderInput={(params) => <TextField {...params} label="Ciudad" />}
      />
      <Autocomplete
        value={filtros.bodega || null}
        onChange={(_, value) =>
          onActualizarFiltros({ bodega: value || undefined })
        }
        options={tiendas.map((t) => t.nombre)}
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
        options={asesores}
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
        renderInput={(params) => <TextField {...params} label="Línea Venta" />}
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
  );
}

export default FiltrosVentasComponent;
