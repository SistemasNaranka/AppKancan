import { useRef } from "react";
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Button,
} from "@mui/material";
import AssessmentIcon from '@mui/icons-material/Assessment';
import DownloadIcon from '@mui/icons-material/Download';
import { useInformeVentas } from "../hooks/useInformeVentas";
import { FiltrosVentasComponent } from "../components/FiltrosVentas";
import { TarjetasResumen } from "../components/TarjetasResumen";
import { TablaVentas } from "../components/TablaVentas";
import { TablaVentasFila } from "../types";

const LABELS_EXPORT: Record<string, string> = {
  // Obligatorias
  asesor: "Asesor",
  bodega: "Tienda",
  valor: "Valor Total",
  presupuesto_coleccion: "Presupuesto Coleccion",
  valor_coleccion: "Venta Coleccion",
  cumplimiento_coleccion: "Porc Cumpl Coleccion",
  presupuesto_basicos: "Presupuesto Basicos",
  valor_basicos: "Venta Basicos",
  cumplimiento_basicos: "Porc Cumpl Basicos",
  presupuesto_promocion: "Presupuesto Promocion",
  valor_promocion: "Venta Promocion",
  cumplimiento_promocion: "Porc Cumpl Promocion",
  ciudad: "Ciudad",
  zona: "Zona",
  unidades: "Unidades Totales",
  unidades_coleccion: "Und Coleccion",
  unidades_basicos: "Und Basicos",
  unidades_promocion: "Und Promocion",
  comision_coleccion: "Comision Coleccion",
  comision_basicos: "Comision Basicos",
  comision_promocion: "Comision Promocion",
  unidades_indigo: "Und Indigo",
  unidades_tela_liviana: "Und Tela Liviana",
  unidades_calzado: "Und Calzado",
  unidades_complemento: "Und Complemento",
};

function exportToCSV(
  data: TablaVentasFila[],
  columns: string[],
  filename: string,
) {
  if (!data || data.length === 0) {
    alert("No hay datos para exportar");
    return;
  }

  if (!columns || columns.length === 0) {
    alert("No hay columnas para exportar");
    return;
  }

  const headers = columns;

  const csvRows = [
    headers.map((h) => LABELS_EXPORT[h] || h).join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header as keyof TablaVentasFila];
          const stringValue = String(value ?? "");
          if (stringValue.includes(",") || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(","),
    ),
  ];

  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function Home() {
  const {
    isFetching,
    loading,
    hasLoadedAtLeastOnce,
    error,
    zonas,
    ciudades,
    tiendas,
    asesores,
    agrupaciones,
    lineasVenta,
    filtros,
    resumen,
    tablaVentas,

    ciudadesFiltradas,
    tiendasFiltradas,
    asesoresFiltrados,
    actualizarFiltros,
    limpiarFiltros,
  } = useInformeVentas();

  const showLoading = loading || isFetching;

  const getVisibleColumnsRef = useRef<(() => string[]) | null>(null);

  const handleExportCSV = () => {
    const fecha = new Date().toISOString().split("T")[0];
    const filename = `informe_ventas_${fecha}.csv`;

    const visibleColumns = getVisibleColumnsRef.current?.() || [];

    exportToCSV(tablaVentas, visibleColumns, filename);
  };

  return (
    <Box sx={{ p: 2, width: "100%", maxWidth: "100%", overflowX: "hidden" }}>
      <Box
        sx={{
          mb: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <AssessmentIcon sx={{ fontSize: 28, color: "primary.main" }} />
          <Typography variant="h5" fontWeight={700}>
            Informe de Ventas
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExportCSV}
          disabled={showLoading || tablaVentas.length === 0}
          size="small"
        >
          Exportar CSV
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <FiltrosVentasComponent
        filtros={filtros}
        zonas={zonas}
        ciudades={ciudades}
        tiendas={tiendas}
        asesores={asesores}
        agrupaciones={agrupaciones}
        lineasVenta={lineasVenta}
        ciudadesFiltradas={ciudadesFiltradas}
        tiendasFiltradas={tiendasFiltradas}
        asesoresFiltrados={asesoresFiltrados}
        onActualizarFiltros={actualizarFiltros}
        onLimpiarFiltros={limpiarFiltros}
      />

      <TarjetasResumen resumen={resumen} loading={showLoading} />

      {showLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TablaVentas
          datos={tablaVentas}
          loading={showLoading}
          hasLoadedAtLeastOnce={hasLoadedAtLeastOnce}
          filtros={filtros}
          getVisibleColumnsRef={getVisibleColumnsRef}
        />
      )}
    </Box>
  );
}
