/**
 * Página principal para carga y visualización de facturas PDF
 * Módulo de Contabilización de Facturas
 * Integrado con Google Gemini y Ollama como fallback
 */

import { useState, useCallback, useEffect } from "react";
import { Box, Typography, Paper, Button, Chip, Alert, Snackbar } from "@mui/material";
import {
  CheckCircle,
  SmartToy,
  Description,
  ReceiptLong,
  Cancel,
  Update,
} from "@mui/icons-material";

// Hooks
import { useHybridExtractor } from "../hooks/useHybridExtractor";
import { useAuth } from "@/auth/hooks/useAuth";

// Componentes modulares
import { FileUploadArea } from "../components/FileUploadArea";
import { InvoiceInfoCard } from "../components/InvoiceInfoCard";
import {
  ProcessingFeedback,
  ErrorDisplay,
} from "../components/FeedbackComponents";
import {
  IAStatusBadge,
  ProveedorProcesamiento,
} from "../components/IAStatusBadge";
import { AutomaticoModal } from "../components/AutomaticoModal";

// Tours interactivos
import { TourProvider, useTourContext } from "../components/TourContext";
import { FacturasTour } from "../components/FacturasTour";
import { FloatingHelpButton } from "../components/FloatingHelpButton";

// Utilidades y tipos
import { DatosFacturaPDF, EstadoProceso } from "../types";
import {
  ESTADO_CONFIG,
  ejecutarActualizarResolucion,
} from "../utils/resolucion";

// API
import { saveNitAutomatico, getAutomaticoByNit } from "../services/api";

// Datos de ejemplo para el tour
const MOCK_DATOS_FACTURA = {
  numeroFactura: "FAC-2024-001234",
  fechaEmision: new Date().toISOString().split('T')[0],
  fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  proveedor: {
    nombre: "Proveedor Demo S.A.S.",
    nif: "900123456-7",
  },
  moneda: "COP",
  subtotal: 1500000,
  total: 1815000,
  impuestos: [
    { tipo: 19, base: 1500000, importe: 285000 },
  ],
  conceptos: [
    { descripcion: "Servicios de consultoría mensual", cantidad: 1, precioUnitario: 1500000, importe: 1500000 },
  ],
  archivo: { nombre: "factura_ejemplo.pdf", tamaño: 0, fechaCarga: new Date().toISOString() },
} as DatosFacturaPDF;

