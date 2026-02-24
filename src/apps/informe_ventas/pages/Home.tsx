/**
 * Página principal del Informe de Ventas
 *
 * Muestra:
 * - Filtros contextuales (cada filtro se aplica sobre los anteriores)
 * - Tarjetas de resumen
 * - Tabla detallada de ventas
 */

import { Box, Typography, Alert, CircularProgress } from "@mui/material";
import { Assessment as AssessmentIcon } from "@mui/icons-material";
import { useInformeVentas } from "../hooks/useInformeVentas";
import { FiltrosVentasComponent } from "../components/FiltrosVentas";
import { TarjetasResumen } from "../components/TarjetasResumen";
import { TablaVentas } from "../components/TablaVentas";

export default function Home() {
  const {
    loading,
    error,
    ventas,
    zonas,
    ciudades,
    tiendas,
    asesores,
    agrupaciones,
    lineasVenta,
    filtros,
    resumen,
    tablaVentas,
    // Acciones
    actualizarFiltros,
    limpiarFiltros,
  } = useInformeVentas();

  return (
    <Box sx={{ p: 2, width: "100%", maxWidth: "100%", overflowX: "hidden" }}>
      {/* Header compacto */}
      <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
        <AssessmentIcon sx={{ fontSize: 28, color: "primary.main" }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Informe de Ventas
          </Typography>
        </Box>
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filtros */}
      <FiltrosVentasComponent
        filtros={filtros}
        zonas={zonas}
        ciudades={ciudades}
        tiendas={tiendas}
        asesores={asesores}
        agrupaciones={agrupaciones}
        lineasVenta={lineasVenta}
        onActualizarFiltros={actualizarFiltros}
        onLimpiarFiltros={limpiarFiltros}
      />

      {/* Tarjetas de resumen */}
      <TarjetasResumen resumen={resumen} loading={loading} />

      {/* Tabla de ventas */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TablaVentas datos={tablaVentas} loading={loading} />
      )}

      {/* Información adicional cuando no hay datos */}
      {!loading && ventas.length === 0 && (
        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary">
            No se encontraron ventas para el rango de fechas seleccionado.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Intenta ajustar los filtros de fecha o seleccionar otros criterios.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
