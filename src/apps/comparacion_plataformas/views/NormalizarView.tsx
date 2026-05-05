import React from "react";
import { Box, Typography, Button, CircularProgress, Alert } from "@mui/material";
import ModalConfirmacion from "../components/modals/Modalconfirmacion";

// Importamos el Hook y los sub-componentes (asegúrate de que las rutas coincidan con tu proyecto)
import { useNormalizador } from "./useNormalizador";
import PanelVistaPrevia from "./PanelVistaPrevia";
import PanelNormalizados from "./PanelNormalizados";

const NormalizarView: React.FC = () => {
  const {
    archivos, archivoSeleccionado, setArchivoSeleccionado, cargando, viewMode, setViewMode,
    modal, cerrarModal, cargandoMapeos, errorMapeos, refrescarMapeos,
    handleSubirArchivos, handleEliminarArchivo, exportarArchivosNormalizados,
    normalizarTodosLosArchivos, limpiarTodosLosArchivos, formatearValor,
    filtrarFilasVacias, obtenerNombreTabla
  } = useNormalizador();

  if (cargandoMapeos) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: 2 }}>
        <CircularProgress />
        <Typography>Cargando configuración de mapeos...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {errorMapeos && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={<Button color="inherit" size="small" onClick={refrescarMapeos}>Reintentar</Button>}
        >
          {errorMapeos}
        </Alert>
      )}

      {viewMode === "preview" ? (
        <PanelVistaPrevia
          archivos={archivos}
          archivoSeleccionado={archivoSeleccionado}
          setArchivoSeleccionado={setArchivoSeleccionado}
          cargandoMapeos={cargandoMapeos}
          errorMapeos={errorMapeos}
          cargando={cargando}
          handleSubirArchivos={handleSubirArchivos}
          normalizarTodosLosArchivos={normalizarTodosLosArchivos}
          limpiarTodosLosArchivos={limpiarTodosLosArchivos}
          exportarArchivosNormalizados={exportarArchivosNormalizados}
          setViewMode={setViewMode}
          handleEliminarArchivo={handleEliminarArchivo}
          filtrarFilasVacias={filtrarFilasVacias}
          formatearValor={formatearValor}
        />
      ) : (
        <PanelNormalizados
          archivos={archivos}
          exportarArchivosNormalizados={exportarArchivosNormalizados}
          setViewMode={setViewMode}
          obtenerNombreTabla={obtenerNombreTabla}
          filtrarFilasVacias={filtrarFilasVacias}
          formatearValor={formatearValor}
        />
      )}

      <ModalConfirmacion
        abierto={modal.abierto}
        onCerrar={cerrarModal}
        onConfirmar={modal.onConfirmar}
        tipo={modal.tipo}
        titulo={modal.titulo}
        mensaje={modal.mensaje}
      />
    </Box>
  );
};

export default NormalizarView;