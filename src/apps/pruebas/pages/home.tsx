import React, { useState, useCallback } from "react";
import { Box, CircularProgress, Typography, Alert, Button } from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

// Hooks
import { useFileProcessor } from "../hooks/useFileProcessor";

// Components
import HomeHeader from "../components/HomeHeader";
import FileSidebar from "../components/FileSidebar";
import FilePreview from "../components/FilePreview";
import GroupedView from "../components/GroupedView";
import ValidationAlert from "../components/ValidationAlert";
import ModalConfirmacion from "../components/modals/Modalconfirmacion";

const Home: React.FC = () => {
  const [mostrarAgrupado, setMostrarAgrupado] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [valorSeleccionado, setValorSeleccionado] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const {
    archivos,
    archivoSeleccionado,
    cargando,
    cargandoMapeos,
    errorMapeos,
    validacionesArchivos,
    duplicadosAdvertencia,
    mostrarConfirmacionDuplicados,
    duplicadosParaNormalizar,
    setArchivoSeleccionado,
    handleSubirArchivos,
    handleEliminarArchivo,
    normalizarTodosArchivos,
    confirmarNormalizacionConDuplicados,
    cancelarNormalizacionConDuplicados,
    limpiarAdvertenciaDuplicados,
    exportarArchivosNormalizados,
    procesarArchivosRaw,
    gruposPorTienda,
    columnasPorFuente,
    cargarDatosMapeo
  } = useFileProcessor();

  // Manejadores para drag and drop en toda la página
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Solo desactivar si es un dragleave del documento o del contenedor principal
    if (e.currentTarget === document.body || e.currentTarget === e.target) {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await procesarArchivosRaw(files);
    }
  }, [procesarArchivosRaw]);

  // Generar mensaje para el modal de confirmación de normalización con duplicados
  const getDuplicateNormalizationMessage = useCallback((): string[] => {
    const mensaje: string[] = [
      "Se detectaron archivos con el mismo nombre en la lista:",
      ""
    ];
    duplicadosParaNormalizar.forEach(nombre => {
      mensaje.push(`- ${nombre}`);
    });
    mensaje.push("");
    mensaje.push("¿Está seguro de que desea normalizar estos archivos con nombres duplicados?");
    return mensaje;
  }, [duplicadosParaNormalizar]);

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
    <Box 
      sx={{ 
        p: 3, 
        minHeight: "100vh", 
        backgroundColor: dragActive ? "rgba(1, 124, 225, 0.05)" : "transparent",
        transition: "background-color 0.3s ease",
        position: "relative"
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Overlay indicador de drag and drop */}
      {dragActive && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(1, 124, 225, 0.1)",
            border: "3px dashed #017ce1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            pointerEvents: "none"
          }}
        >
          <Typography variant="h4" sx={{ color: "#017ce1", fontWeight: "bold" }}>
            Suelta los archivos aquí
          </Typography>
        </Box>
      )}

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
        tiendasDisponibles={Object.keys(gruposPorTienda)}
        procesarArchivosRaw={procesarArchivosRaw}
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

      {/* Alerta de advertencia por archivos duplicados al subir */}
      {duplicadosAdvertencia.length > 0 && (
        <Alert 
          severity="warning" 
          sx={{ mb: 2 }}
          onClose={limpiarAdvertenciaDuplicados}
          icon={<WarningIcon />}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
            Archivo duplicado: No se agregó a la lista
          </Typography>
          <Typography variant="body2">
            El siguiente archivo ya existe en los archivos subidos y no se agregó:
          </Typography>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            {duplicadosAdvertencia.map((nombre, index) => (
              <li key={index}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <InsertDriveFileIcon fontSize="small" /> {nombre}
                </Typography>
              </li>
            ))}
          </ul>
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

      {/* Modal de confirmación para normalizar archivos con nombres duplicados */}
      <ModalConfirmacion
        abierto={mostrarConfirmacionDuplicados}
        onCerrar={cancelarNormalizacionConDuplicados}
        onConfirmar={confirmarNormalizacionConDuplicados}
        tipo="confirmacion"
        titulo="Archivos con nombre duplicado"
        mensaje={getDuplicateNormalizationMessage()}
        textoConfirmar="Aceptar"
        textoCancelar="Cancelar"
      />
    </Box>
  );
};

export default Home;
