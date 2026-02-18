import {
  Box,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import SearchBar from "../components/SearchBar";
import StatusFilters from "../components/StatusFilters";
import RazonSocialFilter from "../components/RazonSocialFilter";
import ResolutionCard from "../components/ResolutionCard";
import ResolutionTable from "../components/ResolutionTable";
import Pagination from "../components/Pagination";
import Button from "../components/Button";
import SummaryCards from "../components/SummaryCards";
import { leerPDF } from "../pdfReader";
import { useResolucionesLogic } from "../hooks/useResolucionesLogic";
import { exportarAExcel } from "../utils/exportarExcel";

const ResolucionesHome = () => {
  const {
    busqueda,
    filtroRazonSocial,
    filtroEstado,
    resolucionSeleccionada,
    paginaActual,
    snackbar,
    cargandoDatos,
    mostrarConfirmacion,
    totalResoluciones,
    totalPendientes,
    totalPorVencer,
    totalVigentes,
    totalVencidos,
    totalPaginas,
    resolucionesPaginadas,
    resolucionesFiltradas,
    handleBusquedaChange,
    handleRazonSocialChange,
    handleFiltrar,
    handleSeleccionar,
    handleLimpiar,
    handleIntegrar,
    confirmarIntegracion,
    handleSubirArchivo,
    setPaginaActual,
    setMostrarConfirmacion,
  } = useResolucionesLogic();

  const handleExportar = async () => {
    await exportarAExcel(resolucionesFiltradas, (mensaje, tipo) => {
      // Aquí podrías manejar el snackbar si es necesario
      console.log(mensaje, tipo);
    });
  };

  const handleSubirArchivoWrapper = (archivo: File) => {
    handleSubirArchivo(archivo, leerPDF);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", lg: "row" },
        gap: { xs: 2, lg: 3 },
        p: { xs: 1.5, sm: 2, lg: 3 },
        minHeight: "100vh",
        backgroundColor: "hide",
      }}
    >
      {/* Panel Izquierdo */}
      <Box sx={{ width: { xs: "100%", lg: 400 } }}>
        <ResolutionCard
          resolucion={resolucionSeleccionada}
          onIntegrar={handleIntegrar}
          onLimpiar={handleLimpiar}
          onSubirArchivo={handleSubirArchivoWrapper}
        />
      </Box>

      {/* Panel Derecho */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* Título y Tarjetas de resumen */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: { xs: 1, sm: 1.5 },
            mb: 2,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: "bold",
              color: "#1a2a3a",
              mr: 1,
              fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" },
            }}
          >
            Resoluciones
          </Typography>

          <SummaryCards
            totalResoluciones={totalResoluciones}
            totalPendientes={totalPendientes}
            totalPorVencer={totalPorVencer}
            totalVigentes={totalVigentes}
            totalVencidos={totalVencidos}
          />
        </Box>

        {/* Barra de búsqueda y filtros */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: { xs: 1, sm: 1.5 },
            alignItems: { xs: "stretch", md: "center" },
            mb: 2,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <SearchBar valor={busqueda} onChange={handleBusquedaChange} />
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexWrap: { xs: "wrap", sm: "nowrap" },
              justifyContent: { xs: "stretch", sm: "flex-start" },
            }}
          >
            <RazonSocialFilter
              valor={filtroRazonSocial}
              opciones={["NARANKA SAS", "MARIA FERNANDA PEREZ VELEZ"]}
              onChange={handleRazonSocialChange}
            />

            <StatusFilters
              estadoActivo={filtroEstado}
              onFiltrar={handleFiltrar}
            />

            <Button
              texto="Exportar"
              onClick={handleExportar}
              variante="secundario"
              icono={<DownloadIcon />}
            />
          </Box>
        </Box>

        {/* Tabla */}
        <Box
          sx={{
            overflowX: "auto",
            width: "100%",
            "&::-webkit-scrollbar": { height: "8px" },
            "&::-webkit-scrollbar-track": {
              background: "#f1f1f1",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "#888",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb:hover": { background: "#555" },
          }}
        >
          {cargandoDatos ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                py: 8,
                flexDirection: "column",
                gap: 2,
              }}
            >
              <CircularProgress size={50} />
              <Typography color="text.secondary">
                Cargando resoluciones...
              </Typography>
            </Box>
          ) : (
            <ResolutionTable
              resoluciones={resolucionesPaginadas}
              onSeleccionar={handleSeleccionar}
            />
          )}
        </Box>

        {/* Paginación */}
        <Pagination
          paginaActual={paginaActual}
          totalPaginas={totalPaginas}
          onCambiarPagina={setPaginaActual}
        />

        {/* Dialog de confirmación */}
        <Dialog
          open={mostrarConfirmacion}
          onClose={() => setMostrarConfirmacion(false)}
          PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
        >
          <DialogTitle sx={{ fontWeight: "bold" }}>
            Confirmar Integración
          </DialogTitle>
          <DialogContent>
            <Typography>
              ¿Deseas integrar la resolución{" "}
              <strong>{resolucionSeleccionada?.numero_formulario}</strong>?
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
              Esto abrirá el programa corporativo para completar el proceso.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              texto="Cancelar"
              variante="secundario"
              onClick={() => setMostrarConfirmacion(false)}
            />
            <Button
              texto="Integrar"
              variante="primario"
              onClick={confirmarIntegracion}
            />
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        {snackbar.open && (
          <Box
            sx={{
              position: "fixed",
              bottom: 20,
              left: 20,
              zIndex: 9999,
            }}
          >
            <Alert
              severity={snackbar.tipo}
              variant="filled"
              sx={{
                boxShadow: 3,
                minWidth: 300,
                ...(snackbar.tipo === "success" && {
                  backgroundColor: "#2e7d32",
                  color: "#ffffff",
                }),
                ...(snackbar.tipo === "error" && {
                  backgroundColor: "#d32f2f",
                  color: "#ffffff",
                }),
              }}
            >
              {snackbar.mensaje}
            </Alert>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ResolucionesHome;