// Componente interno que usa el contexto del tour
function HomeContent() {
  const {
    tourPhase,
    setShowInvoiceDataCallback,
    setShowCauseButtonCallback,
    setOnTourStartCallback,
    setOpenAutomaticoModalCallback,
    setOnFileSelectedCallback,
    onFileSelected,
    hasUploadedFile,
    isTourRunning,
  } = useTourContext();
  
  const [datosFactura, setDatosFactura] = useState<DatosFacturaPDF | null>(null);
  const [modelosDisponibles, setModelosDisponibles] = useState<string[]>([]);
  const [cargandoModelos, setCargandoModelos] = useState(true);
  const [conexionErrorOllama, setConexionErrorOllama] = useState(false);
  const [modalAutomaticoOpen, setModalAutomaticoOpen] = useState(false);
  const [nitActual, setNitActual] = useState<string | null>(null);
  const [guardandoAutomatico, setGuardandoAutomatico] = useState(false);
  const [automaticoAsignado, setAutomaticoAsignado] = useState<string | null>(null);

  // Estados para notificaciones
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,    
    message: "",
    severity: "info",
  });

  // Obtener usuario autenticado
  const { user } = useAuth();
  const geminiApiKey = user?.key_gemini;
  const modeloIA = user?.modelo_ia;

  // Hook de extracción híbrido
  const hybridExtractor = useHybridExtractor(geminiApiKey, modeloIA);

  // Inicializar modelos al montar
  useEffect(() => {
    const inicializar = async () => {
      setCargandoModelos(true);
      setConexionErrorOllama(false);
      try {
        const modelos = await hybridExtractor.getModelosDisponibles();
        setModelosDisponibles(modelos);
        if (modelos.length > 0 && !hybridExtractor.modeloActual) {
          hybridExtractor.setModelo(modelos[0]);
        }
      } catch {
        console.log("No se pudieron cargar los modelos de Ollama");
        setConexionErrorOllama(true);
      } finally {
        setCargandoModelos(false);
      }
    };
    inicializar();
  }, []);

  // Registrar callback para mostrar datos de factura durante el tour
  useEffect(() => {
    setShowInvoiceDataCallback(() => {
      // El tour avanzará a la fase INVOICE_DATA
    });
  }, [setShowInvoiceDataCallback]);

  useEffect(() => {
    setShowCauseButtonCallback(() => {
      // El botón ya está visible cuando showInvoiceView es true
    });
  }, [setShowCauseButtonCallback]);

  const {
    extractData,
    isProcessing,
    error,
    progress,
    clearError,
    estadoHibrido,
  } = hybridExtractor;

  // Registrar callback de reset: limpia datosFactura para que el tour empiece desde cero
  // Debe ir DESPUÉS de que clearError esté declarado
  useEffect(() => {
    setOnTourStartCallback(() => {
      setDatosFactura(null);
      clearError();
    });
  }, [setOnTourStartCallback, clearError]);

  // Cerrar el modal automático cuando el tour termina (por cualquier motivo)
  useEffect(() => {
    if (!isTourRunning) {
      setModalAutomaticoOpen(false);
      setNitActual(null);
    }
  }, [isTourRunning]);

  // Registrar callback para abrir el AutomaticoModal durante el tour con datos mock
  useEffect(() => {
    setOpenAutomaticoModalCallback(() => {
      setNitActual("900123456-7");
      setModalAutomaticoOpen(true);
    });
  }, [setOpenAutomaticoModalCallback]);

  // Registrar callback para avanzar el tour cuando se selecciona un archivo
  useEffect(() => {
    setOnFileSelectedCallback(() => {
      // El tour avanzará a la siguiente fase cuando se seleccione un archivo
      // La lógica de avance está en el TourContext
    });
  }, [setOnFileSelectedCallback]);

  const handleFileSelected = useCallback(
    async (file: File) => {
      if (!geminiApiKey && conexionErrorOllama) {
        return;
      }

      // Si el tour está activo, marcar que se subió archivo y avanzar el tour después de procesar
      if (isTourRunning && tourPhase === "UPLOAD") {
        // Llamar onFileSelected para avanzar el tour (esto cierra el step actual y avanza a la siguiente fase)
        onFileSelected();
      }

      try {
        setAutomaticoAsignado(null);
        const datos = await extractData(file);
        
        if (datos.proveedor.nif) {
          const proveedorData = await getAutomaticoByNit(datos.proveedor.nif);
          if (proveedorData && proveedorData.automatico) {
            datos.automaticoAsignado = proveedorData.automatico;
            setAutomaticoAsignado(proveedorData.automatico);
          }
        }
        
        setDatosFactura(datos);
      } catch (err) {
        console.error("Error procesando archivo:", err);
      }
    },
    [extractData, geminiApiKey, conexionErrorOllama]
  );

  const handleRetry = useCallback(() => {
    clearError();
  }, [clearError]);

  const handleClear = useCallback(() => {
    clearError();
    setDatosFactura(null);
  }, [clearError]);

  const handleNewFile = useCallback(() => {
    setDatosFactura(null);
    clearError();
  }, [clearError]);

  const handleActualizarResolucion = useCallback(async () => {
    // Durante el tour usar datos mock, fuera del tour usar datosFactura
    const facturaActual = (isTourRunning && !hasUploadedFile) ? MOCK_DATOS_FACTURA : datosFactura;
    if (!facturaActual) return;

    if (!facturaActual.proveedor.nif || !facturaActual.proveedor.nombre) {
      setNotification({
        open: true,
        message: "Error: Se requiere NIT y nombre del proveedor para actualizar la resolución",
        severity: "error",
      });
      return;
    }

    try {
      const nitString = String(facturaActual.proveedor.nif).trim();
      const proveedorExistente = await getAutomaticoByNit(nitString);

      if (proveedorExistente && proveedorExistente.automatico) {
        facturaActual.automaticoAsignado = proveedorExistente.automatico;
        setAutomaticoAsignado(proveedorExistente.automatico);
        ejecutarActualizarResolucion(facturaActual);
      } else {
        setNitActual(facturaActual.proveedor.nif);
        setModalAutomaticoOpen(true);
      }
    } catch (error) {
      console.error("Error al verificar proveedor:", error);
      setNotification({
        open: true,
        message: "Error de conexión. No se puede proceder sin validar el proveedor en la base de datos.",
        severity: "error",
      });
    }
  }, [datosFactura, isTourRunning, hasUploadedFile]);

  const handleGuardarAutomatico = useCallback(async (automatico: string) => {
    if (!nitActual || !datosFactura) return;

    const nombreProveedor = datosFactura.proveedor.nombre;
    const nitProveedor = nitActual;

    console.log("Datos a guardar:", {
      nit: nitProveedor,
      automatico,
      nombreProveedor,
      numeroFactura: datosFactura.numeroFactura,
      valorFactura: datosFactura.total
    });

    setGuardandoAutomatico(true);
    try {
      await saveNitAutomatico(
        String(nitProveedor).trim(),
        String(automatico).trim(),
        String(nombreProveedor).trim(),
        datosFactura.numeroFactura,
        datosFactura.total
      );
      
      setAutomaticoAsignado(automatico);
      setModalAutomaticoOpen(false);
      
      setNotification({
        open: true,
        message: `Proveedor registrado exitosamente con automático: ${automatico}`,
        severity: "success",
      });
      
      setDatosFactura({
        ...datosFactura,
        automaticoAsignado: automatico
      });
      
      ejecutarActualizarResolucion(datosFactura);
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
  }, [nitActual, datosFactura]);

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const getEstado = (): EstadoProceso => {
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

  const estado = getEstado();

  const getMensajeProcesamiento = () => {
    if (estadoHibrido.errorGemini && estadoHibrido.intentoOllama) {
      if (progress < 40) return "Gemini no disponible, cambiando a Ollama...";
      if (progress < 50) return "Conectando con Ollama...";
      if (progress < 60) return "Analizando factura con Ollama...";
      if (progress < 80) return "Procesando respuesta...";
      return "Finalizando extracción...";
    }

    if (progress < 15) return "Validando archivo PDF...";
    if (progress < 25) return "Preparando documento...";
    if (progress < 35) return "Conectando con Google Gemini...";
    if (progress < 50) return "Enviando documento a la IA...";
    if (progress < 65) return "Analizando factura con IA...";
    if (progress < 80) return "Procesando respuesta JSON...";
    if (progress < 95) return "Validando datos extraídos...";
    return "¡Extracción completada!";
  };

  // Fases del tour que necesitan mostrar la vista de factura
  const tourInvoicePhases = ["INVOICE_DATA", "CAUSE_BUTTON", "AUTOMATICO_MODAL"];

  // Determinar si debemos mostrar la vista de datos de factura
  const showInvoiceView = datosFactura !== null || (isTourRunning && tourInvoicePhases.includes(tourPhase));

  // Usar datos mock o reales según corresponda
  const invoiceData = (isTourRunning && tourInvoicePhases.includes(tourPhase) && !hasUploadedFile)
    ? MOCK_DATOS_FACTURA
    : datosFactura;

  return (
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
            //label={ESTADO_CONFIG[estado].label}
            //color={ESTADO_CONFIG[estado].color}
            size="small"
            sx={{ fontWeight: 600 }} 
          />
        )}
      </Box>

      {/* Estado de IA discreto */}
      {estado === "idle" && !showInvoiceView && (
        <IAStatusBadge
          className="tour-factura-ia-status"
          geminiApiKeyConfigured={!!geminiApiKey}
          conexionErrorOllama={conexionErrorOllama}
          modelosDisponibles={modelosDisponibles}
          modeloIA={modeloIA}
        />
      )}

      {/* Contenido principal */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Vista de carga/selección — ocultar durante el tour cuando hay datos de factura */}
        {estado === "idle" && !showInvoiceView && (
          <FileUploadArea
            className="tour-factura-upload"
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
              message={getMensajeProcesamiento()}
              progress={progress}
              isProcessing={isProcessing}
            />
            {estadoHibrido.errorGemini && (
              <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                <Typography variant="caption">
                  <strong>Gemini no disponible:</strong>{" "}
                  {estadoHibrido.errorGemini}
                  <br />
                  Usando Ollama como fallback...
                </Typography>
              </Alert>
            )}
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

        {/* Vista de éxito / Tour: datos de factura */}
        {showInvoiceView && invoiceData && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <InvoiceInfoCard 
              className="tour-factura-info"
              datosFactura={invoiceData} 
            />

            {estadoHibrido.proveedorUsado && (
              <ProveedorProcesamiento
                proveedor={estadoHibrido.proveedorUsado}
                modelo={estadoHibrido.modeloUsado}
              />
            )}
          </Box>
        )}

        {/* Botones de acción — visibles siempre que haya vista de factura,
            independientemente de si invoiceData está disponible en ese instante */}
        {showInvoiceView && (
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
                "&:active": { transform: "translateY(0)" },
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleActualizarResolucion}
              startIcon={<Update />}
              className="tour-factura-cause"
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
                "&:active": { transform: "translateY(0)" },
              }}
            >
              Causar factura
            </Button>
          </Box>
        )}
      </Box>

      {/* Modal para ingresar número automático */}
      <AutomaticoModal
        open={modalAutomaticoOpen}
        nit={nitActual}
        proveedorNombre={datosFactura?.proveedor.nombre}
        numeroFactura={datosFactura?.numeroFactura}
        onClose={() => setModalAutomaticoOpen(false)}
        onConfirm={handleGuardarAutomatico}
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

      {/* Botón flotante de ayuda - se oculta cuando hay notificaciones */}
      <FloatingHelpButton hideWhenNotification notificationOpen={notification.open} />
    </Box>
  );
}

export default function Home() {
  return (
    <TourProvider>
      <FacturasTour>
        <HomeContent />
      </FacturasTour>
    </TourProvider>
  );
}