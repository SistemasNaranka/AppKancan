import React, { useState } from "react";
import { Box, CircularProgress, Typography, Alert, Button } from "@mui/material";

// Hooks
import { useFileProcessor } from "../hooks/useFileProcessor";

// Components
import HomeHeader from "../components/HomeHeader";
import FileSidebar from "../components/FileSidebar";
import FilePreview from "../components/FilePreview";
import GroupedView from "../components/GroupedView";
import ValidationAlert from "../components/ValidationAlert";

const Home: React.FC = () => {
  const [mostrarAgrupado, setMostrarAgrupado] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [valorSeleccionado, setValorSeleccionado] = useState<string | null>(null);

  const {
    archivos,
    archivoSeleccionado,
    cargando,
    cargandoMapeos,
    errorMapeos,
    validacionesArchivos,
    setArchivoSeleccionado,
    handleSubirArchivos,
    handleEliminarArchivo,
    normalizarTodosArchivos,
    exportarArchivosNormalizados,
    gruposPorTienda,
    columnasPorFuente,
    cargarDatosMapeo
  } = useFileProcessor();

  // Loader mientras cargan mapeos iniciales
  if (cargandoMapeos) {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        gap: 2
      }}>
        <CircularProgress />
        <Typography>Cargando configuración de mapeos...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, minHeight: "100vh", backgroundColor: "transparent" }}>
      <HomeHeader
        archivos={archivos}
        cargando={cargando}
        cargandoMapeos={cargandoMapeos}
        errorMapeos={errorMapeos}
        mostrarAgrupado={mostrarAgrupado}
        setMostrarAgrupado={setMostrarAgrupado}
        handleSubirArchivos={handleSubirArchivos}
        normalizarTodosArchivos={normalizarTodosArchivos}
        exportarArchivosNormalizados={exportarArchivosNormalizados}
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        valorSeleccionado={valorSeleccionado}
        setValorSeleccionado={setValorSeleccionado}
        tiendasDisponibles={Object.keys(gruposPorTienda).sort()}
      />

      {errorMapeos && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={cargarDatosMapeo}>
              Reintentar
            </Button>
          }
        >
          {errorMapeos}
        </Alert>
      )}

      {/* Mostrar alertas de validación */}
      <ValidationAlert validaciones={validacionesArchivos} />

      {!mostrarAgrupado ? (
        <Box sx={{ display: "flex", gap: 3 }}>
          <FileSidebar
            archivos={archivos}
            archivoSeleccionado={archivoSeleccionado}
            setArchivoSeleccionado={setArchivoSeleccionado}
            handleEliminarArchivo={handleEliminarArchivo}
          />
          <FilePreview archivo={archivoSeleccionado} />
        </Box>
      ) : (
        <GroupedView
          gruposPorTienda={gruposPorTienda}
          columnasPorFuente={columnasPorFuente}
          busqueda={busqueda}
          valorSeleccionado={valorSeleccionado}
        />
      )}
    </Box>
  );
};

export default Home;