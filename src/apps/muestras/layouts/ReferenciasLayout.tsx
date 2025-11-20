import React from "react";
import {
  Box,
  Typography,
  Card,
  Dialog,
  DialogContent,
  Divider,
  useTheme,
  Alert,
  Slide,
} from "@mui/material";
import SnackbarAlert from "@/auth/components/SnackbarAlert";
import { useSnackbar } from "@/auth/hooks/useSnackbar";
import { useScannerLogic } from "../hooks/useScannerLogic";
import ScannerForm from "../components/ScannerForm";
import ScannerList from "../components/ScannerList";
import { ScannerStats } from "../components/scanner/ScannerStats";
import { AlertDialog } from "../components/AlertDialog";
import { enviarMuestras } from "../api/sendReferencias";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { Global } from "@emotion/react";

const ArticulosLayout: React.FC = () => {
  const theme = useTheme();
  const { snackbar, closeSnackbar, showSnackbar } = useSnackbar();
  const [isLoading] = React.useState(false);
  const [confirmModal, setConfirmModal] = React.useState<{
    open: boolean;
    type: "cancel" | "delete";
    item?: string;
    count?: number;
  }>({ open: false, type: "cancel" });
  const [modalCargando, setModalCargando] = React.useState(false);

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
    handleBodegaChange,
    agregarCodigo,
    eliminarCodigo,
    reducirCantidad,
    limpiarTodo,
  } = useScannerLogic();

  const handleEnviar = async () => {
    if (codigos.length === 0) {
      showSnackbar("No hay códigos para enviar", "warning");
      return;
    }

    if (!bodega || bodega.trim() === "") {
      showSnackbar("Debe seleccionar una bodega", "warning");
      return;
    }

    setModalCargando(true);

    try {
      await enviarMuestras(codigos, bodega);
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
    setConfirmModal({ open: false, type: "cancel" });
  };

  const handleCancelConfirm = () => {
    setConfirmModal({ open: false, type: "cancel" });
  };

  return (
    <>
      <Global
        styles={{
          "@keyframes spin": {
            "0%": { transform: "rotate(0deg)" },
            "100%": { transform: "rotate(360deg)" },
          },
          "@keyframes slideInRight": {
            "0%": {
              transform: "translateX(100%)",
              opacity: 0,
            },
            "100%": {
              transform: "translateX(0)",
              opacity: 1,
            },
          },
          "@keyframes pulse": {
            "0%, 100%": {
              transform: "scale(1)",
            },
            "50%": {
              transform: "scale(1.05)",
            },
          },
          "@keyframes bounce": {
            "0%, 100%": {
              transform: "translateY(0)",
            },
            "50%": {
              transform: "translateY(-10px)",
            },
          },
        }}
      />

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

        {/* ALERTA ANIMADA - Más compacta en móviles */}
        <Slide
          direction="right"
          in={!!ultimoAgregado}
          mountOnEnter
          unmountOnExit
          timeout={300}
        >
          <Alert
            key={alertCounter}
            severity="success"
            icon={
              <CheckCircleIcon
                sx={{
                  fontSize: { xs: 20, sm: 24, md: 28 },
                  animation: "pulse 0.6s ease-in-out",
                }}
              />
            }
            sx={{
              position: "absolute",
              top: { xs: 5, sm: 25, md: 30 },
              left: { xs: 5, sm: 25, md: 30 },
              right: { xs: 5, sm: "auto" }, // Añadir right en móviles para centrar mejor
              zIndex: 1300,
              minWidth: { xs: "auto", sm: 200, md: 250 },
              maxWidth: { xs: "calc(40% - 10px)", sm: "calc(80% - 40px)" },
              boxShadow: {
                xs: "0 2px 8px rgba(76, 175, 80, 0.12)",
                sm: "0 4px 14px rgba(76, 175, 80, 0.15)",
              },
              backgroundColor: "#f1f8f4",
              color: "#1b5e20",
              border: { xs: "1.5px solid #81c784", sm: "2px solid #81c784" },
              borderRadius: { xs: 1.5, sm: 2 },
              fontWeight: 600,
              py: { xs: 0.5, sm: 1 }, // Padding vertical mínimo
              px: { xs: 1, sm: 2 }, // Padding horizontal mínimo
              "& .MuiAlert-icon": {
                color: "#2e7d32",
                padding: { xs: "4px 0", sm: "7px 0" }, // Padding del icono
              },
              "& .MuiAlert-message": {
                display: "flex",
                alignItems: "center",
                flexWrap: "nowrap", // No wrap en móviles
                padding: 0,
                overflow: "hidden",
              },
            }}
          >
            <Typography
              variant="body2"
              fontWeight="600"
              color="#1b5e20"
              sx={{
                fontSize: { xs: "0.9rem", sm: "0.9rem", md: "1rem" },
                whiteSpace: "nowrap", // Evitar saltos de línea
                overflow: "hidden",
                textOverflow: "ellipsis", // Puntos suspensivos si es muy largo
              }}
            >
              Ref.{" "}
              <Box
                component="span"
                sx={{
                  fontFamily: "monospace",
                  fontWeight: 800,
                  fontSize: { xs: "0.95rem", sm: "0.95rem", md: "1.05rem" },
                }}
              >
                {ultimoAgregado}
              </Box>{" "}
              agregada
            </Typography>
          </Alert>
        </Slide>

        <AlertDialog
          open={confirmModal.open}
          title={
            confirmModal.type === "cancel"
              ? "Confirmar reinicio"
              : "Confirmar eliminación"
          }
          message={
            confirmModal.type === "cancel" ? (
              <>
                ¿Está seguro de reiniciar la lista? Se eliminarán{" "}
                <span
                  style={{
                    color: theme.palette.primary.main,
                    fontWeight: "bold",
                  }}
                >
                  {confirmModal.count}
                </span>{" "}
                referencias.
              </>
            ) : (
              <>
                ¿Está seguro de eliminar la referencia{" "}
                <span
                  style={{
                    color: theme.palette.primary.main,
                    fontWeight: "bold",
                  }}
                >
                  {confirmModal.item}
                </span>
                ?
              </>
            )
          }
          onConfirm={handleConfirm}
          onCancel={handleCancelConfirm}
          confirmText="Confirmar"
          cancelText="Cancelar"
        />

        <Dialog
          open={modalCargando}
          disableEscapeKeyDown
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: { xs: 2, sm: 4 },
              p: 0,
              background: "rgba(255,255,255,0.98)",
              boxShadow: "0 10px 40px 0 rgba(0,0,0,0.18)",
              minWidth: { xs: 260, sm: 320, md: 340 },
              mx: { xs: 2, sm: 0 },
            },
          }}
        >
          <DialogContent
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: { xs: 160, sm: 200 },
              py: { xs: 2.5, sm: 4 },
              px: { xs: 2, sm: 3 },
              gap: { xs: 1, sm: 2 },
            }}
          >
            <AutorenewIcon
              sx={{
                fontSize: { xs: 40, sm: 48, md: 54 },
                color: "primary.main",
                mb: { xs: 1, sm: 2 },
                animation: "spin 1.2s linear infinite",
              }}
            />
            <Typography
              variant="h6"
              sx={{
                mt: { xs: 0, sm: 1 },
                fontWeight: 700,
                color: "primary.main",
                letterSpacing: 0.5,
                fontSize: { xs: "1rem", sm: "1.25rem" },
                textAlign: "center",
              }}
            >
              Enviando muestras...
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: { xs: 0, sm: 0.5 },
                textAlign: "center",
                fontSize: { xs: "0.8rem", sm: "0.875rem" },
                px: { xs: 1, sm: 0 },
              }}
            >
              Por favor espera unos segundos mientras procesamos tu solicitud.
            </Typography>
          </DialogContent>
        </Dialog>

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
