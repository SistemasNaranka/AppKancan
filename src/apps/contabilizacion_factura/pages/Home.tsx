import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Alert,
  Snackbar,
  Tooltip,
} from "@mui/material";
import CheckCircle from '@mui/icons-material/CheckCircle';
import SmartToy from '@mui/icons-material/SmartToy';
import ReceiptLong from '@mui/icons-material/ReceiptLong';
import Cancel from '@mui/icons-material/Cancel';
import Update from '@mui/icons-material/Update';

// Hooks
import { useHomeLogic } from "../hooks/useHomeLogic";

import { FileUploadArea } from "../components/FileUploadArea";
import { InvoiceInfoCard } from "../components/InvoiceInfoCard";
import {
  ProcessingFeedback,
  ErrorDisplay,
} from "../components/FeedbackComponents";
import {
  IAStatusBadge,
  ProviderProcessing,
} from "../components/IAStatusBadge";
import { AutomaticModal } from "../components/AutomaticoModal";
import { GoodsReceiptModal } from "../components/GoodsReceiptModal";
import { NoEntradasModal } from "../components/NoEntradasModal";
import { ConfirmUltraModal } from "../components/ConfirmUltraModal";
import { CausacionProgressModal } from "../components/CausacionProgressModal";
import { TourProvider } from "../components/TourContext";

// Utilidades y tipos
import { ESTADO_CONFIG } from "../utils/contabilizacion";

