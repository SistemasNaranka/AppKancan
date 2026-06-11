import { useState, useCallback } from "react";
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

import { useHybridExtractor } from "../hooks/useHybridExtractor";
import { useAuth } from "@/auth/hooks/useAuth";

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
import { TourProvider } from "../components/TourContext";

import { DatosFacturaPDF, EstadoProceso, getNitSinDv } from "../types";
import {
  ESTADO_CONFIG,
  executeContabilizarFactura,
} from "../utils/contabilizacion";

import {
  saveNitAutomatic,
  getAutomaticByNit,
  getSupplierByNit,
  getGoodsReceiptsBySupplierId,
  updateGoodsReceiptStatus,
} from "../services/api";

export default function Home() {
  const [datosFactura, setDatosFactura] = useState<DatosFacturaPDF | null>(
    null,
  );
  const [modalAutomaticoOpen, setModalAutomaticoOpen] = useState(false);
  const [nitActual, setNitActual] = useState<string | null>(null);
  const [, setGuardandoAutomatico] = useState(false);
  const [, setAutomaticoAsignado] = useState<string | null>(
    null,
  );
  const [entradas, setEntradas] = useState<any[]>([]);
  const [entradaSeleccionada, setEntradaSeleccionada] = useState<string>("");
  const [modalEntradasOpen, setModalEntradasOpen] = useState(false);
  const [modalNoEntradasOpen, setModalNoEntradasOpen] = useState(false);

  const handleEntradaChange = useCallback((documentNumber: string) => {
    setEntradaSeleccionada(documentNumber);
    setDatosFactura((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        entrada: documentNumber,
      };
    });
  }, []);

  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  const { user } = useAuth();
  const geminiApiKey = user?.ia_key;
  const modelosIA = user?.models_ia;

  const hybridExtractor = useHybridExtractor(geminiApiKey, modelosIA);

  const {
    extractData,
    isProcessing,
    error,
    progress,
    clearError,
    estadoHibrido,
  } = hybridExtractor;

  const handleFileSelected = useCallback(
    async (file: File) => {
      try {
        setAutomaticoAsignado(null);
        setEntradas([]);
        setEntradaSeleccionada("");

        const datos = await extractData(file);
        let entries: any[] = [];
        let selectedEntry = "";

        if (datos.proveedor.nif) {
          const nitSinDv = getNitSinDv(datos.proveedor.nif);
          
          const proveedorData = await getAutomaticByNit(nitSinDv);
          if (proveedorData && proveedorData.automatic) {
            datos.automaticoAsignado = proveedorData.automatic;
            setAutomaticoAsignado(proveedorData.automatic);
          }

          setNitActual(nitSinDv);

          try {
            const supplier = await getSupplierByNit(nitSinDv);
            if (supplier && supplier.id) {
              const goodsReceipts = await getGoodsReceiptsBySupplierId(supplier.id);
              if (goodsReceipts && goodsReceipts.length > 0) {
                entries = goodsReceipts;
                if (goodsReceipts.length === 1) {
                  selectedEntry = goodsReceipts[0].document_number;
                  datos.entrada = selectedEntry;
                } else {
                  setModalEntradasOpen(true);
                }
              } else {
                setModalNoEntradasOpen(true);
              }
            } else {
              setModalNoEntradasOpen(true);
            }
          } catch (apiErr) {
            console.error("Error al buscar proveedor o entradas:", apiErr);
            setModalNoEntradasOpen(true);
          }
        }

        setEntradas(entries);
        setEntradaSeleccionada(selectedEntry);
        setDatosFactura(datos);
      } catch (err) {
        console.error("Error procesando archivo:", err);
      }
    },
    [extractData, geminiApiKey],
  );

  const handleRetry = useCallback(() => {
    clearError();
  }, [clearError]);

  const handleClear = useCallback(() => {
    clearError();
    setDatosFactura(null);
    setEntradas([]);
    setEntradaSeleccionada("");
    setModalNoEntradasOpen(false);
  }, [clearError]);

  const handleNewFile = useCallback(() => {
    setDatosFactura(null);
    clearError();
    setEntradas([]);
    setEntradaSeleccionada("");
    setModalNoEntradasOpen(false);
  }, [clearError]);

  const handleContabilizar = useCallback(async (datos: DatosFacturaPDF) => {
    const docNumber = datos.entrada || entradaSeleccionada;
    if (docNumber) {
      const entryObj = entradas.find((e) => e.document_number === docNumber);
      if (entryObj && entryObj.id) {
        try {
          await updateGoodsReceiptStatus(entryObj.id, "en_proceso");
          console.log(`Estado de entrada #${docNumber} actualizado a 'en_proceso'`);
        } catch (err) {
          console.error("Error al actualizar estado de la entrada:", err);
        }
      }
    }
    executeContabilizarFactura(datos);
  }, [entradas, entradaSeleccionada]);

  const handleUpdateResolution = useCallback(async () => {
    if (!datosFactura) return;

    if (!datosFactura.proveedor.nif || !datosFactura.proveedor.nombre) {
      setNotification({
        open: true,
        message:
          "Error: Se requiere NIT y nombre del proveedor para actualizar la resolución",
        severity: "error",
      });
      return;
    }

      try {
        const nitString = getNitSinDv(datosFactura.proveedor.nif);

        const proveedorExistente = await getAutomaticByNit(nitString);

        if (proveedorExistente && proveedorExistente.automatic) {
          console.log(
            "Proveedor encontrado por NIT sin DV, usando automático:",
            proveedorExistente.automatic,
          );
          const nuevosDatos = {
            ...datosFactura,
            automaticoAsignado: proveedorExistente.automatic,
            entrada: datosFactura.entrada || entradaSeleccionada || undefined,
          };
          setAutomaticoAsignado(proveedorExistente.automatic);
          setDatosFactura(nuevosDatos);
          handleContabilizar(nuevosDatos);
        } else {
          setNitActual(nitString);
          setModalAutomaticoOpen(true);
        }
    } catch (error) {
      console.error("Error al verificar proveedor:", error);
      setNotification({
        open: true,
        message:
          "Error de conexión. No se puede proceder sin validar el proveedor en la base de datos.",
        severity: "error",
      });
    }
  }, [datosFactura, handleContabilizar]);

  const handleSaveAutomatic = useCallback(
    async (automatico: string) => {
      if (!nitActual || !datosFactura) return;

      const nombreProveedor = datosFactura.proveedor.nombre;
      const nitProveedor = getNitSinDv(nitActual);

      console.log("Datos a guardar:", {
        nit: nitProveedor,
        automatico,
        nombreProveedor,
        numeroFactura: datosFactura.numeroFactura,
        valorFactura: datosFactura.total,
      });

      setGuardandoAutomatico(true);
      try {
        await saveNitAutomatic(
          String(nitProveedor).trim(),
          String(automatico).trim(),
          String(nombreProveedor).trim(),
          datosFactura.numeroFactura,
          datosFactura.total,
        );

        setAutomaticoAsignado(automatico);
        setModalAutomaticoOpen(false);

        setNotification({
          open: true,
          message: `Proveedor registrado exitosamente con automático: ${automatico}`,
          severity: "success",
        });

        const nuevosDatos = {
          ...datosFactura,
          automaticoAsignado: automatico,
          entrada: datosFactura.entrada || entradaSeleccionada || undefined,
        };
        setDatosFactura(nuevosDatos);

        handleContabilizar(nuevosDatos);
      } catch (error) {
        console.error("Error al guardar automático:", error);
        setNotification({
          open: true,
          message: "Error al guardar el registro. Por favor, intenta de nuevo.",
          severity: "error",
        });
      } finally {
        setGuardandoAutomatico(false);
      }
    },
    [nitActual, datosFactura, handleContabilizar],
  );

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  const getStatus = (): EstadoProceso => {
    if (isProcessing) {
      if (progress < 30) return "cargando";
      if (progress < 70) return "procesando";
      if (progress < 90) return "validando";
      return "procesando";
    }
    if (error) return "error";
    if (datosFactura) return "completado";
    return "idle";
  };

  const getProcessingMessage = (): string => {
    if (progress < 15) return "Validando archivo PDF...";
    if (progress < 25) return "Preparando documento...";
    if (progress < 35) return "Conectando con Google Gemini...";
    if (progress < 50) return "Enviando documento a la IA...";
    if (progress < 65) return "Analizando factura con IA...";
    if (progress < 80) return "Procesando respuesta JSON...";
    if (progress < 95) return "Validando datos extraídos...";
    return "¡Extracción completada!";
  };

  const estado = getStatus();

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
            <FileUploadArea
              onFileSelected={handleFileSelected}
              isProcessing={isProcessing}
              progress={progress}
            />
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
              {/* Los errores de procesamiento se muestran en ErrorDisplay */}
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

              {/* Botones de acción */}
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
                    borderRadius: 2,
                    textTransform: "none",
                    color: "#fff",
                    px: 3,
                    py: 1.2,
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    background:
                      "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                    boxShadow: "0 4px 14px rgba(239, 68, 68, 0.35)",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                      boxShadow: "0 6px 20px rgba(239, 68, 68, 0.45)",
                      transform: "translateY(-1px)",
                    },
                    "&:active": {
                      transform: "translateY(0)",
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
                        background:
                          "linear-gradient(135deg, #004680 0%, #0066cc 100%)",
                        boxShadow: "0 4px 14px rgba(0, 70, 128, 0.35)",
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          background:
                            "linear-gradient(135deg, #003d66 0%, #0052a3 100%)",
                          boxShadow: "0 6px 20px rgba(0, 70, 128, 0.45)",
                          transform: "translateY(-1px)",
                        },
                        "&:active": {
                          transform: "translateY(0)",
                        },
                        "&.Mui-disabled": {
                          background: "#e2e8f0",
                          color: "#94a3b8",
                          boxShadow: "none",
                          pointerEvents: "none",
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