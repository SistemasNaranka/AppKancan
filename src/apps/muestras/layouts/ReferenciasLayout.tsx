import React from "react";
import { Box, Typography, Card, Divider } from "@mui/material";
import SnackbarAlert from "@/auth/components/SnackbarAlert";
import { useSnackbar } from "@/auth/hooks/useSnackbar";
import { useScannerLogic } from "../hooks/useScannerLogic";
import ScannerForm from "../components/ScannerForm";
import ScannerList from "../components/ScannerList";
import { ScannerStats } from "../components/scanner/ScannerStats";
import GeneralConfirmModal from "../components/GeneralConfirmModal";
import ObservacionesModal from "../components/ObservacionesModal";
import { enviarMuestras } from "../api/sendReferencias";
import NuevaReferenciaAlert from "../components/NuevaReferenciaAlert";
import EnvioLoadingModal from "../components/EnvioLoadingModal";

const ArticulosLayout: React.FC = () => {
  const { snackbar, closeSnackbar, showSnackbar } = useSnackbar();
  const [isLoading] = React.useState(false);
  const [confirmModal, setConfirmModal] = React.useState<{
    open: boolean;
    type: "cancel" | "delete" | "print";
    item?: string;
    count?: number;
  }>({ open: false, type: "cancel" });
  const [modalCargando, setModalCargando] = React.useState(false);
  const [observacionesModalOpen, setObservacionesModalOpen] =
    React.useState(false);

  const {
    bodega,
    bodegas,
    codigoInput,
    setCodigoInput,
    codigos,
    totalItems,
    isScanning,
    ultimoAgregado,
    alertCounter,
    observaciones,
    handleBodegaChange,
    agregarCodigo,
    eliminarCodigo,
    reducirCantidad,
    limpiarTodo,
    setObservaciones,
  } = useScannerLogic();

  const handleEnviar = () => {
    if (codigos.length === 0) {
      showSnackbar("No hay códigos para enviar", "warning");
      return;
    }

    if (!bodega || bodega.trim() === "") {
      showSnackbar("Debe seleccionar una bodega", "warning");
      return;
    }

    setConfirmModal({ open: true, type: "print" });
  };

  const handlePrintSelection = async (printer: number) => {
    setConfirmModal((prev) => ({ ...prev, open: false }));
    setModalCargando(true);

    try {
      await enviarMuestras(codigos, bodega, observaciones, printer);
      setModalCargando(false);
      showSnackbar("Muestras enviadas correctamente", "success");
      limpiarTodo();
    } catch (error: any) {
      setModalCargando(false);
      const errorMessage = error.message || "Error al enviar muestras";
      showSnackbar(errorMessage, "error");
    }
  };

  const handleConfirm = () => {
    if (confirmModal.type === "cancel") {
      limpiarTodo();
    } else if (confirmModal.type === "delete" && confirmModal.item) {
      eliminarCodigo(confirmModal.item);
    }
    setConfirmModal((prev) => ({ ...prev, open: false }));
  };

  const handleCancelConfirm = () => {
    setConfirmModal((prev) => ({ ...prev, open: false }));
  };

  return (
    <>
      <Box
        sx={{
          position: "relative",
          p: { xs: 0.5, sm: 1.5, md: 2, lg: 3 }, // Padding mínimo en móviles
          pb: { xs: 0.5, sm: 0 },
          height: { xs: "100dvh", sm: "100vh" }, // dvh para móviles (considera barra de navegación)
          display: "flex",
          flexDirection: "column",
          gap: { xs: 0.5, sm: 2, md: 3 }, // Gap reducido en móviles
          overflow: "hidden",
        }}
      >
        <Card
          sx={{
            pt: { xs: 0.5, sm: 1.5, md: 2 }, // Padding superior reducido
            pl: { xs: 0.75, sm: 1.5, md: 2 },
            pr: { xs: 0.75, sm: 1.5, md: 2 },
            pb: { xs: 0.5, sm: 0 },
            borderRadius: { xs: 2, md: 3 },
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: { xs: 0.5, sm: 1, md: 1 }, // Gap interno mínimo
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {/* Título más compacto en móviles */}
          <Typography
            variant="h4"
            fontWeight="800"
            sx={{
              color: "primary.main",
              textShadow: "1px 2px 4px rgba(0, 0, 0, 0.1)",
              letterSpacing: "0.5px",
              textAlign: "center",
              mb: { xs: 0, sm: 0.75, md: 1 }, // Sin margin en móviles
              fontSize: { xs: "1.25rem", sm: "1.75rem", md: "2rem" }, // Título más pequeño en móviles
              lineHeight: { xs: 1.2, sm: 1.3 }, // Line height ajustado
            }}
          >
            Escanear Artículos
          </Typography>

          {/* Formulario compacto */}
          <Box sx={{ flexShrink: 0 }}>
            <ScannerForm
              bodega={bodega}
              bodegas={bodegas}
              codigoInput={codigoInput}
              setCodigoInput={setCodigoInput}
              isScanning={isScanning}
              totalItems={totalItems}
              onBodegaChange={handleBodegaChange}
              onAgregarCodigo={agregarCodigo}
            />
          </Box>

          {/* Stats compactas */}
          <Box sx={{ flexShrink: 0 }}>
            <ScannerStats
              uniqueCount={codigos.length}
              totalItems={totalItems}
              observaciones={observaciones}
              onObservaciones={() => setObservacionesModalOpen(true)}
            />
          </Box>

          {/* Divider más delgado */}
          <Divider
            sx={{
              my: { xs: 0.25, sm: 0.75, md: 1 }, // Margen mínimo en móviles
              borderColor: "primary.main",
              display: { xs: "none", sm: "block" }, // Ocultar en móviles para ahorrar espacio
            }}
          />

          {/* Lista con flex optimizado */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              overflow: "hidden",
              mt: { xs: 0, sm: 0 }, // Sin margin top
            }}
          >
            <ScannerList
              articulos={codigos}
              onDelete={(codigo) =>
                setConfirmModal({ open: true, type: "delete", item: codigo })
              }
              onReduce={reducirCantidad}
              hasData={codigos.length > 0}
              isLoading={isLoading}
              onEnviar={handleEnviar}
              onCancelar={() =>
                setConfirmModal({
                  open: true,
                  type: "cancel",
                  count: codigos.length,
                })
              }
            />
          </Box>
        </Card>

        <NuevaReferenciaAlert
          ultimoAgregado={ultimoAgregado}
          alertCounter={alertCounter}
        />

        <GeneralConfirmModal
          open={confirmModal.open}
          type={confirmModal.type}
          item={confirmModal.item}
          count={confirmModal.count}
          onConfirm={
            confirmModal.type === "print"
              ? () => handlePrintSelection(93)
              : handleConfirm
          }
          onCancel={
            confirmModal.type === "print"
              ? () => handlePrintSelection(2)
              : handleCancelConfirm
          }
          onClose={handleCancelConfirm}
        />

        <EnvioLoadingModal open={modalCargando} />

        <ObservacionesModal
          open={observacionesModalOpen}
          onClose={() => setObservacionesModalOpen(false)}
          value={observaciones}
          onSave={setObservaciones}
        />

        <SnackbarAlert
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={closeSnackbar}
        />
      </Box>
    </>
  );
};

export default ArticulosLayout;