export default function Home() {
  const {
    datosFactura,
    modalAutomaticoOpen,
    setModalAutomaticoOpen,
    nitActual,
    entradas,
    entradaSeleccionada,
    modalEntradasOpen,
    setModalEntradasOpen,
    modalNoEntradasOpen,
    setModalNoEntradasOpen,
    modalConfirmUltraOpen,
    setModalConfirmUltraOpen,
    causacionProgressOpen,
    setCausacionProgressOpen,
    causacionEntryId,
    causacionEntryNumber,
    handleCausacionSuccess,
    handleCausacionFailure,
    notification,
    handleCloseNotification,
    isProcessing,
    progress,
    error,
    estadoHibrido,
    geminiApiKey,
    modelosIA,
    estado,
    handleEntradaChange,
    handleFileSelected,
    handleRetry,
    handleClear,
    handleNewFile,
    handleContabilizar,
    handleUpdateResolution,
    handleSaveAutomatic,
    getProcessingMessage,
  } = useHomeLogic();

  return (
    <TourProvider>
      <Box sx={{ p: 2, width: "100%", maxWidth: "100%", overflowX: "hidden" }}>
        {/* Header compacto */}
        <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
          <ReceiptLong sx={{ fontSize: 28, color: "primary.main" }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={700}>
              Contabilización de Facturas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sube tus facturas PDF para extraer datos con IA
            </Typography>
          </Box>

          {/* Indicador de estado */}
          {estado !== "idle" && (
            <Chip
              icon={estado === "completado" ? <CheckCircle /> : <SmartToy />}
              label={ESTADO_CONFIG[estado].label}
              color={ESTADO_CONFIG[estado].color}
              size="small"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Box>

        {/* Estado de IA discreto */}
        {estado === "idle" && (
          <IAStatusBadge
            geminiApiKeyConfigured={!!geminiApiKey}
            modeloIA={(() => {
              if (!modelosIA) return "gemma-3-27b-it";
              try {
                const parsed = typeof modelosIA === "string" ? JSON.parse(modelosIA) : modelosIA;
                if (Array.isArray(parsed)) {
                  const names = parsed.map((m: any) => m.name).filter(Boolean);
                  if (names.length > 0) return names.join(", ");
                }
              } catch (e) {
                console.error("Error parsing models_ia for display:", e);
              }
              return "gemma-3-27b-it";
            })()}
          />
        )}

        {/* Contenido principal */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Vista de carga/selección */}
          {estado === "idle" && (
            <Box>
              {!geminiApiKey && (
                <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                  <strong>Configuración requerida:</strong> No tienes una clave de API de Gemini configurada en tu cuenta de usuario. Configúrala en tu perfil antes de continuar.
                </Alert>
              )}
              <Box sx={!geminiApiKey ? { opacity: 0.5, pointerEvents: "none", cursor: "not-allowed" } : undefined}>
                <FileUploadArea
                  onFileSelected={handleFileSelected}
                  isProcessing={isProcessing}
                  progress={progress}
                />
              </Box>
            </Box>
          )}

          {/* Vista de procesamiento */}
          {isProcessing && (
            <Paper
              elevation={0}
              sx={{
                borderRadius: 2,
                border: "1px solid #eee",
                boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
                p: 2,
              }}
            >
              <ProcessingFeedback
                message={getProcessingMessage()}
                progress={progress}
                isProcessing={isProcessing}
              />
            </Paper>
          )}

          {/* Vista de error */}
          {error && !isProcessing && (
            <ErrorDisplay
              error={error}
              onRetry={handleRetry}
              onClear={handleClear}
            />
          )}

          {/* Vista de éxito */}
          {datosFactura && !isProcessing && !error && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
              <InvoiceInfoCard
                datosFactura={datosFactura}
                entradas={entradas}
                entradaSeleccionada={entradaSeleccionada}
                onSelectEntradaClick={() => setModalEntradasOpen(true)}
              />

              {estadoHibrido.proveedorUsado && (
                <ProviderProcessing
                  proveedor={estadoHibrido.proveedorUsado}
                  modelo={estadoHibrido.modeloUsado}
                />
              )}

              {/* Botones de acción y Confirmación de Protocolo */}
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "flex-end",
                  pt: 2.5,
                  pb: 0.5,
                }}
              >
                <Button
                  variant="contained"
                  onClick={handleNewFile}
                  startIcon={<Cancel />}
                  sx={{
                    backgroundColor: "#EF5350",
                    color: "#FFFFFF",
                    borderRadius: 2,
                    textTransform: "none",
                    px: 3,
                    py: 1.2,
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    boxShadow: "none",
                    "&:hover": {
                      backgroundColor: "#C62828",
                      boxShadow: "none",
                    },
                  }}
                >
                  Cancelar
                </Button>
                <Tooltip
                  title={(!datosFactura.entrada && !entradaSeleccionada) ? "No es posible causar la factura sin una entrada de mercancía vinculada" : ""}
                  arrow
                  placement="top"
                >
                  <span style={{ display: "inline-flex", cursor: (!datosFactura.entrada && !entradaSeleccionada) ? "not-allowed" : "pointer" }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleUpdateResolution}
                      disabled={!datosFactura.entrada && !entradaSeleccionada}
                      startIcon={<Update />}
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        px: 3.5,
                        py: 1.2,
                        boxShadow: "none",
                        "&:hover": {
                          boxShadow: "none",
                        },
                      }}
                    >
                      Causar factura
                    </Button>
                  </span>
                </Tooltip>
              </Box>
            </Box>
          )}
        </Box>

        {/* Modal para ingresar número automático cuando el NIT es nuevo */}
        <AutomaticModal
          open={modalAutomaticoOpen}
          nit={nitActual}
          proveedorNombre={datosFactura?.proveedor.nombre}
          numeroFactura={datosFactura?.numeroFactura}
          onClose={() => setModalAutomaticoOpen(false)}
          onConfirm={handleSaveAutomatic}
        />

        {/* Modal para seleccionar entrada de mercancía */}
        <GoodsReceiptModal
          open={modalEntradasOpen}
          entradas={entradas}
          onClose={() => setModalEntradasOpen(false)}
          onConfirm={handleEntradaChange}
        />

        {/* Modal de aviso para cuando no hay entradas vinculadas */}
        <NoEntradasModal
          open={modalNoEntradasOpen}
          nit={nitActual}
          proveedorNombre={datosFactura?.proveedor.nombre}
          onClose={() => setModalNoEntradasOpen(false)}
        />

        {/* Modal de confirmación del estado de Ultra local */}
        <ConfirmUltraModal
          open={modalConfirmUltraOpen}
          onClose={() => setModalConfirmUltraOpen(false)}
          onConfirm={() => {
            if (datosFactura) {
              handleContabilizar(datosFactura);
            }
          }}
        />

        {/* Modal de progreso de causación en tiempo real (WebSockets) */}
        <CausacionProgressModal
          open={causacionProgressOpen}
          goodsReceiptId={causacionEntryId}
          goodsReceiptNumber={causacionEntryNumber}
          onSuccess={handleCausacionSuccess}
          onFailure={handleCausacionFailure}
          onClose={() => setCausacionProgressOpen(false)}
        />

        {/* Notificaciones */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseNotification}
            severity={notification.severity}
            variant="filled"
            sx={{ width: "100%", color: "#FFFFFF" }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </TourProvider>
  );
}